import {
  elementsMap,
  AllNotes,
  matrix,
  sound,
  clearAllTimeouts,
  INACTIVE_OPACITY,
  INITIAL_DELAY,
  SECOND,
  ACTIVE_OPACITY,
} from './common.js'
import React, { useState, useEffect, useLayoutEffect } from 'react'
import * as html2canvas from 'html2canvas'
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
  const [sheet, setSheet] = useState({})
  const [reload, setReload] = useState(true)
  const [load, setLoad] = useState(false)
  const [currentMusic, setCurrentMusic] = useState('')
  const [isMusicListOpen, setIsMusicListOpen] = useState(false)
  const [screenshotCanvas, setScreenshotCanvas] = useState()
  const [isScreenshotShown, setScreenshotIsShow] = useState(false)

  const resize = useWindowSize({ w: width, h: mod })

  const adjustVolume = (volume) => setVolume(volume)

  const addMusicFromList = (current) => {
    setLoad(false)
    setSpeed(current.speed)
    setOffset(current.offset)
    setShift(current.shift)
    setSheet(current.sheet)
    setIsMusicListOpen(false)
    callibrateNotes(current.sheet)
    // setCurrentMusic(JSON.stringify(current));
  }
  const callibrateNotes = (sheet) => {
    editMode()
    let pages = Math.floor(
      Object.values(sheet).reduce((acc, n) => (acc = Math.max(acc, n.x)), 0) /
        mod
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

  const offsetNotes = (value) => {
    setLoad(false)
    callibrateNotes(sheet)
    setReload(!reload)
  }
  const clearNotes = () => {
    clearAllTimeouts()
    setSheet({})
    setPagination(0)
    setLoad(false)
    setReload(!reload)
    // eslint-disable-next-line no-restricted-globals
    history.replaceState({}, null, '/')
  }

  const playInterval = () => {
    let localMax = -Infinity
    setTimeout(() => {
      if (size !== mod) setSize(mod)
      clearAllTimeouts()
      const sheetArr = Object.values(sheet).map((note) => {
        const { x, y } = note
        const element = elementsMap.get(`${(x + pagination) % mod}:${y}`)
        if (element) {
          element.style.opacity = INACTIVE_OPACITY
          element.firstChild.style.transform = `scale(1)`
        }
        localMax = Math.max(localMax, x)
        return { note, element, index: x }
      })

      for (let i = 0; i < localMax; i++)
        if (!sheetArr[i]) sheetArr[i] = { note: null, element: null, index: i }
      setCurrentMusic(JSON.stringify({ sheet, offset, speed, shift }))
      sheetArr.forEach(
        ({ note, element, index }) =>
          note &&
          setTimeout(() => {
            const { value, delay } = note
            sound.volume.value = volume - 30
            sound.triggerAttackRelease(value, Math.max(delay * speed, 0.1))
            if (element) element.style.opacity = ACTIVE_OPACITY
            // element.firstChild.style.transform = `scale(1, ${
            //   delay > 0.1 ? delay + 1 : 1
            // })`
            setTimeout(() => {
              if (element)
                setTimeout(() => {
                  element.style.opacity = INACTIVE_OPACITY
                  element.firstChild.style.transform = `scale(1)`
                }, (speed * delay + 1) * INITIAL_DELAY + INITIAL_DELAY)
              index === localMax && setTimeout(() => playInterval(), SECOND)
            }, (speed * delay + 1) * INITIAL_DELAY)
          }, speed * index * SECOND + INITIAL_DELAY * 2)
      )
    }, INITIAL_DELAY * (pagination === 0 ? 1 : 5))
  }

  const editMode = () => {
    setLoad(false)
    clearAllTimeouts()
    setReload(!reload)
  }

  useEffect(() => {
    const onKeyDown = (e) => {
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
          }
          playInterval()
          break
        case 'q':
          editMode()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift, pagination])

  useEffect(() => {
    setLoad(false)
    setWidth(resize.w)
    setMod(resize.h)
    setLoad(true)
  }, [resize.w, resize.h])

  useEffect(() => setLoad(true), [reload])

  return (
    <div>
      <div className={`options  ${isMusicListOpen ? 'blured' : ''}`}>
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
              offsetNotes(offset)
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
            onClick={() => {
              if (pagination !== 0) {
                setPagination(0)
                setLoad(false)
                setReload(!reload)
              }
              playInterval()
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
              setReload(!reload)
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
              setReload(!reload)
            }}
            className="ui"
          >
            &#9660;
          </button>

          <button title="erase" className="ui" onClick={() => clearNotes()}>
            x
          </button>

          <input
            title="title"
            onChange={(e) => {
              if (e.target.value.includes('sheet')) {
                setCurrentMusic(e.target.value)
                addMusicFromList(JSON.parse(e.target.value))
              }
            }}
            value={currentMusic}
            className="ui title"
          />
        </div>
      </div>
      <div
        id="screenshotHandler"
        style={{
          position: 'absolute',
          display: isScreenshotShown ? 'block' : 'none',
        }}
      ></div>
      {load && (
        <div
          className={`matrix ${isMusicListOpen ? 'blured' : ''}`}
          style={{ gridTemplateColumns: 'auto '.repeat(width) }}
        >
          {matrix(mod, width, null).map((row, i) =>
            row.map((col, j) => (
              <Note
                i={i + pagination}
                j={j - shift}
                key={i + '-' + (j - shift)}
                note={Notes[j - shift + offset]}
                sound={sound}
                sheet={sheet}
                speed={speed}
                mod={mod}
                volume={volume}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Matrix
