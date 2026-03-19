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

/**
 * Return all note names in a key's scale across one or more octaves.
 * Detects major vs minor from the key string — `'Am'` = A minor, `'C'` = C major.
 * Note names follow Score convention: `'A2'`, `'F#3'`, `'Bb4'`.
 *
 * @param key - Key and scale name, e.g. `'C'`, `'Am'`, `'F#'`, `'Bbm'`.
 * @param startOctave - Lowest octave to include. Default `3`.
 * @param octaves - Number of octaves to span. Default `1`.
 * @returns Array of note name strings in ascending order.
 *
 * @example
 * ```ts
 * scaleNotes('C', 4, 1)    // → ['C4','D4','E4','F4','G4','A4','B4']
 * scaleNotes('Am', 3, 1)   // → ['A3','B3','C4','D4','E4','F4','G4']
 * scaleNotes('C', 3, 2)    // → 14 notes spanning two octaves
 *
 * // Feed scale tones directly into a melodic pattern
 * const melody = Synth({ pattern: scaleNotes('Am', 3, 1) })
 * ```
 *
 * @see {@link chordNotes} — get the triad notes for a chord symbol
 */
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

/**
 * Return the three notes of a triad chord at the given octave.
 * Detects major vs minor from the chord symbol — `'Am'` = minor, `'C'` = major.
 * Note names follow Score convention: `'A3'`, `'C4'`, `'E4'`.
 *
 * @param chord - Chord symbol, e.g. `'C'`, `'Am'`, `'F#m'`, `'Bb'`.
 * @param octave - Root note octave. Default `3`.
 * @returns Array of three note name strings `[root, third, fifth]`.
 *
 * @example
 * ```ts
 * chordNotes('Am', 3)  // → ['A3', 'C4', 'E4']
 * chordNotes('C', 4)   // → ['C4', 'E4', 'G4']
 * chordNotes('Dm', 3)  // → ['D3', 'F3', 'A3']
 *
 * // Arpeggiate a chord by spreading its notes across pattern steps
 * const arp = Synth({ pattern: chordNotes('Am', 3) })
 * ```
 *
 * @see {@link scaleNotes} — get all notes in a scale
 */
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
