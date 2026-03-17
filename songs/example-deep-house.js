// example-deep-house.js — Score demo song
// Run with: score play songs/example-deep-house.js
//
// KEY DEMO POINTS:
//   • Song files are pure ESM — no build step, no compilation
//   • Instruments are factory functions with pattern arrays — reads like music
//   • The engine hydrates descriptors into actual audio — song author never touches AudioContext
//   • Arrangement is structural: Intro/Drop/Outro with explicit bar counts
//   • Ctrl+C stops cleanly — all audio resources disposed

import { Song, Kick, Snare, HiHat, Synth, Intro, Drop, Outro } from '@score/dsl'

// ── KEY / SCALE ───────────────────────────────────────────────────────────────
// D minor (warm, introspective — classic deep house tonality)
// All frequencies are exact: D2=73.42 Hz, A2=110 Hz, F3=174.6 Hz etc.

const D2 = 73.42
const A2 = 110.0
const C3 = 130.8
const D3 = 146.8
const F3 = 174.6
const A3 = 220.0

// ── DRUMS ─────────────────────────────────────────────────────────────────────
// Patterns: 16-step arrays, 1 = hit, 0 = rest
// 4 steps per beat × 4 beats = one bar

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],   // four on the floor
  synth: { frequency: 75, pitchDrop: 0.09 },                         // tuned to D
  volume: 0.9,
})

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],   // 2 and 4
  volume: 0.5,
})

const hihat = HiHat({
  pattern: [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0],   // 8th notes
  volume: 0.2,
})

// ── SYNTHESIS ─────────────────────────────────────────────────────────────────
// Sequence notation: note values separated by spaces, '.' = rest
// Notes resolve to their frequency at play time

const bass = Synth({
  wave: 'sawtooth',
  gain: 0.28,
  // Dm root movement over 2 bars (collapsed to 16 steps)
  pattern: [D2, 0, D2, 0,  0, D2, 0, A2,  C3, 0, C3, 0,  0, D3, 0, 0],
})

const pad = Synth({
  wave: 'triangle',
  gain: 0.12,
  // Sparse chord stabs — syncopated deep house feel
  pattern: [F3, 0, 0, 0,  A3, 0, 0, 0,  0,  0,  F3, 0,  0, 0, A3, 0],
})

// ── ARRANGEMENT ──────────────────────────────────────────────────────────────
// Sections describe structure — the engine schedules audio accordingly.
// Numbers = bars. Tracks listed = which instruments are active.

export default Song({
  bpm:    124,
  key:    'Dm',
  genre:  'deep-house',

  tracks: [kick, snare, hihat, bass, pad],

  arrangement: [
    Intro(4,  [kick, bass]),
    Drop(16,  [kick, snare, hihat, bass, pad]),
    Outro(4,  [kick, bass]),
  ],
})
