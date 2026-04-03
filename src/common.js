import * as Tone from 'tone'
export const INACTIVE_OPACITY = '0.2'
export const ACTIVE_OPACITY = '1'
export const INITIAL_DELAY = 100
export const SECOND = 1000
export const NOTE_DURATION = 0.1
let startAudioPromise = null
export const getNoteId = (note) => `${note.x}:${note.y}`
export const sortNotes = (notes) =>
  [...notes].sort((left, right) => left.x - right.x || left.y - right.y)
export const hashCode = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return hash
}
export const intToRGB = (i) => {
  const c = (i & 0x00ffffff).toString(16).toUpperCase()
  return '000000'.substring(0, 6 - c.length) + c
}
export const matrix = (x, y, v) =>
  Array(x)
    .fill(v)
    .map((_) => Array(y).fill(v))

export const sound = new Tone.PolySynth(Tone.Synth, {
  envelope: {
    releaseCurve: 'sine',
  },
})
  // .connect(new Tone.AutoPanner('8n').toDestination())
  // .connect(new Tone.Distortion(2.8).toDestination())
  // .connect(new Tone.Chorus(4, 3.5, 0.5).toDestination())
  // .connect(new Tone.Tremolo(9, 0.75).toDestination())
  // .connect(new Tone.Vibrato(9, 0.75).toDestination())
  .toDestination()
Tone.context.lookAhead = 0.2
export const ensureAudioStarted = () => {
  if (!startAudioPromise) {
    startAudioPromise = Tone.start()
  }
  return startAudioPromise
}
export const normalizeNotes = (notes = []) =>
  sortNotes(
    Array.from(
      notes
        .map(({ x, y }) => ({
          x: Number(x),
          y: Number(y),
        }))
        .filter(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))
        .reduce((acc, note) => acc.set(getNoteId(note), note), new Map())
        .values()
    )
  )
export const normalizeSong = (song = {}) => {
  const fallback = { notes: [], offset: 15, speed: 0.25, shift: 0 }
  if (!song || typeof song !== 'object') return fallback

  const nextOffset = Number(song.offset)
  const nextSpeed = Number(song.speed)
  const nextShift = Number(song.shift)

  if (Array.isArray(song.notes)) {
    return {
      notes: normalizeNotes(song.notes),
      offset: Number.isFinite(nextOffset) ? nextOffset : fallback.offset,
      speed: Number.isFinite(nextSpeed) ? nextSpeed : fallback.speed,
      shift: Number.isFinite(nextShift) ? nextShift : fallback.shift,
    }
  }

  if (song.sheet && typeof song.sheet === 'object') {
    return {
      notes: normalizeNotes(Object.values(song.sheet)),
      offset: Number.isFinite(nextOffset) ? nextOffset : fallback.offset,
      speed: Number.isFinite(nextSpeed) ? nextSpeed : fallback.speed,
      shift: Number.isFinite(nextShift) ? nextShift : fallback.shift,
    }
  }

  return fallback
}
export const serializeSong = ({ notes, offset, speed, shift }) =>
  JSON.stringify(
    {
      notes: normalizeNotes(notes).map(({ x, y }) => ({ x, y })),
      offset,
      speed,
      shift,
    },
    null,
    2
  )
export const getNoteValue = (y, offset) => AllNotes[y + offset]
export const clearAllTimeouts = () => {
  let id = window.setTimeout(() => {}, 0)
  while (id--) {
    window.clearTimeout(id)
  }
}
export const elementsMap = new Map()
export const AllNotes = [
  'A0',
  'B0',
  'C1',
  'D1',
  'E1',
  'F1',
  'G1',
  'A1',
  'B1',
  'C2',
  'D2',
  'E2',
  'F2',
  'G2',
  'A2',
  'B2',
  'C3',
  'D3',
  'E3',
  'F3',
  'G3',
  'A3',
  'B3',
  'C4',
  'D4',
  'E4',
  'F4',
  'G4',
  'A4',
  'B4',
  'C5',
  'D5',
  'E5',
  'F5',
  'G5',
  'A5',
  'B5',
  'C6',
  'A6',
  'B6',
  'C7',
  'D7',
  'E7',
  'F7',
  'G7',
  'A7',
  'B7',
  'B8',
]
