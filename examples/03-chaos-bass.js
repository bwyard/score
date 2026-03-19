// 03-chaos-bass.js
// Bass frequencies driven by the x-axis of a Lorenz attractor.
// Every run is the same (deterministic chaos). Change dt to reseed the attractor.
//
// Start: score play examples/03-chaos-bass.js --watch
//
// Things to try:
//   - Change the freq range: range(40, 300, ...) → range(100, 600, ...)
//   - Change length: 16 values → 8 (half-bar phrase) or 32 (two bars)
//   - Pass { sigma: 15, rho: 35 } to createLorenz() for a different butterfly
//   - Wrap bassFreqs in smooth(3, bassFreqs) to mellow out the jumps

import { Song, Kick, Synth } from '@score/dsl'
import { createLorenz, range, normalize, clip } from '@score/math'

const lorenz = createLorenz()
const xs = Array.from({ length: 16 }, () => lorenz.next().x)
const bassFreqs = clip(40, 300, range(40, 300, normalize(xs.map(v => Math.abs(v)))))

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.9,
})

const bass = Synth({
  wave: 'sawtooth',
  gain: 0.25,
  envelope: { attack: 0.005, decay: 0.15, sustain: 0.5, release: 0.06 },
  filter: { type: 'lowpass', frequency: 600 },
  pattern: bassFreqs,
})

export default Song({ bpm: 128, tracks: [kick, bass] })
