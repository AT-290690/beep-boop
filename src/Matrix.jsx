import {
  matrix,
  sound,
  ensureAudioStarted,
  DEFAULT_SYNTH_PRESET,
  DEFAULT_PITCH_MAP,
  convertTrackerTextToSong,
  fitSongToViewport,
  getNoteId,
  getNoteList,
  getNoteValue,
  INITIAL_DELAY,
  NOTE_DURATION,
  SECOND,
  setSynthPreset,
  serializeSong,
  sortNotes,
  SYNTH_PRESET_OPTIONS,
} from './common.js'
import LZString from 'lz-string'
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import * as Tone from 'tone'
import Note from './Note.jsx'

const useWindowSize = (initial) => {
  const [bounds, setBounds] = useState(initial)
  useLayoutEffect(() => {
    const updateSize = () => {
      setBounds({
        w: Math.floor(window.innerWidth / 50),
        h: Math.floor(window.innerHeight / 45),
      })
    }
    window.addEventListener('resize', updateSize)
    updateSize()
    return () => window.removeEventListener('resize', updateSize)
  }, [])
  return bounds
}

const Matrix = () => {
  const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } =
    LZString
  const [mod, setMod] = useState(15)
  const [width, setWidth] = useState(30)
  const [offset, setOffset] = useState(15)
  const [pitchMap, setPitchMap] = useState(DEFAULT_PITCH_MAP)
  const [shift, setShift] = useState(0)
  const [speed, setSpeed] = useState(0.25)
  const [pagination, setPagination] = useState(0)
  const [notes, setNotes] = useState([])
  const [currentMusic, setCurrentMusic] = useState('')
  const [isSongModalOpen, setIsSongModalOpen] = useState(false)
  const [synthPreset, setSynthPresetState] = useState(DEFAULT_SYNTH_PRESET)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activePlaybackRow, setActivePlaybackRow] = useState(null)

  const resize = useWindowSize({ w: width, h: mod })
  const horizontalScrollRemainder = useRef(0)
  const verticalScrollRemainder = useRef(0)
  const playbackStartRef = useRef(0)
  const isPlayingRef = useRef(false)
  const transportEventIdRef = useRef(null)
  const notesByRowRef = useRef(new Map())
  const pendingSharedPlaybackRef = useRef(false)
  const didLoadSharedSongRef = useRef(false)
  const heldTimeScrollRef = useRef({
    direction: 0,
    startedAt: 0,
    lastTimestamp: 0,
    stepRemainder: 0,
    frameId: null,
  })
  const noteList = getNoteList(pitchMap)
  const notesById = notes.reduce((acc, note) => {
    acc[getNoteId(note)] = note
    return acc
  }, {})
  const getSongStartRow = (songNotes) =>
    songNotes.length
      ? Math.min(
          0,
          songNotes.reduce(
            (currentMin, note) => Math.min(currentMin, note.x),
            songNotes[0].x
          )
        )
      : 0

  const getSerializedCurrentSong = () =>
    serializeSong({
      notes,
      offset,
      speed,
      shift,
      synth: synthPreset,
      pitchMap,
    })

  const updateSharedUrl = (compressedSong) => {
    const nextUrl = new URL(window.location.href)
    if (compressedSong) nextUrl.searchParams.set('l', compressedSong)
    else nextUrl.searchParams.delete('l')
    window.history.replaceState({}, '', nextUrl)
    return nextUrl.toString()
  }

  const applySong = (current, { closeModal = true } = {}) => {
    const nextSong = fitSongToViewport(current, width)
    stopPlayback()
    setSpeed(nextSong.speed)
    setOffset(nextSong.offset)
    setPitchMap(nextSong.pitchMap)
    setShift(nextSong.shift)
    setSynthPresetState(nextSong.synth)
    setNotes(nextSong.notes)
    if (closeModal) setIsSongModalOpen(false)
    callibrateNotes(nextSong.notes)
  }
  const callibrateNotes = (nextNotes) => {
    stopPlayback()
    setPagination(getSongStartRow(nextNotes))
  }

  const offsetNotes = () => {
    callibrateNotes(notes)
  }
  const clearNotes = () => {
    stopPlayback()
    setNotes([])
    setPagination(0)
    updateSharedUrl('')
  }
  const jumpToSongStart = () => {
    setPagination(getSongStartRow(notes))
  }

  const scrollPitchBy = (amount) => {
    if (!amount) return
    setShift((current) => current + amount)
  }

  const scrollTimeBy = (amount) => {
    if (!amount) return
    if (isPlayingRef.current) stopPlayback()
    setPagination((current) => current + amount)
  }

  const stopHeldTimeScroll = () => {
    const currentHold = heldTimeScrollRef.current
    if (currentHold.frameId !== null) {
      window.cancelAnimationFrame(currentHold.frameId)
    }
    heldTimeScrollRef.current = {
      direction: 0,
      startedAt: 0,
      lastTimestamp: 0,
      stepRemainder: 0,
      frameId: null,
    }
  }

  const startHeldTimeScroll = (direction) => {
    const now = performance.now()
    stopHeldTimeScroll()
    heldTimeScrollRef.current = {
      direction,
      startedAt: now,
      lastTimestamp: now,
      stepRemainder: 0,
      frameId: null,
    }

    const tick = (timestamp) => {
      const currentHold = heldTimeScrollRef.current
      if (!currentHold.direction) return

      const deltaSeconds = (timestamp - currentHold.lastTimestamp) / 1000
      const heldForSeconds = (timestamp - currentHold.startedAt) / 1000
      const rowsPerSecond = Math.min(140, 10 + heldForSeconds * 42)

      currentHold.stepRemainder += rowsPerSecond * deltaSeconds
      const wholeSteps = Math.trunc(currentHold.stepRemainder)
      if (wholeSteps) {
        scrollTimeBy(currentHold.direction * wholeSteps)
        currentHold.stepRemainder -= wholeSteps
      }

      currentHold.lastTimestamp = timestamp
      currentHold.frameId = window.requestAnimationFrame(tick)
    }

    heldTimeScrollRef.current.frameId = window.requestAnimationFrame(tick)
  }

  const handleMatrixWheel = (e) => {
    const horizontalDelta = e.deltaX || (e.shiftKey ? e.deltaY : 0)
    const verticalDelta = e.shiftKey && !e.deltaX ? 0 : e.deltaY

    if (!horizontalDelta && !verticalDelta) return

    e.preventDefault()

    if (horizontalDelta) {
      horizontalScrollRemainder.current += horizontalDelta
      const horizontalSteps = Math.trunc(horizontalScrollRemainder.current / 32)
      if (horizontalSteps) {
        scrollPitchBy(horizontalSteps)
        horizontalScrollRemainder.current -= horizontalSteps * 32
      }
    }

    if (verticalDelta) {
      verticalScrollRemainder.current += verticalDelta
      const verticalSteps = Math.trunc(verticalScrollRemainder.current / 32)
      if (verticalSteps) {
        scrollTimeBy(verticalSteps)
        verticalScrollRemainder.current -= verticalSteps * 32
      }
    }
  }

  const revealPlaybackRow = (row) => {
    setPagination(row)
  }

  const finishPlayback = () => {
    isPlayingRef.current = false
    setIsPlaying(false)
    setActivePlaybackRow(null)
  }

  const stopPlayback = () => {
    if (transportEventIdRef.current !== null) {
      Tone.Transport.clear(transportEventIdRef.current)
      transportEventIdRef.current = null
    }
    Tone.Transport.stop()
    Tone.Transport.cancel(0)
    Tone.Transport.position = 0
    finishPlayback()
  }

  const tryStartPendingSharedPlayback = async () => {
    if (!pendingSharedPlaybackRef.current) return
    try {
      await startPlayback()
      pendingSharedPlaybackRef.current = false
    } catch (_) {
      // Audio start may still require a gesture; keep the pending flag set.
    }
  }

  const toggleNote = async ({ x, y, noteValue }) => {
    if (!noteValue) return
    const id = getNoteId({ x, y })
    if (notesById[id]) {
      setNotes((current) => current.filter((note) => getNoteId(note) !== id))
      return
    }

    await ensureAudioStarted()
    sound.volume.value = -10
    sound.triggerAttackRelease(noteValue, NOTE_DURATION * speed)
    setNotes((current) => sortNotes([...current, { x, y }]))
  }

  const editMode = () => {
    stopPlayback()
  }

  const startPlayback = async () => {
    await ensureAudioStarted()
    stopPlayback()
    playbackStartRef.current = pagination
    isPlayingRef.current = true
    setIsPlaying(true)
    const startX = playbackStartRef.current
    const lastSongRow = notes.reduce(
      (currentMax, note) => Math.max(currentMax, note.x),
      Number.NEGATIVE_INFINITY
    )
    const postRollRows = 3
    const endRow = lastSongRow + postRollRows

    if (!Number.isFinite(lastSongRow) || endRow < startX) {
      finishPlayback()
      return
    }

    let currentRow = startX
    transportEventIdRef.current = Tone.Transport.scheduleRepeat(
      (time) => {
        const row = currentRow
        if (row > endRow) {
          if (transportEventIdRef.current !== null) {
            Tone.Transport.clear(transportEventIdRef.current)
            transportEventIdRef.current = null
          }
          Tone.Transport.stop(time)
          Tone.Draw.schedule(() => finishPlayback(), time)
          return
        }

        const rowNotes = notesByRowRef.current.get(row) || []
        rowNotes.forEach(({ value }) => {
          sound.volume.value = -10
          sound.triggerAttackRelease(
            value,
            Math.max(NOTE_DURATION * speed, 0.1),
            time
          )
        })

        Tone.Draw.schedule(() => {
          if (!isPlayingRef.current) return
          setActivePlaybackRow(rowNotes.length ? row : null)
          revealPlaybackRow(row)
        }, time)

        currentRow += 1
      },
      speed,
      0
    )
    Tone.Transport.start(`+${INITIAL_DELAY / SECOND}`)
  }

  const togglePlayback = async () => {
    if (isPlayingRef.current) {
      editMode()
      return
    }
    await startPlayback()
  }

  const copySongToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentMusic)
    } catch (_) {
      // Ignore clipboard errors for now; the song text remains visible in the modal.
    }
  }

  const shareSongLink = async () => {
    const serializedSong = getSerializedCurrentSong()
    const compressedSong = compressToEncodedURIComponent(serializedSong)
    const shareUrl = updateSharedUrl(compressedSong)
    try {
      if (navigator.share) {
        await navigator.share({ url: shareUrl })
        return
      }
      await navigator.clipboard.writeText(shareUrl)
    } catch (_) {
      // Ignore share/clipboard failures; the URL still updates locally.
    }
  }

  const convertSongInTextarea = () => {
    try {
      const convertedSong = convertTrackerTextToSong(currentMusic, {
        speed,
        shift,
        synth: synthPreset,
      })
      setCurrentMusic(serializeSong(convertedSong))
      applySong(convertedSong, { closeModal: false })
    } catch (_) {
      // Leave the textarea unchanged when the source text is not convertible.
    }
  }

  useEffect(() => {
    setCurrentMusic(
      getSerializedCurrentSong()
    )
  }, [notes, offset, speed, shift, synthPreset, pitchMap])

  useEffect(() => {
    setSynthPreset(synthPreset)
  }, [synthPreset])

  useEffect(() => {
    notesByRowRef.current = notes.reduce((acc, note) => {
      const value = getNoteValue(note.y, offset, pitchMap)
      if (!value) return acc
      const currentRowNotes = acc.get(note.x) || []
      currentRowNotes.push({ value })
      acc.set(note.x, currentRowNotes)
      return acc
    }, new Map())
  }, [notes, offset, pitchMap])

  useEffect(() => {
    const compressedSong = new URLSearchParams(window.location.search).get('l')
    if (!compressedSong || didLoadSharedSongRef.current) return

    didLoadSharedSongRef.current = true

    try {
      const rawSong = decompressFromEncodedURIComponent(compressedSong)
      if (!rawSong) return
      applySong(JSON.parse(rawSong), { closeModal: false })
      pendingSharedPlaybackRef.current = true
    } catch (_) {
      pendingSharedPlaybackRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!pendingSharedPlaybackRef.current || !notes.length) return
    void tryStartPendingSharedPlayback()
  }, [notes])

  useEffect(() => {
    const onGesture = () => {
      void tryStartPendingSharedPlayback()
    }

    window.addEventListener('pointerdown', onGesture, { passive: true })
    window.addEventListener('keydown', onGesture)
    window.addEventListener('touchstart', onGesture, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
      window.removeEventListener('touchstart', onGesture)
    }
  }, [notes, offset, speed, pagination, synthPreset, pitchMap])

  useEffect(() => {
    const onKeyDown = async (e) => {
      const tagName = e.target.tagName
      if (
        tagName === 'INPUT' ||
        tagName === 'SELECT' ||
        tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      )
        return

      e.preventDefault()
      e.stopPropagation()
      switch (e.key.toLowerCase()) {
        case 'w':
          if (!e.repeat) {
            scrollTimeBy(-1)
            startHeldTimeScroll(-1)
          }
          break
        case 's':
          if (!e.repeat) {
            scrollTimeBy(1)
            startHeldTimeScroll(1)
          }
          break
        case 'a':
          scrollPitchBy(-1)
          break
        case 'd':
          scrollPitchBy(1)
          break
        case 'e':
          await startPlayback()
          break
        case ' ':
          await togglePlayback()
          break
        case 'q':
          stopPlayback()
          break
        case 'escape':
          setIsSongModalOpen(false)
          break
        // case 'enter':
        //   if (e.target.value.includes('sheet'))
        //     addMusicFromList(JSON.parse(e.target.value))
        //   break
        default:
          break
      }
    }
    const onKeyUp = (e) => {
      const key = e.key.toLowerCase()
      if (key === 'w' || key === 's') {
        stopHeldTimeScroll()
      }
    }
    const onBlur = () => {
      stopHeldTimeScroll()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [mod, notes, offset, pagination, speed])

  useEffect(() => {
    setWidth(resize.w)
    setMod(resize.h)
  }, [resize.w, resize.h])

  useEffect(
    () => () => {
      stopHeldTimeScroll()
      stopPlayback()
    },
    []
  )

  return (
    <div>
      <div className={`options  ${isSongModalOpen ? 'blured' : ''}`}>
        <div className="toolbar">
          <button onClick={togglePlayback} title="play" className="ui">
            {isPlaying ? '||' : '>'}
          </button>
          <button title="erase" className="ui" onClick={() => clearNotes()}>
            x
          </button>
          <button title="go to song start" className="ui label" onClick={jumpToSongStart}>
            top
          </button>

          <input
            title="offset"
            className="ui toolbar-input"
            onChange={(e) => {
              const val = +e.target.value
              setOffset(val)
              offsetNotes()
            }}
            value={offset}
            type="number"
            min={0}
            max={noteList.length}
          />
          <input
            className="ui toolbar-input speed-input"
            title="change speed"
            onChange={(e) => setSpeed(+e.target.value)}
            step="0.1"
            type="number"
            value={speed}
          />
          <select
            title="synth"
            className="ui toolbar-select"
            value={synthPreset}
            onChange={(e) => setSynthPresetState(e.target.value)}
          >
            {SYNTH_PRESET_OPTIONS.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <button
            title="song json"
            className="ui label"
            onClick={() => setIsSongModalOpen(true)}
          >
            song
          </button>
        </div>
      </div>
      {isSongModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsSongModalOpen(false)}
          role="presentation"
        >
          <div
            className="collection song-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Song JSON"
          >
            <div className="modal-header">
              <button
                title="convert tracker text"
                className="ui label"
                onClick={convertSongInTextarea}
              >
                convert
              </button>
              <button
                title="share song link"
                className="ui label"
                onClick={shareSongLink}
              >
                share
              </button>
              <button
                title="copy song json"
                className="ui label"
                onClick={copySongToClipboard}
              >
                copy
              </button>
              <button
                title="close song modal"
                className="ui label"
                onClick={() => setIsSongModalOpen(false)}
              >
                close
              </button>
            </div>
            <textarea
              title="song json"
              onChange={(e) => {
                const rawSong = e.target.value
                setCurrentMusic(rawSong)
                try {
                  applySong(JSON.parse(rawSong))
                } catch (_) {
                  // Leave the textarea untouched until the JSON becomes valid.
                }
              }}
              value={currentMusic}
              className="ui title song-editor"
            />
          </div>
        </div>
      )}
      <div
        className={`matrix-viewport ${isSongModalOpen ? 'blured' : ''}`}
        onWheel={handleMatrixWheel}
      >
        <div
          className="pitch-bar"
          style={{ gridTemplateColumns: 'auto '.repeat(width) }}
        >
          {Array.from({ length: width }, (_, index) => (
            <div className="pitch-label" key={`pitch-${index}`}>
              {noteList[index - shift + offset] || ''}
            </div>
          ))}
        </div>
        <div
          className="matrix"
          style={{ gridTemplateColumns: 'auto '.repeat(width) }}
        >
          {matrix(mod, width, null).map((row, i) =>
            row.map((col, j) => (
              <Note
                x={i + pagination}
                y={j - shift}
                key={i + '-' + (j - shift)}
                noteValue={noteList[j - shift + offset]}
                isPlaying={
                  Boolean(notesById[`${i + pagination}:${j - shift}`]) &&
                  activePlaybackRow === i + pagination
                }
                currentNote={{
                  ...(notesById[`${i + pagination}:${j - shift}`] || {
                    x: i + pagination,
                    y: j - shift,
                  }),
                  active: Boolean(
                    notesById[`${i + pagination}:${j - shift}`]
                  ),
                }}
                mod={mod}
                onToggle={toggleNote}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Matrix
