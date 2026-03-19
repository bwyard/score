// 01-minimal-techno.js
// Four-on-the-floor kick, offbeat hi-hat, sawtooth bass. 125 BPM.
//
// Start: score play examples/01-minimal-techno.js --watch
// Then edit and save — hear changes within ~300ms.
//
// Things to try:
//   - Change bpm: 125 → 130, 140, 100
//   - Change the bass wave: 'sawtooth' → 'square' → 'triangle'
//   - Change filter frequency: 700 → 200 (dark) or 2000 (bright)
//   - Change the kick pitchDrop: 0.12 → 0.05 (tight) or 0.3 (boomy)
//   - Mute the hi-hat: change volume to 0 or comment it out of tracks

import { Song, Kick, HiHat, Synth } from '@score/dsl'

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  synth: { frequency: 65, pitchDrop: 0.12 },
  volume: 0.9,
})

const hihat = HiHat({
  pattern: [0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0],
  volume: 0.3,
})

const bass = Synth({
  wave: 'sawtooth',
  gain: 0.28,
  envelope: { attack: 0.003, decay: 0.08, sustain: 0.5, release: 0.04 },
  filter: { type: 'lowpass', frequency: 700, Q: 1.5 },
  pattern: ['A2', 0, 0, 0,  'A2', 0, 'G2', 0,  'A2', 0, 0, 0,  'E2', 0, 0, 0],
})

export default Song({ bpm: 125, key: 'Am', tracks: [kick, hihat, bass] })
