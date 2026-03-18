// example-techno.js — Score demo song
// Run with:  score play songs/example-techno.js
// Live mode: score play songs/example-techno.js --watch
//
// A minor, 140 BPM. Industrial techno: driving bass, lead stabs, offbeat hats.

import { Song, Kick, Snare, HiHat, Synth, Intro, Drop, Breakdown, Outro } from '@score/dsl'

// ── DRUMS ─────────────────────────────────────────────────────────────────────

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],   // four on the floor
  synth: { frequency: 60, pitchDrop: 0.07 },
  volume: 0.92,
})

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.55,
})

const hihat = HiHat({
  pattern: [0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0],   // offbeat 8ths
  volume: 0.18,
})

// ── SYNTHESIS ─────────────────────────────────────────────────────────────────
// Note names: 'A2', 'D3', 'E4' etc. Sharp = #  Flat = b  0 = rest.

const bass = Synth({
  wave: 'sawtooth',
  gain: 0.30,
  envelope: { attack: 0.003, decay: 0.10, sustain: 0.5, release: 0.04 },
  filter: { type: 'lowpass', frequency: 800, Q: 2.0 },
  pattern: ['A2', 0, 'A2', 0,  0, 'A2', 0, 'D3',  'E3', 0, 'E3', 0,  0, 'G3', 0, 0],
})

const lead = Synth({
  wave: 'square',
  gain: 0.14,
  envelope: { attack: 0.002, decay: 0.06, sustain: 0.3, release: 0.03 },
  pattern: [0, 0, 'E4', 0,  0, 0, 'A3', 0,  0, 'E4', 0, 0,  'A3', 0, 0, 0],
})

// ── ARRANGEMENT ───────────────────────────────────────────────────────────────
export default Song({
  bpm: 140,
  key: 'Am',
  genre: 'techno',
  tracks: [kick, snare, hihat, bass, lead],
  arrangement: [
    Intro(4,       [kick, bass]),
    Drop(16,       [kick, snare, hihat, bass, lead]),
    Breakdown(8,   [hihat, bass]),
    Drop(16,       [kick, snare, hihat, bass, lead]),
    Outro(4,       [kick, bass]),
  ],
})
