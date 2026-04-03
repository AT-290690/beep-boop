import React from 'react'
import { getBrightColor } from './common'

const Note = ({ x, y, noteValue, currentNote, isPlaying, mod, onToggle }) => {
  const opacity = currentNote.active ? '1' : '0.14'
  const color = getBrightColor(`${noteValue || 'rest'}1230`)
  return (
    <button
      style={{ opacity }}
      className="note-button"
      id={`${x}:${y}`}
      title={noteValue}
      onClick={() => onToggle({ x, y, noteValue })}
    >
      <div
        style={{
          backgroundColor: color,
          color,
        }}
        className={`shape${isPlaying ? ' shape-playing' : ''}`}
      ></div>
    </button>
  )
}
export default Note
