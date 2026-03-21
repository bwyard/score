// example-techno.js — Score demo song
// Run with:  score play songs/example-techno.js
// Live mode: score play songs/example-techno.js --watch
//
// A minor, 125 BPM. Industrial techno: driving bass, lead stabs, offbeat hats.

import { Song, Kick, Snare, HiHat, Synth, Intro, Drop, Breakdown, Outro } from '@score/dsl'

// ── DRUMS ─────────────────────────────────────────────────────────────────────

const kick = Kick({
  pattern: [1, 0, 0, 1,  1, 0, 0, 1,  1, 0, 0, 1,  1, 0, 0, 1],   // four on the floor
  synth: { frequency: 70, pitchDrop: 0.1 },
  volume: 0.25,
})

const snare = Snare({
  pattern: [1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1],
  volume: 0.75,
})

const hihat = HiHat({
  pattern: [1, 1, 0, 0,  1, 1, 0, 0,  1, 1, 0, 0,  1, 1, 0, 0],   // offbeat 8ths
  volume: 0.18,
})

// ── SYNTHESIS ─────────────────────────────────────────────────────────────────
// Note names: 'A2', 'D3', 'E4' etc. Sharp = #  Flat = b  0 = rest.

const bass = Synth({
  wave: 'sine',
  gain: 0.40,
  envelope: { attack: 0.003, decay: 0.10, sustain: 0.5, release: 0.04 },
  filter: { type: 'highpass', frequency: 800, Q: 2.0 },
  pattern: ['G2', 0, 'A2', 0,  0, 'G2', 0, 'D3',  'E3', 0, 'E3', 0,  0, 'G3', 0, 0],
  volume: .75,
})

const lead = Synth({
  wave: 'sawtooth',
  gain: 0.25,
  envelope: { attack: 0.01, decay: 0.06, sustain: 0.3, release: 0.03 },
  pattern: [0, 0, 'E4', 0,  'Eb4', 0, 'B3', 0,  0, 'E4', 0, 'Eb3', 0,  'Bb3', 0, 0],
  effects: [
    Delay({ time: 0.375, feedback: 0.4, mix: 0.3 }),
    Reverb({ decay: 2.0, mix: 0.2 }),
  ],
})

const harpsichord = Synth({
  wave:  'sine',
  gain:  0.15,

  // Harpsichord ADSR — pluck with immediate decay, no sustain
  envelope: {
    attack:  0.001,  // nearly instant — quill snaps the string
    decay:   0.76,   // string rings down over ~350ms
    sustain: 0.5,    // no sustain — string is plucking, not bowing
    release: 0.15,   // damper falls when key released
  },

  // Bandpass filter — captures the nasal, plucked character
  filter: {
    type:      'lowpass',
    frequency: 700,   // center of the harpsichord's characteristic brightness
    Q:         2.0,    // mild resonance — adds slight "twang"
  },

  // Melody — harpsichord range is roughly C2 to C7
  pattern:  ['E4', 0, 'D4', 0,  'C#4', 0, 'B3', 0,  'A3', 0, 'Gb3', 0,  'A3', 0, 0, 0],
})

const chantVoice = Synth({
  wave: 'square',        // pure tone — closest to unadorned vocal resonance
  gain: 4,

  envelope: {
    attack:  1.0,   // slow bloom — voices don't punch, they swell
    decay:   0.25,
    sustain: 1.0,   // held, sustained — chant notes are long
    release: 0.3,    // gentle fade — no abrupt cut-off
  },
 // Bandpass filter — captures the nasal, plucked character
 filter: {
  type:      'highpass',
  frequency: 350,   // center of the harpsichord's characteristic brightness
  Q:         2.0,    // mild resonance — adds slight "twang"
},
  // No filter — the absence of filtering gives it openness/purity
  // (A soft lowpass can warm it if you want more "cathedral" resonance)
})

// ── ARRANGEMENT ───────────────────────────────────────────────────────────────
export default Song({
  bpm: 170,
  key: 'G',
  genre: 'techno',
  tracks: [kick, snare, harpsichord, hihat, bass, lead, chantVoice],
  arrangement: [
    Intro(4,       [kick, bass, harpsichord 
    ]),
    Drop(16,       [kick, snare, hihat, bass, lead]),
    Breakdown(8,   [hihat, bass, bass, chantVoice]),
    Drop(16,       [kick, snare, hihat, bass, lead]),
    Outro(4,       [kick, bass]),
  ],
})
