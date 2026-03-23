// theory.ts — Pure music theory functions for the Score DSL.
//
// All exports are pure functions (const + arrow, zero classes, zero let).
// No audio — no frequencies, no Web Audio, no Tone.js.
// All note names follow Score notation: letter + optional #/b + octave (e.g. 'C4', 'F#3').
//
// Functions:
//   chord(root, type)              → string[] of note names
//   scale(name, root, opts?)       → string[] of note names
//   progression(chords, key, ext?) → string[] chord symbols
//   Scale(name, root)              → { name, root, notes: string[] }
//   Progression(chords, key)       → { chords: string[], key: string }

import { ScoreError } from '@score/core'

// ── Semitone tables ──────────────────────────────────────────────────────────

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

/** Normalise a note letter + accidental to a semitone index 0–11. */
const noteToSemitone = (note: string): number => {
  const match = /^([A-G])(#|b)?$/.exec(note)
  if (!match) {
    throw ScoreError(`Invalid note root: "${note}"`, {
      received: note,
      fix: 'Expected a note letter (A–G) with optional # or b, e.g. "C", "F#", "Bb".',
      docs: 'https://score.dev/docs/dsl#theory',
    })
  }
  const letter = match[1] as string
  const acc    = match[2]
  const base   = NOTE_NAMES.indexOf(letter as typeof NOTE_NAMES[number])
  const offset = acc === '#' ? 1 : acc === 'b' ? -1 : 0
  return ((base + offset) + 12) % 12
}

/** Build a note name from a semitone index and octave, using sharps. */
const semitoneToNote = (semitone: number, octave: number): string => {
  const name = NOTE_NAMES[((semitone % 12) + 12) % 12] ?? 'C'
  return `${name}${String(octave)}`
}

// ── Chord interval maps ──────────────────────────────────────────────────────

const CHORD_INTERVALS: Record<string, readonly number[]> = {
  // Triads
  'major':      [0, 4, 7],
  'minor':      [0, 3, 7],
  'diminished': [0, 3, 6],
  'augmented':  [0, 4, 8],
  'sus2':       [0, 2, 7],
  'sus4':       [0, 5, 7],
  // Sevenths
  'major7':     [0, 4, 7, 11],
  'minor7':     [0, 3, 7, 10],
  'dominant7':  [0, 4, 7, 10],
  'halfDim7':   [0, 3, 6, 10],
  'dim7':       [0, 3, 6, 9],
  'minMaj7':    [0, 3, 7, 11],
  // Extended
  'major9':     [0, 4, 7, 11, 14],
  'minor9':     [0, 3, 7, 10, 14],
  'dominant9':  [0, 4, 7, 10, 14],
  'add9':       [0, 4, 7, 14],
  'minor11':    [0, 3, 7, 10, 14, 17],
  'major13':    [0, 4, 7, 11, 14, 21],
}

// ── Scale interval maps ──────────────────────────────────────────────────────

const SCALE_INTERVALS: Record<string, readonly number[]> = {
  // Heptatonic
  'major':           [0, 2, 4, 5, 7, 9, 11],
  'natural minor':   [0, 2, 3, 5, 7, 8, 10],
  'harmonic minor':  [0, 2, 3, 5, 7, 8, 11],
  'melodic minor':   [0, 2, 3, 5, 7, 9, 11],
  'dorian':          [0, 2, 3, 5, 7, 9, 10],
  'phrygian':        [0, 1, 3, 5, 7, 8, 10],
  'lydian':          [0, 2, 4, 6, 7, 9, 11],
  'mixolydian':      [0, 2, 4, 5, 7, 9, 10],
  'locrian':         [0, 1, 3, 5, 6, 8, 10],
  'phrygian dominant': [0, 1, 4, 5, 7, 8, 10],
  // Pentatonic
  'major pentatonic': [0, 2, 4, 7, 9],
  'minor pentatonic': [0, 3, 5, 7, 10],
  'blues':            [0, 3, 5, 6, 7, 10],
  // Symmetric
  'whole tone':       [0, 2, 4, 6, 8, 10],
  'diminished':       [0, 2, 3, 5, 6, 8, 9, 11],
  'chromatic':        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  // Other
  'hungarian minor':  [0, 2, 3, 6, 7, 8, 11],
  'in':               [0, 1, 5, 7, 8],
  'insen':            [0, 1, 5, 7, 10],
  'yo':               [0, 2, 5, 7, 9],
}

// ── Diatonic chord quality tables ────────────────────────────────────────────

/** Roman numeral symbols for a major key diatonic progression. */
const MAJOR_DIATONIC = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'] as const

/** Roman numeral symbols for a natural minor key diatonic progression. */
const MINOR_DIATONIC = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'] as const

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Build note names from a root (no octave) + interval array at a given octave.
 * Intervals ≥ 12 carry over to the next octave.
 */
const buildNotes = (rootSemitone: number, intervals: readonly number[], octave: number): string[] =>
  intervals.map(interval => {
    const total   = rootSemitone + interval
    const oct     = octave + Math.floor(total / 12)
    const semitone = total % 12
    return semitoneToNote(semitone, oct)
  })

/** Split a root string like 'C4', 'F#3', 'Bb' into `note` and `octave`. */
const splitRoot = (root: string): { note: string; octave: number } => {
  const match = /^([A-G][#b]?)(-?\d+)?$/.exec(root)
  if (!match) {
    throw ScoreError(`Invalid root: "${root}"`, {
      received: root,
      fix: 'Expected note letter with optional accidental and optional octave, e.g. "C4", "F#", "Bb3".',
      docs: 'https://score.dev/docs/dsl#theory',
    })
  }
  return {
    note:   match[1] as string,
    octave: match[2] !== undefined ? parseInt(match[2], 10) : 4,
  }
}

// ── Public functions ─────────────────────────────────────────────────────────

/**
 * Build a chord from a root note and chord type.
 *
 * Returns an array of note name strings in close voicing, ascending from the root.
 * Intervals \> an octave (9th, 11th, 13th) extend into the next octave.
 *
 * @param root - Root note with optional octave, e.g. `'C4'`, `'F#3'`, `'Bb'` (defaults to octave 4).
 * @param type - Chord type key, e.g. `'major'`, `'minor7'`, `'dominant9'`.
 * @returns Array of note name strings, e.g. `['C4', 'E4', 'G4']`.
 * @throws `ScoreError` if root format is invalid or chord type is unknown.
 *
 * @example
 * ```ts
 * chord('C4', 'major')     // → ['C4', 'E4', 'G4']
 * chord('A3', 'minor7')    // → ['A3', 'C4', 'E4', 'G4']
 * chord('F#4', 'dominant9') // → ['F#4', 'A#4', 'C#5', 'E5', 'G#5']
 * ```
 */
export const chord = (root: string, type: string): string[] => {
  const intervals = CHORD_INTERVALS[type]
  if (!intervals) {
    throw ScoreError(`Unknown chord type: "${type}"`, {
      received: type,
      fix: `Known types: ${Object.keys(CHORD_INTERVALS).join(', ')}`,
      docs: 'https://score.dev/docs/dsl#chord',
    })
  }
  const { note, octave } = splitRoot(root)
  const rootSemitone     = noteToSemitone(note)
  return buildNotes(rootSemitone, intervals, octave)
}

/**
 * Build a scale from a name and root note.
 *
 * Returns an array of note name strings for one octave, ascending from the root.
 *
 * @param name - Scale name, e.g. `'major'`, `'dorian'`, `'minor pentatonic'`.
 * @param root - Root note with optional octave, e.g. `'C4'`, `'A3'`.
 * @param opts - Optional `{ octaves?: number }` — number of octaves to generate (default 1).
 * @returns Array of note name strings.
 * @throws `ScoreError` if scale name or root format is invalid.
 *
 * @example
 * ```ts
 * scale('major', 'C4')                  // → ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']
 * scale('minor pentatonic', 'A3')        // → ['A3', 'C4', 'D4', 'E4', 'G4']
 * scale('dorian', 'D4', { octaves: 2 }) // → 14 notes across two octaves
 * ```
 */
export const scale = (
  name: string,
  root: string,
  opts?: { readonly octaves?: number },
): string[] => {
  const intervals = SCALE_INTERVALS[name]
  if (!intervals) {
    throw ScoreError(`Unknown scale: "${name}"`, {
      received: name,
      fix: `Known scales: ${Object.keys(SCALE_INTERVALS).join(', ')}`,
      docs: 'https://score.dev/docs/dsl#scale',
    })
  }
  const { note, octave } = splitRoot(root)
  const rootSemitone     = noteToSemitone(note)
  const octaves          = opts?.octaves ?? 1

  const result: string[] = []
  for (let o = 0; o < octaves; o++) {
    const baseOctave = octave + o
    for (const interval of intervals) {
      const total     = rootSemitone + interval
      const oct       = baseOctave + Math.floor(total / 12)
      const semitone  = total % 12
      result.push(semitoneToNote(semitone, oct))
    }
  }
  return result
}

/**
 * Build a chord progression from chord symbols relative to a key.
 *
 * Accepts Roman numeral symbols (`'I'`, `'IV'`, `'V'`, `'vi'`) or Nashville numbers
 * (`'1'`, `'4'`, `'5'`, `'6m'`). Returns an array of concrete chord symbol strings.
 *
 * @param chords - Array of Roman numeral or Nashville number symbols.
 * @param key    - Key root, e.g. `'C'`, `'G'`, `'F#'`. Minor keys: `'Am'`, `'Gm'`.
 * @param ext    - Optional chord extension applied to all chords, e.g. `'7'`, `'maj7'`.
 * @returns Array of chord symbol strings, e.g. `['Cmaj7', 'Am7', 'Fmaj7', 'G7']`.
 * @throws `ScoreError` if a chord symbol is unrecognised.
 *
 * @example
 * ```ts
 * progression(['I', 'V', 'vi', 'IV'], 'C')
 * // → ['C', 'G', 'Am', 'F']
 *
 * progression(['i', 'VI', 'III', 'VII'], 'Am')
 * // → ['Am', 'F', 'C', 'G']
 *
 * progression(['I', 'IV', 'V'], 'G', '7')
 * // → ['Gmaj7', 'Cmaj7', 'D7']
 * ```
 */
export const progression = (
  chords: readonly string[],
  key: string,
  ext?: string,
): string[] => {
  const isMinor    = key.endsWith('m')
  const keyRoot    = isMinor ? key.slice(0, -1) : key
  const intervals  = SCALE_INTERVALS[isMinor ? 'natural minor' : 'major'] as readonly number[]
  const diatonic   = isMinor ? MINOR_DIATONIC : MAJOR_DIATONIC
  const rootSemitone = noteToSemitone(keyRoot)

  // Roman numeral → scale degree index (0-based)
  const ROMAN_TO_INDEX: Record<string, number> = {
    'I': 0, 'II': 1, 'III': 2, 'IV': 3, 'V': 4, 'VI': 5, 'VII': 6,
    'i': 0, 'ii': 1, 'iii': 2, 'iv': 3, 'v': 4, 'vi': 5, 'vii': 6,
    'ii°': 1, 'vii°': 6,
  }

  // Nashville number → scale degree index
  const NASHVILLE_TO_INDEX: Record<string, number> = {
    '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6,
    '1m': 0, '2m': 1, '3m': 2, '4m': 3, '5m': 4, '6m': 5, '7m': 6,
  }

  return chords.map(symbol => {
    const degreeIndex =
      ROMAN_TO_INDEX[symbol] ??
      NASHVILLE_TO_INDEX[symbol]

    if (degreeIndex === undefined) {
      throw ScoreError(`Unrecognised chord symbol: "${symbol}"`, {
        received: symbol,
        fix: 'Use Roman numerals (I, ii, IV, V, vi) or Nashville numbers (1, 4, 5, 6m).',
        docs: 'https://score.dev/docs/dsl#progression',
      })
    }

    const interval   = intervals[degreeIndex] as number
    const semitone   = (rootSemitone + interval + 12) % 12
    const rootNote   = NOTE_NAMES[semitone] as string

    // Determine quality from the diatonic symbol
    const diatonicSym = diatonic[degreeIndex] as string
    const isLower     = diatonicSym === diatonicSym.toLowerCase()
    const isDim       = diatonicSym.endsWith('°')

    const quality =
      isDim    ? 'dim'
      : isLower ? 'm'
      : ''

    const extSuffix =
      ext === undefined     ? ''
      : isLower && ext === '7' ? 'm7'
      : ext === '7'         ? 'maj7'
      : ext

    return `${rootNote}${quality}${extSuffix}`
  })
}

// ── Value-object factories ───────────────────────────────────────────────────

/** Return type for {@link Scale}. */
export type ScaleObject = {
  readonly name:  string
  readonly root:  string
  readonly notes: readonly string[]
}

/** Return type for {@link Progression}. */
export type ProgressionObject = {
  readonly chords: readonly string[]
  readonly key:    string
}

/**
 * Scale value object — wraps `scale()` in a plain data record.
 *
 * @param name - Scale name, e.g. `'major'`, `'dorian'`.
 * @param root - Root note with optional octave, e.g. `'C4'`.
 * @returns `{ name, root, notes }`.
 *
 * @example
 * ```ts
 * Scale('major', 'C4')
 * // → { name: 'major', root: 'C4', notes: ['C4','D4','E4','F4','G4','A4','B4'] }
 * ```
 */
export const Scale = (name: string, root: string): ScaleObject => ({
  name,
  root,
  notes: scale(name, root),
})

/**
 * Progression value object — wraps `progression()` in a plain data record.
 *
 * @param chords - Roman numeral or Nashville number symbols.
 * @param key    - Key root, e.g. `'C'`, `'Am'`.
 * @returns `{ chords, key }` where `chords` are concrete chord symbol strings.
 *
 * @example
 * ```ts
 * Progression(['I', 'V', 'vi', 'IV'], 'C')
 * // → { chords: ['C', 'G', 'Am', 'F'], key: 'C' }
 * ```
 */
export const Progression = (chords: readonly string[], key: string): ProgressionObject => ({
  chords: progression(chords, key),
  key,
})
