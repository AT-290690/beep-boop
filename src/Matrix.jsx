import {
  elementsMap,
  AllNotes,
  matrix,
  sound,
  ensureAudioStarted,
  clearAllTimeouts,
  getNoteId,
  getNoteValue,
  INACTIVE_OPACITY,
  INITIAL_DELAY,
  NOTE_DURATION,
  SECOND,
  ACTIVE_OPACITY,
  normalizeSong,
  serializeSong,
  sortNotes,
} from './common.js'
import React, { useState, useEffect, useLayoutEffect } from 'react'
import html2canvas from 'html2canvas'
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
  const [shift, setShift] = useState(0)
  const [volume, setVolume] = useState(30)
  const [Notes] = useState(AllNotes) //.slice(shift, offset + width)
  const [speed, setSpeed] = useState(0.25)
  const [pagination, setPagination] = useState(0)
  const [size, setSize] = useState(15)
  const [notes, setNotes] = useState([])
  const [reload, setReload] = useState(true)
  const [load, setLoad] = useState(false)
  const [currentMusic, setCurrentMusic] = useState('')
  const [isSongModalOpen, setIsSongModalOpen] = useState(false)
  const [screenshotCanvas, setScreenshotCanvas] = useState()
  const [isScreenshotShown, setScreenshotIsShow] = useState(false)

  const resize = useWindowSize({ w: width, h: mod })
  const notesById = notes.reduce((acc, note) => {
    acc[getNoteId(note)] = note
    return acc
  }, {})

  const adjustVolume = (volume) => setVolume(volume)

  const addMusicFromList = (current) => {
    const nextSong = normalizeSong(current)
    setLoad(false)
    setSpeed(nextSong.speed)
    setOffset(nextSong.offset)
    setShift(nextSong.shift)
    setNotes(nextSong.notes)
    setIsSongModalOpen(false)
    callibrateNotes(nextSong.notes)
  }
  const callibrateNotes = (nextNotes) => {
    editMode()
    let pages = Math.floor(
      nextNotes.reduce((acc, note) => Math.max(acc, note.x), 0) / mod
    )
    const iteratePages = (page) => {
      setLoad(false)
      if (page <= pages) {
        setPagination(size * page)
        setTimeout(() => iteratePages(++page), 150)
      } else setPagination(0)
      setLoad(true)
    }
    iteratePages(0)
  }

  const offsetNotes = () => {
    setLoad(false)
    callibrateNotes(notes)
    setReload((current) => !current)
  }
  const clearNotes = () => {
    clearAllTimeouts()
    setNotes([])
    setPagination(0)
    setLoad(false)
    setReload((current) => !current)
    // eslint-disable-next-line no-restricted-globals
    history.replaceState({}, null, '/')
  }

  const toggleNote = async ({ x, y, noteValue }) => {
    if (!noteValue) return
    const id = getNoteId({ x, y })
    if (notesById[id]) {
      setNotes((current) => current.filter((note) => getNoteId(note) !== id))
      return
    }

    await ensureAudioStarted()
    sound.volume.value = volume - 30
    sound.triggerAttackRelease(noteValue, NOTE_DURATION * speed)
    setNotes((current) => sortNotes([...current, { x, y }]))
  }

  const playInterval = () => {
    setTimeout(() => {
      if (size !== mod) setSize(mod)
      clearAllTimeouts()
      const localMax = notes.reduce((max, note) => Math.max(max, note.x), -1)

      notes.forEach((note) => {
        const { x, y } = note
        const element = elementsMap.get(`${(x + pagination) % mod}:${y}`)
        const value = getNoteValue(y, offset)
        if (element) {
          element.style.opacity = INACTIVE_OPACITY
          element.firstChild.style.transform = `scale(1)`
        }
        if (!value) return

        setTimeout(() => {
          sound.volume.value = volume - 30
          sound.triggerAttackRelease(value, Math.max(NOTE_DURATION * speed, 0.1))
          if (element) element.style.opacity = ACTIVE_OPACITY
          setTimeout(() => {
            if (element)
              setTimeout(() => {
                element.style.opacity = INACTIVE_OPACITY
                element.firstChild.style.transform = `scale(1)`
              }, (speed * NOTE_DURATION + 1) * INITIAL_DELAY + INITIAL_DELAY)
          }, (speed * NOTE_DURATION + 1) * INITIAL_DELAY)
        }, speed * x * SECOND + INITIAL_DELAY * 2)
      })

      if (localMax >= 0) {
        setTimeout(
          () => playInterval(),
          speed * localMax * SECOND +
            (speed * NOTE_DURATION + 1) * INITIAL_DELAY +
            SECOND +
            INITIAL_DELAY * 2
        )
      }
    }, INITIAL_DELAY * (pagination === 0 ? 1 : 5))
  }

  const editMode = () => {
    setLoad(false)
    clearAllTimeouts()
    setReload((current) => !current)
  }

  useEffect(() => {
    setCurrentMusic(serializeSong({ notes, offset, speed, shift }))
  }, [notes, offset, speed, shift])

  useEffect(() => {
    const onKeyDown = async (e) => {
      const tagName = e.target.tagName
      if (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      )
        return

      e.preventDefault()
      e.stopPropagation()
      switch (e.key.toLowerCase()) {
        case 'w':
          if (pagination <= 0) return
          setLoad(false)
          setPagination(pagination - size)
          setLoad(true)
          break
        case 's':
          setLoad(false)
          setPagination(size + pagination)
          setLoad(true)
          break
        case 'a':
          setShift(shift - 1)
          break
        case 'd':
          setShift(shift + 1)
          break
        case 'e':
          if (pagination !== 0) {
            setLoad(false)
            setPagination(0)
            setLoad(true)
          } else {
            await ensureAudioStarted()
            playInterval()
          }
          break
        case 'q':
          setLoad(false)
          clearAllTimeouts()
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
  }, [mod, notes, offset, pagination, shift, size, speed, volume])

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
        <div className="menu">
          <button
            className="ui label"
            title="shift right"
            onClick={() => {
              setShift(shift + 1)
            }}
          >
            {'>>'}
          </button>
          <input
            className="ui"
            onChange={(e) => setShift(+e.target.value || 0)}
            title="shift"
            value={shift}
            min={-AllNotes.length}
            max={AllNotes.length}
            style={{
              width: 25,
              textAlign: 'center',
              fontSize: 10,
            }}
          />
          <button
            className="ui label"
            title="shift left"
            onClick={() => setShift(shift - 1)}
          >
            {'<<'}
          </button>
          <input
            title="offset"
            className="ui"
            onChange={(e) => {
              const val = +e.target.value
              setOffset(val)
              offsetNotes()
            }}
            value={offset}
            type="number"
            min={0}
            max={AllNotes.length}
            style={{
              width: 40,
              textAlign: 'center',
              fontSize: 10,
            }}
          />
          <input
            className="ui"
            title="change speed"
            onChange={(e) => setSpeed(+e.target.value)}
            step="0.1"
            type="number"
            style={{
              width: 80,
              fontSize: 10,
              textAlign: 'center',
            }}
            value={speed}
          />

          <input
            className="ui"
            onChange={(e) => {
              const amount = +e.target.value
              if (amount >= 0 && amount <= 100) adjustVolume(amount)
            }}
            title="volume"
            value={volume}
            type="number"
            min={0}
            max={100}
            style={{
              width: 50,
              textAlign: 'center',
              fontSize: 10,
            }}
          />
          <button
            onClick={() => {
              setScreenshotIsShow(false)
              html2canvas(document.querySelector('.matrix'), {
                backgroundColor: 'transparent',
                canvas: screenshotCanvas,
                onclone: (_, element) => {
                  const notes = element.querySelectorAll('.note-button')
                  for (const note of notes)
                    if (note.style.opacity === INACTIVE_OPACITY)
                      note.style.opacity = '0'
                },
              }).then((canvas) => {
                if (!screenshotCanvas) {
                  const handler = document.getElementById('screenshotHandler')
                  handler.innerHTML = ''
                  handler.appendChild(canvas)
                } else setScreenshotCanvas(screenshotCanvas)
                setScreenshotIsShow(true)
              })
            }}
            className="ui label"
          >
            ghost
          </button>
          <button
            onClick={() => setScreenshotIsShow(!isScreenshotShown)}
            className="ui label"
          >
            {isScreenshotShown ? 'hide' : 'show'}
          </button>
        </div>

        <div className="tools">
          <button
            onClick={async () => {
              if (pagination !== 0) {
                setPagination(0)
                setLoad(false)
                setReload((current) => !current)
              } else {
                await ensureAudioStarted()
                playInterval()
              }
            }}
            title="play"
            className="ui"
          >
            {'>'}
          </button>
          <button
            onClick={editMode}
            title="stop"
            className="ui"
            style={{
              fontSize: 20,
            }}
          >
            #
          </button>

          <button
            onClick={() => {
              if (pagination <= 0) return
              setLoad(false)
              setPagination(pagination - size)
              setReload((current) => !current)
            }}
            title="up"
            className="ui"
          >
            &#9650;
          </button>
          <button title="page" className="ui">
            {pagination / size}
          </button>
          <button
            title="down"
            onClick={(e) => {
              setLoad(false)
              setPagination(size + pagination)
              setReload((current) => !current)
            }}
            className="ui"
          >
            &#9660;
          </button>

          <button title="erase" className="ui" onClick={() => clearNotes()}>
            x
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
                  addMusicFromList(JSON.parse(rawSong))
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
        id="screenshotHandler"
        style={{
          position: 'absolute',
          display: isScreenshotShown ? 'block' : 'none',
        }}
      ></div>
      {load && (
        <div
          className={`matrix ${isSongModalOpen ? 'blured' : ''}`}
          style={{ gridTemplateColumns: 'auto '.repeat(width) }}
        >
          {matrix(mod, width, null).map((row, i) =>
            row.map((col, j) => (
              <Note
                x={i + pagination}
                y={j - shift}
                key={i + '-' + (j - shift)}
                noteValue={Notes[j - shift + offset]}
                currentNote={{
                  ...(notesById[`${i + pagination}:${j - shift}`] || {
                    x: i + pagination,
                    y: j - shift,
                  }),
                  active: Boolean(notesById[`${i + pagination}:${j - shift}`]),
                }}
                mod={mod}
                onToggle={toggleNote}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Matrix
