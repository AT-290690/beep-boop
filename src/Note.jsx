import React, { memo } from 'react'
import { getBrightColor } from './common'

const Note = ({ x, y, noteValue, isActive, isPlaying, onToggle }) => {
  const opacity = isActive ? '1' : '0.10'
  const color = getBrightColor(noteValue)
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

export default memo(
  Note,
  (prevProps, nextProps) =>
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.noteValue === nextProps.noteValue &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isPlaying === nextProps.isPlaying
)
