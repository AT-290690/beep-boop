import React from 'react'
import {
  ACTIVE_OPACITY,
  INACTIVE_OPACITY,
  elementsMap,
  getBrightColor,
} from './common'

const Note = ({ x, y, noteValue, currentNote, mod, onToggle }) => {
  const opacity = currentNote.active ? ACTIVE_OPACITY : INACTIVE_OPACITY
  const color = getBrightColor(`${noteValue || 'rest'}1230`)
  return (
    <button
      style={{ opacity }}
      ref={(element) => {
        if (element !== null && x < mod) elementsMap.set(`${x}:${y}`, element)
      }}
      className="note-button"
      id={`${x}:${y}`}
      title={noteValue}
      onClick={() => onToggle({ x, y, noteValue })}
    >
      <div
        style={{
          backgroundColor: color,
        }}
        className="shape"
      ></div>
    </button>
  )
}
export default Note
