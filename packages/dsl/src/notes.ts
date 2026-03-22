// noteHz — converts note names to frequencies
// Formula: 440 * 2^((midi - 69) / 12)  where A4 = midi 69 = 440 Hz
//
// Supported format: letter + optional # or b + octave
// Examples: 'A4' = 440, 'C4' = 261.63, 'F#3' = 185.0, 'Bb2' = 116.5

import { ScoreError } from '@score/core'

const NOTE_SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
}

/**
 * Convert a note name string to its frequency in Hz.
 *
 * Uses equal temperament tuning: `440 × 2^((midi − 69) / 12)`, with A4 = 440 Hz.
 *
 * @param name - Note name in the format `<Letter>[#|b]<Octave>`. E.g. `'A4'`, `'F#3'`, `'Bb2'`.
 * @returns Frequency in Hz.
 * @throws `ScoreError` if the note name does not match the expected format.
 *
 * @example
 * ```ts
 * noteHz('A4')   // → 440
 * noteHz('C4')   // → 261.63
 * noteHz('F#3')  // → 185.0
 * ```
 */
export const noteHz = (name: string): number => {
  const match = /^([A-G])(#|b)?(-?\d+)$/.exec(name)
  if (!match) {
    throw ScoreError(`Invalid note name: "${name}"`, {
      received: name,
      fix: 'Expected format: C4, F#3, Bb2 — letter, optional # or b, octave number.',
      docs: 'https://score.dev/docs/dsl#note-hz',
    })
  }
  const letter     = match[1] as string
  const accidental = match[2]
  const octaveStr  = match[3] as string
  const semitone   = NOTE_SEMITONES[letter] ?? 0
  const acc        = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0
  const octave     = parseInt(octaveStr, 10)
  const midi = semitone + acc + (octave + 1) * 12
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/**
 * Resolve a pattern value to a frequency in Hz.
 *
 * Accepts either a note name string (`'A4'`, `'F#3'`) or a raw Hz number.
 * Used by the engine to support mixed patterns like `['A2', 0, 'D3']` and
 * `[110, 0, 146.8]`.
 *
 * @param val - Note name string or frequency number. `0` means silence.
 * @returns Frequency in Hz, or the raw number if already numeric.
 *
 * @example
 * ```ts
 * resolveFreq('A4')   // → 440
 * resolveFreq(440)    // → 440
 * resolveFreq(0)      // → 0 (silence)
 * ```
 */
export const resolveFreq = (val: number | string): number => {
  if (typeof val === 'string') return noteHz(val)
  return val
}
