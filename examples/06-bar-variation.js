// 06-bar-variation.js
// Instruments that change behavior based on bar number — the core live coding tool.
// Function patterns receive (step, bar) and return a value. No array needed.
//
// Start: score play examples/06-bar-variation.js --watch
//
// Things to try:
//   - Change the fill condition: bar % 4 === 3 → bar % 2 === 1 (more fills)
//   - Change the bass alternation: bar % 2 → bar % 4 (slower cycle)
//   - Change hihat doubling: bar % 8 === 7 → bar % 4 === 3 (more doubles)
//   - Add a third bass line and switch every 3 bars: bar % 3

import { Song, Kick, HiHat, Synth } from '@score/dsl'

const kick = Kick({
  volume: 0.9,
  pattern: (step, bar) => {
    // Extra hit at step 12 on every 4th bar
    if (bar % 4 === 3 && step === 12) return 1
    return [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0][step]
  },
})

const hihat = HiHat({
  volume: 0.2,
  pattern: (step, bar) => {
    const base = [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0]
    // Double-time hi-hat on every 8th bar
    if (bar % 8 === 7) return base[(step * 2) % 16]
    return base[step]
  },
})

const bass = Synth({
  wave: 'square',
  gain: 0.22,
  envelope: { attack: 0.003, decay: 0.1, sustain: 0.5, release: 0.05 },
  filter: { type: 'lowpass', frequency: 800 },
  pattern: (step, bar) => {
    const lineA = ['A2', 0, 'A2', 0,  0, 'G2', 0, 'E2']
    const lineB = ['E2', 0, 'E2', 0,  0, 'A2', 0, 'G2']
    // Alternate bass lines every 2 bars
    return (bar % 2 === 0 ? lineA : lineB)[step % 8] ?? 0
  },
})

export default Song({ bpm: 128, key: 'Am', tracks: [kick, hihat, bass] })
