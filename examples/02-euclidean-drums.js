// 02-euclidean-drums.js
// Three euclidean rhythms layered into a polyrhythmic groove.
//
// Start: score play examples/02-euclidean-drums.js --watch
//
// Things to try:
//   - Change hit counts: euclidean(4, 16) → (3, 16) → (7, 16)
//   - Change bpm: 132 → 145 (harder) or 110 (half-time feel)
//   - Add a rotation offset: euclidean(3, 16, 4) shifts the pattern 4 steps
//   - Stack two euclidean patterns: stack(euclidean(3,16), euclidean(5,16))

import { Song, Kick, Snare, HiHat } from '@score/dsl'
import { euclidean, stack } from '@score/pattern'

const kick = Kick({
  pattern: euclidean(4, 16),
  volume: 0.9,
})

const snare = Snare({
  pattern: euclidean(3, 16, 4),
  volume: 0.55,
})

const hihat = HiHat({
  pattern: stack(euclidean(5, 16), euclidean(3, 16, 8)),
  volume: 0.2,
})

export default Song({ bpm: 132, tracks: [kick, snare, hihat] })
