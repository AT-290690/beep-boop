import * as Tone from 'tone'
export const INACTIVE_OPACITY = '0.2'
export const ACTIVE_OPACITY = '1'
export const INITIAL_DELAY = 100
export const SECOND = 1000
export const NOTE_DURATION = 0.1
export const DEFAULT_SYNTH_PRESET = 'classic'
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
const BRIGHT_NOTE_COLORS = [
  '#FF595E',
  '#FF924C',
  '#FFCA3A',
  '#8AC926',
  '#52D1DC',
  '#1982C4',
  '#6A4C93',
  '#F15BB5',
  '#00F5D4',
  '#9BFF00',
  '#FF6B6B',
  '#FFD166',
]
export const getBrightColor = (value) => {
  const index = Math.abs(hashCode(value)) % BRIGHT_NOTE_COLORS.length
  return BRIGHT_NOTE_COLORS[index]
}
export const matrix = (x, y, v) =>
  Array(x)
    .fill(v)
    .map((_) => Array(y).fill(v))

export const SYNTH_PRESET_OPTIONS = [
  { id: 'classic', label: 'Classic' },
  { id: 'echo', label: 'Echo' },
  { id: 'orbit', label: 'Orbit' },
  { id: 'glass', label: 'Glass' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'warm', label: 'Warm' },
]
const isValidSynthPreset = (presetId) =>
  SYNTH_PRESET_OPTIONS.some(({ id }) => id === presetId)
const resolveSynthPreset = (presetId) =>
  isValidSynthPreset(presetId) ? presetId : DEFAULT_SYNTH_PRESET
