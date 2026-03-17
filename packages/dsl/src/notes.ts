// noteHz — converts note names to frequencies
// Formula: 440 * 2^((midi - 69) / 12)  where A4 = midi 69 = 440 Hz
//
// Supported format: letter + optional # or b + octave
// Examples: 'A4' = 440, 'C4' = 261.63, 'F#3' = 185.0, 'Bb2' = 116.5

const NOTE_SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
}

export const noteHz = (name: string): number => {
  const match = /^([A-G])(#|b)?(-?\d+)$/.exec(name)
  if (!match) throw new Error(`Invalid note name: "${name}". Expected format: C4, F#3, Bb2`)
  const letter     = match[1] as string
  const accidental = match[2]
  const octaveStr  = match[3] as string
  const semitone   = NOTE_SEMITONES[letter] ?? 0
  const acc        = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0
  const octave     = parseInt(octaveStr, 10)
  const midi = semitone + acc + (octave + 1) * 12
  return 440 * Math.pow(2, (midi - 69) / 12)
}

// Convenience: resolve a pattern value that may be a note name string or raw Hz number
// Used by the engine to support both: pattern: ['A2', 0, 'D3'] and pattern: [110, 0, 146.8]
export const resolveFreq = (val: number | string): number => {
  if (typeof val === 'string') return noteHz(val)
  return val
}
