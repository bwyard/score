// new-song.js — starter template for live coding
//
// 1. Copy this file:  cp examples/new-song.js my-track.js
// 2. Start playback:  score play my-track.js --watch
// 3. Edit and save — changes play back within ~300ms
//
// If you break something: fix the error, save again. The old version
// keeps playing while you edit — you never lose the beat.
//
// ─────────────────────────────────────────────────────────────────────
// INSTRUMENTS  import from '@score/dsl'
//   Kick(props)   — synthetic bass drum (sine sweep)
//   Snare(props)  — synthetic snare (noise + body)
//   HiHat(props)  — synthetic hi-hat (filtered noise)
//   Synth(props)  — oscillator with ADSR envelope and filter
//   Sample(props) — play an audio file (.wav / .mp3 / .ogg / .flac)
//
// PATTERNS     import from '@score/pattern'
//   euclidean(hits, steps)         — evenly spaced hits
//   stack(patA, patB)              — combine two patterns (OR)
//   fast(n, pat) / slow(n, pat)    — speed up / slow down
//   rev(pat)                       — reverse
//   shift(n, pat)                  — rotate by n steps
//   degrade(probability, pat)      — randomly drop hits
//   every(n, transform, pat)       — apply transform every n bars
//   scaleNotes(key, octave, octs)  — all notes in a scale
//
// EFFECTS      import from '@score/effects'
//   Delay({ time, feedback, mix })
//   Reverb({ roomSize, wet })
//   Distortion({ amount })
//   Filter({ type, frequency, Q })
//   Chorus / Phaser / Flanger / Compressor / EQ / Limiter / BitCrusher / Gate
//
// MATH         import from '@score/math'
//   drunk(stepSize, length)        — random walk
//   markov(matrix, length, seed)   — Markov chain melody
//   createLorenz()                 — chaos attractor
//   logisticMap(r, x0, n)          — logistic chaos
//   fibonacciRhythm(steps)         — Fibonacci hit pattern
//   range(min, max, pattern)       — scale values to a range
// ─────────────────────────────────────────────────────────────────────

import { Song, Kick, Snare, HiHat, Synth } from '@score/dsl'

// ── Drums ──────────────────────────────────────────────────────────────

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.9,
})

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.6,
})

const hihat = HiHat({
  pattern: [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0],
  volume: 0.25,
})

// ── Bass ───────────────────────────────────────────────────────────────

const bass = Synth({
  wave: 'sawtooth',           // 'sine' | 'square' | 'sawtooth' | 'triangle'
  gain: 0.25,
  envelope: { attack: 0.005, decay: 0.1, sustain: 0.5, release: 0.05 },
  filter: { type: 'lowpass', frequency: 800, Q: 1 },
  pattern: ['A2', 0, 0, 0,  'A2', 0, 'G2', 0,  'A2', 0, 0, 0,  'E2', 0, 0, 0],
})

// ── Song ───────────────────────────────────────────────────────────────

export default Song({
  bpm: 128,
  key: 'Am',   // metadata only — does not affect playback
  tracks: [kick, snare, hihat, bass],
})
