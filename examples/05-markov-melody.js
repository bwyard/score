// 05-markov-melody.js
// Melody driven by a 3-state Markov chain. Musically coherent, different every run.
// Change the seed (77) to get a different variation with the same character.
//
// Start: score play examples/05-markov-melody.js --watch
//
// Things to try:
//   - Change seed: 77 → 42 → 99 → 1 (each gives a different melody)
//   - Change noteMap: ['A3','C4','E4'] → ['C4','E4','G4'] (major feel)
//   - Adjust transition matrix rows — higher diagonal = more repetition
//   - Change the filter type on lead: 'bandpass' → 'lowpass' (mellower)

import { Song, Kick, Snare, Synth } from '@score/dsl'
import { markov } from '@score/math'

const chain = markov([
  [0.5, 0.4, 0.1],
  [0.3, 0.3, 0.4],
  [0.2, 0.4, 0.4],
], 16, 77)

const noteMap = ['A3', 'C4', 'E4']
const melody  = chain.map(i => noteMap[i] ?? 'A3')

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.85,
})

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.5,
})

const lead = Synth({
  wave: 'sawtooth',
  gain: 0.2,
  envelope: { attack: 0.01, decay: 0.08, sustain: 0.4, release: 0.04 },
  filter: { type: 'bandpass', frequency: 2000, Q: 2.0 },
  pattern: melody,
})

export default Song({ bpm: 126, key: 'Am', tracks: [kick, snare, lead] })
