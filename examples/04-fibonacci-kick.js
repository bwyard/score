// 04-fibonacci-kick.js
// Kick hits at Fibonacci positions (0,1,2,3,5,8,13...). Hi-hat fills the gaps.
//
// Start: score play examples/04-fibonacci-kick.js --watch
//
// Things to try:
//   - Change fibonacciRhythm(16) → fibonacciRhythm(8) for a tighter loop
//   - Change pad wave: 'triangle' → 'sine' (smoother) or 'square' (buzzier)
//   - Change pad notes: swap 'A3'/'C4'/'E4'/'G4' for a different chord
//   - Comment out hihat to hear the fibonacci rhythm alone

import { Song, Kick, HiHat, Synth } from '@score/dsl'
import { fibonacciRhythm, patternNot } from '@score/math'

const fibPat = fibonacciRhythm(16)

const kick = Kick({
  pattern: fibPat,
  volume: 0.85,
})

const hihat = HiHat({
  pattern: patternNot(fibPat),
  volume: 0.18,
})

const pad = Synth({
  wave: 'triangle',
  gain: 0.12,
  envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.2 },
  pattern: ['A3', 0, 0, 0,  'C4', 0, 0, 0,  'E4', 0, 0, 0,  'G4', 0, 0, 0],
})

export default Song({ bpm: 120, key: 'Am', tracks: [kick, hihat, pad] })