let activeSoundNodes = []
const disposeActiveSoundNodes = () => {
  activeSoundNodes.forEach((node) => {
    if (node && typeof node.dispose === 'function') node.dispose()
  })
  activeSoundNodes = []
}
const createSoundRig = (presetId) => {
  switch (resolveSynthPreset(presetId)) {
    case 'orbit': {
      const synth = new Tone.PolySynth(Tone.DuoSynth, {
        harmonicity: 1.5,
        vibratoAmount: 0.12,
        vibratoRate: 4.5,
        voice0: {
          oscillator: {
            type: 'triangle',
          },
          envelope: {
            attack: 0.01,
            decay: 0.08,
            sustain: 0.35,
            release: 1.6,
          },
        },
        voice1: {
          oscillator: {
            type: 'triangle',
          },
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.25,
            release: 2.2,
          },
        },
      })
      const filter = new Tone.Filter({
        type: 'lowpass',
        frequency: 2600,
        rolloff: -12,
      })
      const delay = new Tone.PingPongDelay({
        delayTime: '8n',
        feedback: 0.48,
        wet: 0.58,
      })
      const limiter = new Tone.Limiter(-8).toDestination()
      synth.connect(filter)
      filter.connect(delay)
      delay.connect(limiter)
      return {
        sound: synth,
        nodes: [synth, filter, delay, limiter],
      }
    }
    case 'echo': {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'triangle',
        },
        envelope: {
          attack: 0.01,
          decay: 0.12,
          sustain: 0.25,
          release: 1.4,
          releaseCurve: 'sine',
        },
      })
      const tremolo = new Tone.Tremolo({
        frequency: 4.5,
        depth: 0.2,
        spread: 180,
      }).start()
      const delay = new Tone.PingPongDelay({
        delayTime: '8n',
        feedback: 0.35,
        wet: 0.45,
      })
      const limiter = new Tone.Limiter(-8).toDestination()
      synth.connect(tremolo)
      tremolo.connect(delay)
      delay.connect(limiter)
      return {
        sound: synth,
        nodes: [synth, tremolo, delay, limiter],
      }
    }
    case 'glass':
      return {
        sound: new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 8,
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.15,
          release: 1.5,
        },
        modulation: {
          type: 'triangle',
        },
        modulationEnvelope: {
          attack: 0.05,
          decay: 0.3,
          sustain: 0.05,
          release: 1.2,
        },
      }).toDestination(),
        nodes: [],
      }
    case 'pulse':
      return {
        sound: new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'square8',
        },
        envelope: {
          attack: 0.005,
          decay: 0.08,
          sustain: 0.2,
          release: 0.6,
          releaseCurve: 'sine',
        },
      }).toDestination(),
        nodes: [],
      }
    case 'warm':
      return {
        sound: new Tone.PolySynth(Tone.AMSynth, {
        harmonicity: 1.5,
        envelope: {
          attack: 0.02,
          decay: 0.2,
          sustain: 0.45,
          release: 1.1,
        },
        modulation: {
          type: 'sine',
        },
        modulationEnvelope: {
          attack: 0.1,
          decay: 0.2,
          sustain: 0.3,
          release: 0.8,
        },
      }).toDestination(),
        nodes: [],
      }
    case 'classic':
    default:
      return {
        sound: new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'triangle',
        },
        envelope: {
          attack: 0.01,
          decay: 0.12,
          sustain: 0.3,
          release: 0.8,
          releaseCurve: 'sine',
        },
      }).toDestination(),
        nodes: [],
      }
  }
}
const initializeSound = (presetId) => {
  disposeActiveSoundNodes()
  const { sound, nodes } = createSoundRig(presetId)
  activeSoundNodes = nodes.length ? nodes : [sound]
  return sound
}
export let sound = initializeSound(DEFAULT_SYNTH_PRESET)
export const setSynthPreset = (presetId) => {
  const nextPreset = resolveSynthPreset(presetId)
  if (sound) {
    if (typeof sound.releaseAll === 'function') sound.releaseAll()
  }
  sound = initializeSound(nextPreset)
  return nextPreset
}
Tone.context.lookAhead = 0.2
export const ensureAudioStarted = () => {
  if (!startAudioPromise) {
    startAudioPromise = Tone.start()
  }
  return startAudioPromise
}
const normalizeNote = (note) => {
  if (Array.isArray(note)) {
    const [x, y] = note
    return {
      x: Number(x),
      y: Number(y),
    }
  }

  if (note && typeof note === 'object') {
    const { x, y } = note
    return {
      x: Number(x),
      y: Number(y),
    }
  }

  return {
    x: Number.NaN,
    y: Number.NaN,
  }
}
export const normalizeNotes = (notes = []) =>
  sortNotes(
    Array.from(
      notes
        .map(normalizeNote)
        .filter(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))
        .reduce((acc, note) => acc.set(getNoteId(note), note), new Map())
        .values()
    )
  )
export const normalizeSong = (song = {}) => {
  const fallback = {
    notes: [],
    offset: 15,
    speed: 0.25,
    shift: 0,
    synth: DEFAULT_SYNTH_PRESET,
  }
  if (!song || typeof song !== 'object') return fallback

  const nextOffset = Number(song.offset)
  const nextSpeed = Number(song.speed)
  const nextShift = Number(song.shift)
  const nextSynth = resolveSynthPreset(song.synth)

  if (Array.isArray(song.notes)) {
    return {
      notes: normalizeNotes(song.notes),
      offset: Number.isFinite(nextOffset) ? nextOffset : fallback.offset,
      speed: Number.isFinite(nextSpeed) ? nextSpeed : fallback.speed,
      shift: Number.isFinite(nextShift) ? nextShift : fallback.shift,
      synth: nextSynth,
    }
  }

  if (song.sheet && typeof song.sheet === 'object') {
    return {
      notes: normalizeNotes(Object.values(song.sheet)),
      offset: Number.isFinite(nextOffset) ? nextOffset : fallback.offset,
      speed: Number.isFinite(nextSpeed) ? nextSpeed : fallback.speed,
      shift: Number.isFinite(nextShift) ? nextShift : fallback.shift,
      synth: nextSynth,
    }
  }

  return fallback
}
export const serializeSong = ({ notes, offset, speed, shift, synth }) =>
  JSON.stringify(
    {
      notes: normalizeNotes(notes).map(({ x, y }) => [x, y]),
      offset,
      speed,
      shift,
      synth: resolveSynthPreset(synth),
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
