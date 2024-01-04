import * as Tone from 'tone'
export const INACTIVE_OPACITY = '0.2'
export const ACTIVE_OPACITY = '1'
export const INITIAL_DELAY = 100
export const SECOND = 1000
export const getNoteId = (note) => `${note.x}:${note.y}`
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
