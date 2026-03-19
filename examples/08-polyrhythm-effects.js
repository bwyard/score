// 08-polyrhythm-effects.js
// 3-against-5 polyrhythm. Distortion and delay on the bass.
//
// Start: score play examples/08-polyrhythm-effects.js --watch
//
// Things to try:
//   - Change Distortion amount: 0.25 → 0.05 (subtle) or 0.7 (heavy)
//   - Change Delay time: 0.375 → 0.25 (quarter note) or 0.1875 (dotted-eighth at 128)
//   - Swap threes/fives: tile(euclidean(4, 8), 16) for a different feel
//   - Add Reverb to the bass: Reverb({ roomSize: 0.6, wet: 0.25 })
//   - Add effects to snare: effects: [Reverb({ roomSize: 0.3, wet: 0.15 })]

import { Song, Kick, Snare, HiHat, Synth } from '@score/dsl'
import { Distortion, Delay } from '@score/effects'
import { euclidean, stack, shift } from '@score/pattern'
import { tile } from '@score/math'

const threes = tile(euclidean(3, 8), 16)
const fives  = tile(euclidean(5, 8), 16)

const kick = Kick({
  pattern: stack(threes, fives),
  volume: 0.85,
})

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.5,
})

const hihat = HiHat({
  pattern: shift(1, stack(threes, fives)),
  volume: 0.18,
})

const bass = Synth({
  wave: 'sawtooth',
  gain: 0.25,
  envelope: { attack: 0.004, decay: 0.1, sustain: 0.55, release: 0.05 },
  filter: { type: 'lowpass', frequency: 750 },
  pattern: ['A2', 0, 'C3', 0,  'E3', 0, 'G2', 0,  'A2', 0, 'D3', 0,  'E3', 0, 'A2', 0],
  effects: [
    Distortion({ amount: 0.25 }),
    Delay({ time: 0.375, feedback: 0.3, mix: 0.2 }),
  ],
})

export default Song({ bpm: 128, key: 'Am', tracks: [kick, snare, hihat, bass] })
