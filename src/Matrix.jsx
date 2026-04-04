import {
  matrix,
  sound,
  ensureAudioStarted,
  clearAllTimeouts,
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
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
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
  const [mod, setMod] = useState(15)
  const [width, setWidth] = useState(30)
  const [offset, setOffset] = useState(15)
  const [pitchMap, setPitchMap] = useState(DEFAULT_PITCH_MAP)
  const [shift, setShift] = useState(0)
  const [speed, setSpeed] = useState(0.25)
  const [pagination, setPagination] = useState(0)
  const [notes, setNotes] = useState([])
  const [reload, setReload] = useState(true)
  const [load, setLoad] = useState(false)
  const [currentMusic, setCurrentMusic] = useState('')
  const [isSongModalOpen, setIsSongModalOpen] = useState(false)
  const [synthPreset, setSynthPresetState] = useState(DEFAULT_SYNTH_PRESET)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playingNoteIds, setPlayingNoteIds] = useState([])

  const resize = useWindowSize({ w: width, h: mod })
  const horizontalScrollRemainder = useRef(0)
  const verticalScrollRemainder = useRef(0)
  const playbackStartRef = useRef(0)
  const isPlayingRef = useRef(false)
  const playingNoteIdsSet = new Set(playingNoteIds)
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

  const applySong = (current, { closeModal = true } = {}) => {
    const nextSong = fitSongToViewport(current, width)
    setLoad(false)
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
    editMode()
    setPagination(getSongStartRow(nextNotes))
    setLoad(true)
  }

  const offsetNotes = () => {
    setLoad(false)
    callibrateNotes(notes)
    setReload((current) => !current)
  }
  const clearNotes = () => {
    clearAllTimeouts()
    setPlayingNoteIds([])
    setNotes([])
    setPagination(0)
    setLoad(false)
    setReload((current) => !current)
    // eslint-disable-next-line no-restricted-globals
    history.replaceState({}, null, '/')
  }
  const jumpToSongStart = () => {
    setLoad(false)
    setPagination(getSongStartRow(notes))
    setLoad(true)
  }

  const scrollPitchBy = (amount) => {
    if (!amount) return
    setShift((current) => current + amount)
  }

  const scrollTimeBy = (amount) => {
    if (!amount) return
    setLoad(false)
    setPagination((current) => current + amount)
    setLoad(true)
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
    const followOffset = 1
    setPagination(row - followOffset)
  }

  const finishPlayback = () => {
    isPlayingRef.current = false
    setIsPlaying(false)
    setPlayingNoteIds([])
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

  const playInterval = (startX = playbackStartRef.current) => {
    if (!isPlayingRef.current) return
    setTimeout(() => {
      if (!isPlayingRef.current) return
      clearAllTimeouts()
      const scheduledNotes = notes.filter((note) => note.x >= startX)
      const localMax = scheduledNotes.reduce((max, note) => Math.max(max, note.x), -1)
      const postRollRows = 3
      const endRow = localMax + postRollRows

      if (localMax < startX) {
        finishPlayback()
        return
      }

      for (let row = startX; row <= endRow; row++) {
        setTimeout(() => {
          if (!isPlayingRef.current) return
          revealPlaybackRow(row)
        }, speed * (row - startX) * SECOND)
      }

      scheduledNotes.forEach((note) => {
        const { x, y } = note
        const noteId = getNoteId(note)
        const value = getNoteValue(y, offset, pitchMap)
        if (!value) return

        setTimeout(() => {
          if (!isPlayingRef.current) return
          sound.volume.value = -10
          sound.triggerAttackRelease(
            value,
            Math.max(NOTE_DURATION * speed, 0.1)
          )
          setPlayingNoteIds((current) =>
            current.includes(noteId) ? current : [...current, noteId]
          )
          setTimeout(() => {
            setPlayingNoteIds((current) =>
              current.filter((currentNoteId) => currentNoteId !== noteId)
            )
          }, Math.max(speed * SECOND * 0.8, 120))
        }, speed * (x - startX) * SECOND + INITIAL_DELAY * 2)
      })

      setTimeout(() => {
        if (!isPlayingRef.current) return
        finishPlayback()
      }, speed * (endRow - startX) * SECOND + INITIAL_DELAY * 2)
    }, INITIAL_DELAY)
  }

  const editMode = () => {
    isPlayingRef.current = false
    setIsPlaying(false)
    setPlayingNoteIds([])
    setLoad(false)
    clearAllTimeouts()
    setReload((current) => !current)
  }

  const startPlayback = async () => {
    await ensureAudioStarted()
    playbackStartRef.current = pagination
    isPlayingRef.current = true
    setIsPlaying(true)
    playInterval(playbackStartRef.current)
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
      serializeSong({
        notes,
        offset,
        speed,
        shift,
        synth: synthPreset,
        pitchMap,
      })
    )
  }, [notes, offset, speed, shift, synthPreset, pitchMap])

  useEffect(() => {
    setSynthPreset(synthPreset)
  }, [synthPreset])

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
          scrollTimeBy(-1)
          break
        case 's':
          scrollTimeBy(1)
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
          setLoad(false)
          clearAllTimeouts()
          isPlayingRef.current = false
          setIsPlaying(false)
          setLoad(true)
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
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mod, notes, offset, pagination, speed])

  useEffect(() => {
    setLoad(false)
    setWidth(resize.w)
    setMod(resize.h)
    setLoad(true)
  }, [resize.w, resize.h])

  useEffect(() => setLoad(true), [reload])

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
      {load && (
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
                  isPlaying={playingNoteIdsSet.has(
                    `${i + pagination}:${j - shift}`
                  )}
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
      )}
    </div>
  )
}

export default Matrix
