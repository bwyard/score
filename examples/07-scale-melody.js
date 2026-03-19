// 07-scale-melody.js
// Melody built from all notes in A minor. Reversed every other bar with every().
//
// Start: score play examples/07-scale-melody.js --watch
//
// Things to try:
//   - Change key: 'Am' → 'Cm' → 'F#m' → 'C' (major)
//   - Change octave: scaleNotes('Am', 3, 1) → ('Am', 4, 1) → ('Am', 3, 2) (two octaves)
//   - Change every(2, rev, ...) → every(4, rev, ...) (reverses less often)
//   - Try a different transform: every(2, p => fast(2, p), scale) (rushes every other bar)
//   - Change lead wave: 'sawtooth' → 'triangle' or 'square'

import { Song, Kick, Snare, HiHat, Synth } from '@score/dsl'
import { scaleNotes, rev, every } from '@score/pattern'

const scale = scaleNotes('Am', 3, 1)

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.85,
})

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.5,
})

const hihat = HiHat({
  pattern: [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0],
  volume: 0.2,
})

const lead = Synth({
  wave: 'sawtooth',
  gain: 0.18,
  envelope: { attack: 0.008, decay: 0.12, sustain: 0.5, release: 0.06 },
  filter: { type: 'lowpass', frequency: 3000 },
  pattern: every(2, rev, scale),
})

export default Song({ bpm: 124, key: 'Am', tracks: [kick, snare, hihat, lead] })
