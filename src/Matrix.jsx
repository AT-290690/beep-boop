import {
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
import React, {
  memo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react'
import * as Tone from 'tone'
import Note from './Note.jsx'

const DEFAULT_NOTE_SIZE = 25
const DEFAULT_SHAPE_SIZE = 20
const DEFAULT_GRID_GAP = 10
const DEFAULT_WIDTH_STEP = 50
const DEFAULT_HEIGHT_STEP = 45

const FULLSCREEN_NOTE_SIZE = 16
const FULLSCREEN_SHAPE_SIZE = 12
const FULLSCREEN_GRID_GAP = 6
const FULLSCREEN_WIDTH_PADDING = 32
const FULLSCREEN_HEIGHT_PADDING = 32

const MatrixRow = memo(
  function MatrixRow({
    rowIndex,
    x,
    width,
    shift,
    offset,
    noteList,
    activeNoteIds,
    isActiveRow,
    onToggle,
  }) {
    return Array.from({ length: width }, (_, j) => {
      const y = j - shift
      const noteValue = noteList[j - shift + offset]
      const noteId = `${x}:${y}`
      const isActive = activeNoteIds.has(noteId)
      return (
        <Note
          x={x}
          y={y}
          key={`${rowIndex}-${y}`}
          noteValue={noteValue}
          isPlaying={isActive && isActiveRow}
          isActive={isActive}
          onToggle={onToggle}
        />
      )
    })
  },
  (prevProps, nextProps) =>
    prevProps.x === nextProps.x &&
    prevProps.width === nextProps.width &&
    prevProps.shift === nextProps.shift &&
    prevProps.offset === nextProps.offset &&
    prevProps.noteList === nextProps.noteList &&
    prevProps.activeNoteIds === nextProps.activeNoteIds &&
    prevProps.isActiveRow === nextProps.isActiveRow
)

const useWindowSize = ({ initial, isFullscreen }) => {
  const [bounds, setBounds] = useState(initial)
  useLayoutEffect(() => {
    const updateSize = () => {
      if (isFullscreen) {
        const columnSpan = FULLSCREEN_NOTE_SIZE + FULLSCREEN_GRID_GAP
        const rowSpan = FULLSCREEN_NOTE_SIZE + FULLSCREEN_GRID_GAP
        setBounds({
          w: Math.max(
            8,
            Math.floor(
              (window.innerWidth - FULLSCREEN_WIDTH_PADDING) / columnSpan
            )
          ),
          h: Math.max(
            8,
            Math.floor(
              (window.innerHeight - FULLSCREEN_HEIGHT_PADDING) / rowSpan
            )
          ),
        })
        return
      }
      setBounds({
        w: Math.floor(window.innerWidth / DEFAULT_WIDTH_STEP),
        h: Math.floor(window.innerHeight / DEFAULT_HEIGHT_STEP),
      })
    }
    window.addEventListener('resize', updateSize)
    updateSize()
    return () => window.removeEventListener('resize', updateSize)
  }, [isFullscreen])
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [activeNoteIds, setActiveNoteIds] = useState(() => new Set())

  const resize = useWindowSize({ initial: { w: width, h: mod }, isFullscreen })
  const rootRef = useRef(null)
  const isNativeFullscreenRef = useRef(false)
  const viewportBeforeFullscreenRef = useRef(null)
  const pendingFullscreenViewportFitRef = useRef(false)
  const horizontalScrollRemainder = useRef(0)
  const verticalScrollRemainder = useRef(0)
  const touchScrollRef = useRef({
    x: null,
    y: null,
  })
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

  const restoreViewportFromFullscreen = () => {
    if (!viewportBeforeFullscreenRef.current) return
    setShift(viewportBeforeFullscreenRef.current.shift)
    setPagination(viewportBeforeFullscreenRef.current.pagination)
    viewportBeforeFullscreenRef.current = null
    pendingFullscreenViewportFitRef.current = false
  }

  const toggleFullscreen = async () => {
    try {
      if (isFullscreen) {
        if (document.fullscreenElement === rootRef.current) {
          await document.exitFullscreen()
        } else {
          isNativeFullscreenRef.current = false
          setIsFullscreen(false)
          restoreViewportFromFullscreen()
        }
        return
      }

      viewportBeforeFullscreenRef.current = {
        shift,
        pagination,
      }
      pendingFullscreenViewportFitRef.current = true
      if (
        typeof rootRef.current?.requestFullscreen === 'function' &&
        typeof document.exitFullscreen === 'function'
      ) {
        isNativeFullscreenRef.current = true
        await rootRef.current.requestFullscreen()
      } else {
        isNativeFullscreenRef.current = false
        setIsFullscreen(true)
      }
    } catch (_) {
      isNativeFullscreenRef.current = false
      setIsFullscreen(true)
    }
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

  const handleMatrixTouchStart = (e) => {
    const touch = e.touches[0]
    if (!touch) return
    touchScrollRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    }
  }

  const handleMatrixTouchMove = (e) => {
    const touch = e.touches[0]
    const lastTouch = touchScrollRef.current
    if (!touch || lastTouch.x === null || lastTouch.y === null) return

    const deltaX = lastTouch.x - touch.clientX
    const deltaY = lastTouch.y - touch.clientY
    touchScrollRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    }

    if (!deltaX && !deltaY) return

    e.preventDefault()

    horizontalScrollRemainder.current += deltaX
    const horizontalSteps = Math.trunc(horizontalScrollRemainder.current / 24)
    if (horizontalSteps) {
      scrollPitchBy(horizontalSteps)
      horizontalScrollRemainder.current -= horizontalSteps * 24
    }

    verticalScrollRemainder.current += deltaY
    const verticalSteps = Math.trunc(verticalScrollRemainder.current / 24)
    if (verticalSteps) {
      scrollTimeBy(verticalSteps)
      verticalScrollRemainder.current -= verticalSteps * 24
    }
  }

  const handleMatrixTouchEnd = () => {
    touchScrollRef.current = {
      x: null,
      y: null,
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
    if (activeNoteIds.has(id)) {
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
    setActiveNoteIds(new Set(notes.map(getNoteId)))
  }, [notes])

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
    const syncFullscreenState = () => {
      const nextIsFullscreen = document.fullscreenElement === rootRef.current
      if (!isNativeFullscreenRef.current) return
      setIsFullscreen(nextIsFullscreen)
      if (!nextIsFullscreen) {
        isNativeFullscreenRef.current = false
        restoreViewportFromFullscreen()
      }
    }
    document.addEventListener('fullscreenchange', syncFullscreenState)
    syncFullscreenState()
    return () =>
      document.removeEventListener('fullscreenchange', syncFullscreenState)
  }, [])

  useEffect(() => {
    const updateTouchDevice = () => {
      setIsTouchDevice(
        window.matchMedia('(hover: none), (pointer: coarse)').matches
      )
    }
    updateTouchDevice()
    window.addEventListener('resize', updateTouchDevice)
    return () => window.removeEventListener('resize', updateTouchDevice)
  }, [])

  useEffect(() => {
    if (!isFullscreen || !pendingFullscreenViewportFitRef.current || !notes.length)
      return

    const minX = notes.reduce(
      (currentMin, note) => Math.min(currentMin, note.x),
      notes[0].x
    )
    const maxX = notes.reduce(
      (currentMax, note) => Math.max(currentMax, note.x),
      notes[0].x
    )
    const minY = notes.reduce(
      (currentMin, note) => Math.min(currentMin, note.y),
      notes[0].y
    )
    const maxY = notes.reduce(
      (currentMax, note) => Math.max(currentMax, note.y),
      notes[0].y
    )

    const targetHorizontalCenter = (Math.max(1, width) - 1) / 2
    const noteHorizontalCenter = (minY + maxY) / 2
    const centeredShift = Math.round(targetHorizontalCenter - noteHorizontalCenter)

    const songHeight = maxX - minX + 1
    let centeredPagination = pagination
    if (songHeight <= mod) {
      centeredPagination = Math.round(minX - (mod - songHeight) / 2)
    } else {
      const minPagination = minX
      const maxPagination = maxX - mod + 1
      centeredPagination = Math.min(
        Math.max(pagination, minPagination),
        maxPagination
      )
    }

    setShift(centeredShift)
    setPagination(centeredPagination)
    pendingFullscreenViewportFitRef.current = false
  }, [isFullscreen, width, mod, notes, pagination])

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
          if (isFullscreen && document.fullscreenElement !== rootRef.current) {
            setIsFullscreen(false)
            restoreViewportFromFullscreen()
          }
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
    <div
      ref={rootRef}
      className={`matrix-shell${isFullscreen ? ' matrix-shell-fullscreen' : ''}${
        isTouchDevice ? ' matrix-shell-touch' : ''
      }`}
    >
      {!isFullscreen && (
        <div className={`options  ${isSongModalOpen ? 'blured' : ''}`}>
          <div className="toolbar">
            <button onClick={togglePlayback} title="play" className="ui">
              {isPlaying ? '||' : '>'}
            </button>
            <button title="erase" className="ui" onClick={() => clearNotes()}>
              x
            </button>
            <button
              title="go to song start"
              className="ui label"
              onClick={jumpToSongStart}
            >
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
              title="fullscreen"
              className="ui label"
              onClick={toggleFullscreen}
            >
              full
            </button>
            <button
              title="song json"
              className="ui label"
              onClick={() => setIsSongModalOpen(true)}
            >
              song
            </button>
          </div>
        </div>
      )}
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
        className={`matrix-viewport ${isSongModalOpen ? 'blured' : ''}${isFullscreen ? ' matrix-viewport-fullscreen' : ''}`}
        onWheel={handleMatrixWheel}
        onTouchStart={handleMatrixTouchStart}
        onTouchMove={handleMatrixTouchMove}
        onTouchEnd={handleMatrixTouchEnd}
        onTouchCancel={handleMatrixTouchEnd}
        style={{
          '--note-size': `${isFullscreen ? FULLSCREEN_NOTE_SIZE : DEFAULT_NOTE_SIZE}px`,
          '--shape-size': `${isFullscreen ? FULLSCREEN_SHAPE_SIZE : DEFAULT_SHAPE_SIZE}px`,
          '--grid-gap': `${isFullscreen ? FULLSCREEN_GRID_GAP : DEFAULT_GRID_GAP}px`,
        }}
      >
        <div
          className={`pitch-bar${isFullscreen ? ' pitch-bar-hidden' : ''}`}
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
          {Array.from({ length: mod }, (_, i) => {
            const x = i + pagination
            return (
              <MatrixRow
                rowIndex={i}
                x={x}
                key={x}
                width={width}
                shift={shift}
                offset={offset}
                noteList={noteList}
                activeNoteIds={activeNoteIds}
                isActiveRow={activePlaybackRow === x}
                onToggle={toggleNote}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Matrix
