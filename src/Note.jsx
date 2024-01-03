import React, { useState } from 'react'
import { elementsMap, hashCode, INACTIVE_OPACITY, intToRGB } from './common'

const Note = ({ i, j, note, sound, sheet, mod, volume, speed }) => {
  const id = `${i}:${j}`
  const imported = sheet[id] || null
  const currentNote = imported ? sheet[id] : { delay: 0.1, x: i, y: j }
  const delay = currentNote.delay
  const size = currentNote.delay > 0.1 ? currentNote.delay + 1 : 1
  // const [delay, setDelay] = useState(currentNote.delay);
  // const [size, setSize] = useState(
  //   currentNote.delay > 0.1 ? currentNote.delay + 1 : 1
  // );

  const [opacity, setOpacity] = useState(imported ? '1' : INACTIVE_OPACITY)
  const [color] = useState('#' + intToRGB(hashCode(note + '1230')))
  if (imported) {
    sheet[id] = currentNote
    sheet[id].value = note
  }
  return (
    <button
      style={{ opacity }}
      ref={(element) => {
        if (i < mod) {
          elementsMap.set(id, element)
        }
      }}
      className="note-button"
      id={id}
      title={note}
      // onKeyPress={e => {
      //   if (e.key === '=') {
      //     setDelay(Math.max(0, delay + 0.05));
      //     setSize(delay + 1);
      //   } else if (e.key === '-') {
      //     setDelay(Math.max(0, delay - 0.05));
      //     setSize(delay + 1);
      //   }
      // }}
      onClick={() => {
        const id = `${i}:${j}`
        if (sheet[id]) {
          setOpacity(INACTIVE_OPACITY)
          delete sheet[id]
        } else {
          setOpacity('1')
          sound.volume.value = volume - 30
          sound.triggerAttackRelease(note, delay * speed)
          sheet[id] = { value: note, delay, x: i, y: j }
        }
      }}
    >
      <div
        style={{
          transform: `scale(1, ${size})`,
          backgroundColor: color,
        }}
        className="shape"
      ></div>
    </button>
  )
}
export default Note
