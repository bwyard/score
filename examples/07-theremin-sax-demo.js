// 07-theremin-sax-demo.js — Theremin + Sax + Kick with arrangement
//
// Tests @score/components instruments wired into the Song DSL.
// Uses arrangement sections to demonstrate intro → drop → breakdown → outro.
//
// Run: score play C:/Users/bwyar/development/score/examples/07-theremin-sax-demo.js --watch
//
// Live coding ideas:
//   - Change theremin note: note: 'E4' → 'D4' → 'C4'
//   - Change sax pattern notes: 'A3' → 'C4' → 'G3'
//   - Change kick pattern: add/remove hits
//   - Adjust vibratoDepth for wild vs subtle theremin

import { Song, Kick, Theremin, Sax, Intro, Drop, Breakdown, Outro } from '@score/dsl'

// ── Kick ────────────────────────────────────────────────────────────────────

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.85,
})

// ── Theremin ────────────────────────────────────────────────────────────────
// Continuous sine tone — try changing note and vibratoDepth live

const theremin = Theremin({
  note: 'B4',         // 440 Hz — try 'E4', 'D4', 'C5'
  vibratoRate: 5,     // Hz — wobble speed
  vibratoDepth: 8,    // Hz — wobble width, 0 = no vibrato
  gain: 0.35,
  volume: 0.95,
})

// ── Sax ─────────────────────────────────────────────────────────────────────
// Sawtooth + bandpass = saxophone-ish timbre, triggered per step

const sax = Sax({
  note: 'A3',         // starting note — pattern overrides per-step
  gain: 0.45,
  duration: 0.3,
  pattern: [
    'A3', 0,    'C4', 0,
    'A3', 0,    'E4', 0,
    'A3', 0,    'C4', 0,
    'G3', 0,    'A3', 0,
  ],
})

// ── Arrangement ──────────────────────────────────────────────────────────────
// Sections mute/unmute tracks — theremin alone, then sax joins, then drop

const intro     = Intro(4,      [theremin])              // 4 bars — theremin only
const drop      = Drop(8,       [kick, theremin, sax])   // 8 bars — full band
const breakdown = Breakdown(4,  [theremin, sax])         // 4 bars — no kick
const outro     = Outro(4,      [theremin])              // 4 bars — fade out

export default Song({
  bpm: 118,
  key: 'Am',
  tracks: [kick, theremin, sax],
  arrangement: [intro, drop, breakdown, outro],
})
