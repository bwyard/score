// Scale and chord utilities — returns arrays of note names
// All note names follow Score convention: 'A2', 'F#3', 'Bb4'

const SCALES: Record<string, number[]> = {
  major:       [0, 2, 4, 5, 7, 9, 11],
  minor:       [0, 2, 3, 5, 7, 8, 10],
  dorian:      [0, 2, 3, 5, 7, 9, 10],
  phrygian:    [0, 1, 3, 5, 7, 8, 10],
  lydian:      [0, 2, 4, 6, 7, 9, 11],
  mixolydian:  [0, 2, 4, 5, 7, 9, 10],
  locrian:     [0, 1, 3, 5, 6, 8, 10],
  pentatonic:  [0, 2, 4, 7, 9],
  blues:       [0, 3, 5, 6, 7, 10],
}

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

const NOTE_SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, D: 2, Eb: 3, E: 4, F: 5,
  'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11,
}

// Parse root note: 'Am' → { note: 'A', semitone: 9 }
const parseRoot = (root: string): number => {
  const match = /^([A-G](?:#|b)?)/.exec(root)
  const note = match?.[1] ?? 'C'
  // normalize 'Db' → 'C#' etc for lookup
  const normalized = note.replace('Db', 'C#').replace('Gb', 'F#').replace('Cb', 'B').replace('Fb', 'E')
  return NOTE_SEMITONES[normalized] ?? 0
}

// scaleNotes('Am', 2, 2) → ['A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3']
export const scaleNotes = (key: string, startOctave = 3, octaves = 1): string[] => {
  // Detect scale type from key string
  const scaleName = key.toLowerCase().includes('m') && !key.toLowerCase().includes('maj')
    ? 'minor' : 'major'
  const intervals = SCALES[scaleName] ?? SCALES['major'] ?? []
  const rootSemitone = parseRoot(key)

  const notes: string[] = []
  for (let oct = startOctave; oct < startOctave + octaves; oct++) {
    for (const interval of intervals) {
      const semitone = (rootSemitone + interval) % 12
      const octave = oct + Math.floor((rootSemitone + interval) / 12)
      notes.push(`${NOTE_NAMES[semitone] ?? 'C'}${String(octave)}`)
    }
  }
  return notes
}

// chordNotes('Am', 3) → ['A3', 'C4', 'E4']
export const chordNotes = (chord: string, octave = 3): string[] => {
  const isMinor = chord.includes('m') && !chord.includes('maj')
  const intervals = isMinor ? [0, 3, 7] : [0, 4, 7]
  const rootSemitone = parseRoot(chord)

  return intervals.map(interval => {
    const total = rootSemitone + interval
    const semitone = total % 12
    const oct = octave + Math.floor(total / 12)
    return `${NOTE_NAMES[semitone] ?? 'C'}${String(oct)}`
  })
}
