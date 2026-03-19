// notes.ts — MIDI and frequency utilities for @score/musical
//
// noteToHz: MIDI number → frequency in Hz (standard 440 Hz tuning, A4 = 69)
// NOTE_TO_MIDI: note name string → MIDI number (C0–B8)
// noteNameToHz: note name string → frequency in Hz (convenience combining both)

/**
 * Map from note name to MIDI number. Covers C0–B8 (MIDI 12–119).
 * Enharmonic equivalents are included: `'C#4'` and `'Db4'` both map to `61`.
 *
 * @example
 * ```ts
 * NOTE_TO_MIDI['A4']  // → 69
 * NOTE_TO_MIDI['C4']  // → 60
 * NOTE_TO_MIDI['Bb3'] // → 58
 * ```
 */
export const NOTE_TO_MIDI: Record<string, number> = (() => {
  const SEMITONES: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  }
  const SHARPS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const FLATS  = { 'Db': 1, 'Eb': 3, 'Fb': 4, 'Gb': 6, 'Ab': 8, 'Bb': 10, 'Cb': 11 }

  const map: Record<string, number> = {}

  for (let octave = 0; octave <= 8; octave++) {
    for (const letter of SHARPS) {
      const semi = SEMITONES[letter] as number
      const midi = (octave + 1) * 12 + semi
      if (midi >= 0 && midi <= 127) {
        map[`${letter}${String(octave)}`] = midi
        // Sharp variant
        if (semi < 11) {
          const sharpMidi = midi + 1
          if (sharpMidi <= 127) {
            map[`${letter}#${String(octave)}`] = sharpMidi
          }
        }
      }
    }
    for (const [flatName, semi] of Object.entries(FLATS)) {
      const midi = (octave + 1) * 12 + semi
      if (midi >= 0 && midi <= 127) {
        map[`${flatName}${String(octave)}`] = midi
      }
    }
  }
  return map
})()

/**
 * Convert a MIDI note number to a frequency in Hz.
 * Uses equal temperament tuned to A4 = 440 Hz.
 *
 * Formula: `440 * 2^((midi - 69) / 12)`
 *
 * @param midi - MIDI note number (0–127). 60 = C4, 69 = A4.
 * @returns Frequency in Hz.
 *
 * @example
 * ```ts
 * noteToHz(69)  // → 440.0   (A4)
 * noteToHz(60)  // → 261.63  (C4, middle C)
 * noteToHz(57)  // → 220.0   (A3)
 * noteToHz(81)  // → 880.0   (A5)
 * ```
 */
export const noteToHz = (midi: number): number =>
  440 * Math.pow(2, (midi - 69) / 12)

/**
 * Convert a note name string to a frequency in Hz.
 * Combines {@link NOTE_TO_MIDI} lookup with {@link noteToHz}.
 * Returns 440 Hz (A4) for unrecognised names.
 *
 * @param name - Note name, e.g. `'A4'`, `'C#3'`, `'Bb5'`.
 * @returns Frequency in Hz.
 *
 * @example
 * ```ts
 * noteNameToHz('A4')   // → 440.0
 * noteNameToHz('C4')   // → 261.63
 * noteNameToHz('F#3')  // → 185.0
 * noteNameToHz('Bb2')  // → 116.54
 * ```
 */
export const noteNameToHz = (name: string): number => {
  const midi = NOTE_TO_MIDI[name]
  return midi !== undefined ? noteToHz(midi) : 440
}
