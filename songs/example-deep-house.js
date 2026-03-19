// example-deep-house.js — Score demo song
// Run with:  score play songs/example-deep-house.js
// Live mode: score play songs/example-deep-house.js --watch
//
// D minor, 124 BPM. Warm, introspective — classic deep house tonality.

import { Song, Kick, Snare, HiHat, Synth, Intro, Drop, Outro } from '@score/dsl'

// ── DRUMS ─────────────────────────────────────────────────────────────────────
// Pattern: 16-step array. 1 = hit, 0 = rest. 4 steps = 1 beat.

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],   // four on the floor
  synth: { frequency: 75, pitchDrop: 0.09 },                         // tuned to D
  volume: 0.9,
})

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],   // beats 2 and 4
  volume: 0.5,
})

const hihat = HiHat({
  pattern: [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0],   // 8th notes
  volume: 0.2,
})

// ── SYNTHESIS ─────────────────────────────────────────────────────────────────
// Note names: 'D2', 'A2', 'F#3', 'Bb4' etc. Sharp = #  Flat = b  0 = rest.

const bass = Synth({
  wave: 'sawtooth',
  gain: 0.28,
  envelope: { attack: 0.003, decay: 0.12, sustain: 0.6, release: 0.05 },
  filter: { type: 'lowpass', frequency: 900, Q: 1.2 },
  // Dm root movement over 2 bars
  pattern: ['D2', 0, 'D2', 0,  0, 'D2', 0, 'A2',  'C3', 0, 'C3', 0,  0, 'D3', 0, 0],
})

const pad = Synth({
  wave: 'triangle',
  gain: 0.12,
  envelope: { attack: 0.08, decay: 0.2, sustain: 0.8, release: 0.15 },
  // Sparse chord stabs — syncopated deep house feel
  pattern: ['F3', 0, 0, 0,  'A3', 0, 0, 0,  0, 0, 'F3', 0,  0, 0, 'A3', 0],
})

const sax = Synth({
  wave: 'sawtooth',           // raw, harmonically rich — sax fundamental
  gain: 0.12,
  envelope: { attack: 0.02, decay: 0.15, sustain: 0.85, release: 0.08 },
  filter: { type: 'lowpass', frequency: 1400, Q: 2.5 },  // cuts highs, adds body
  pattern: ['D3', 0, 'F3', 0,  'A3', 0, 0, 0,  'G3', 0, 'E3', 0,  'D3', 0, 0, 0],
})


// ── ARRANGEMENT ───────────────────────────────────────────────────────────────
export default Song({
  bpm: 124,
  key: 'Dm',
  genre: 'deep-house',
  tracks: [kick, snare, hihat, sax, bass, pad],
  arrangement: [
    Intro(4,  [kick, bass]),
    Drop(16,  [kick, snare, hihat, bass, pad]),
    Outro(16,  [kick, bass, sax]),
  ],
})
