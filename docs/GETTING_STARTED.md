# Getting Started with Score

Score is an EDM audio framework where music is written as functional JavaScript.
Every note, pattern, effect, and arrangement decision is code — which means
it's diffable, version-controlled, reviewable, and reproducible.

---

## Your first song

Create a file `my-song.js`:

```js
import { Song } from '@score/dsl'
import { Kick, Snare, HiHat, Synth } from '@score/dsl'

// A four-on-the-floor kick
const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.9,
})

// Backbeat snare on 2 and 4
const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
})

// Open 8th-note hi-hat
const hihat = HiHat({
  pattern: [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0],
  volume: 0.6,
})

export default Song({
  bpm: 128,
  tracks: [kick, snare, hihat],
})
```

Play it:

```bash
node score play my-song.js
```

Live reload on save:

```bash
node score play --watch my-song.js
```

---

## Instruments

### Kick
Low-frequency synthesised drum hit. Adjustable pitch, pitch drop, and punch.

```js
const kick = Kick({
  pattern:   [1, 0, 0, 0],  // 1 = hit, 0 = silence
  volume:    0.9,            // 0–1
  synth: {
    frequency:  60,          // Hz — root pitch
    pitchDrop:  0.05,        // 0–1 — how far pitch falls (0.05 = tight, 0.2 = woofy)
    attack:     0.005,       // seconds
    decay:      0.3,         // seconds
  },
})
```

### Snare
Noise + pitched body. White noise layer is always included.

```js
const snare = Snare({
  pattern: [0, 0, 1, 0,  0, 0, 1, 0],
  volume:  0.75,
  synth: {
    frequency: 200,          // body pitch (Hz)
    decay:     0.15,         // seconds
    snappiness: 0.4,         // 0–1 — how much noise vs body
  },
})
```

### HiHat
Metallic noise — open or closed. Closed by default.

```js
const hihat = HiHat({
  pattern: [1, 1, 1, 1],
  open:    false,            // true = open hi-hat (longer decay)
  volume:  0.5,
  synth: {
    decay: 0.04,             // seconds — 0.04 = closed, 0.3 = open
  },
})
```

### Synth
Oscillator-based synthesiser with ADSR and filter.

```js
const bass = Synth({
  wave:    'sawtooth',       // 'sine' | 'square' | 'sawtooth' | 'triangle'
  note:    'A2',             // note name — A2 = 110Hz, F#3, Bb4, C5 etc
  pattern: [1, 0, 1, 0,  1, 0, 0, 1],
  adsr: {
    attack:  0.01,           // seconds
    decay:   0.1,
    sustain: 0.6,            // 0–1 (level, not time)
    release: 0.3,
  },
  filter: {
    type:      'lowpass',    // 'lowpass' | 'highpass' | 'bandpass' | 'notch'
    frequency: 1200,         // Hz cutoff
    resonance: 2,            // Q factor (1 = gentle, 8 = resonant)
  },
  volume: 0.7,
})
```

Wave shapes:
| Wave | Character |
|------|-----------|
| `sine` | Smooth, sub bass, pure tone |
| `triangle` | Soft, flute-like, few harmonics |
| `sawtooth` | Bright, cutting, all harmonics — classic bass/lead |
| `square` | Hollow, buzzy, odd harmonics — classic synth |

### Sample
Play an audio file. Pitch and chop via `rate` and `offset`.

```js
import { Sample } from '@score/dsl'

const rim = Sample({
  path:    './samples/rim.wav',
  pattern: [0, 0, 1, 0],
  volume:  0.8,
  rate:    1.0,              // 1 = original pitch, 2 = octave up, 0.5 = octave down
})
```

---

## Patterns

A pattern is an array of 0s and 1s — or note values, or velocities.
Each position is a **step** (default: 16 steps per bar = 16th notes).

```js
// 16 steps — 4 bars of 4/4 at 16th-note resolution
[1, 0, 0, 0,   1, 0, 0, 0,   1, 0, 0, 0,   1, 0, 0, 0]  // four-on-the-floor kick
[0, 0, 0, 0,   1, 0, 0, 0,   0, 0, 0, 0,   1, 0, 0, 0]  // backbeat snare
[1, 0, 1, 0,   1, 0, 1, 0,   1, 0, 1, 0,   1, 0, 1, 0]  // 8th-note hi-hat
```

### Euclidean rhythms

Distribute N hits evenly across M steps — mathematically optimal spacing.

```js
import { euclidean } from '@score/pattern'

euclidean(3, 8)   // → [1,0,0,1,0,0,1,0]  clave
euclidean(5, 8)   // → [1,0,1,0,1,0,1,1]  bossa nova
euclidean(4, 16)  // → [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]  four-on-the-floor
euclidean(7, 12)  // → [1,0,1,0,1,0,1,0,1,0,1,0]  Arab rhythm
```

With rotation (phase offset):

```js
euclidean(3, 8, 2)  // rotate by 2 steps
```

### Pattern transforms

Import from `@score/pattern`:

```js
import { fast, slow, rev, every, degrade, shift } from '@score/pattern'
```

| Transform | Effect | Example |
|-----------|--------|---------|
| `fast(2, pat)` | Double speed — each value plays twice as fast | 8th → 16th |
| `slow(2, pat)` | Half speed — each value plays twice as long | 16th → 8th |
| `rev(pat)` | Reverse the pattern | `[1,0,0,0]` → `[0,0,0,1]` |
| `shift(n, pat)` | Rotate by N steps | `shift(1, [1,0,0,0])` → `[0,1,0,0]` |
| `degrade(p, pat)` | Randomly drop p fraction of hits | `degrade(0.5, ...)` drops 50% |
| `every(n, fn, pat)` | Apply `fn` every N bars | `every(4, rev, pat)` |

```js
const kick = Kick({
  // every 4 bars, double the speed
  pattern: every(4, fast(2), [1, 0, 0, 0,  1, 0, 0, 0]),
})
```

### Scale and chord patterns

```js
import { scaleNotes, chordNotes } from '@score/pattern'

// 8 notes from A minor starting at A3
scaleNotes('Am', 'A3', 8)
// → ['A3','B3','C4','D4','E4','F4','G4','A4']

// Chord voicings
chordNotes('Am')   // → ['A3','C4','E4']
chordNotes('F')    // → ['F3','A3','C4']
chordNotes('Dm7')  // → ['D3','F3','A3','C4']
```

Use with `Synth` for melodic patterns:

```js
const notes = scaleNotes('Dorian', 'D3', 8)
const melody = Synth({
  wave: 'sawtooth',
  sequence: notes,          // steps through the scale
  pattern:  euclidean(5, 8),
})
```

---

## Notes and Frequencies

Score uses standard note name syntax: `NoteOctave` or `Note#Octave`.

```
C4   D4   E4   F4   G4   A4   B4   C5
C#4  D#4       F#4  G#4  A#4
     Db4       Gb4  Ab4  Bb4
```

Middle A = A4 = 440 Hz. Middle C = C4 = 261.63 Hz.

```js
const sub  = Synth({ note: 'A1', wave: 'sine' })    // 55 Hz sub bass
const bass = Synth({ note: 'A2', wave: 'sawtooth' }) // 110 Hz bass
const lead = Synth({ note: 'A4', wave: 'square' })   // 440 Hz lead
```

---

## Adding effects

Effects attach to any instrument via the `effects` prop:

```js
import { createDelay, createReverb, createDistortion } from '@score/effects'

const lead = Synth({
  note: 'F#3',
  pattern: euclidean(5, 8),
  effects: [
    createDelay(context, { delayTime: 0.375, feedback: 0.4, mix: 0.3 }),
    createReverb(context, { roomSize: 0.6, mix: 0.2 }),
  ],
})
```

Available effects:
`Filter`, `Delay`, `Reverb`, `Compressor`, `EQ`, `Distortion`, `BitCrusher`,
`Chorus`, `Flanger`, `Phaser`, `Limiter`, `StereoWidener`, `NoiseGate`, `Sidechain`

---

## Song structure and arrangement

A song can define sections that control which tracks play when:

```js
export default Song({
  bpm: 128,
  tracks: [kick, snare, hihat, bass, lead],
  arrangement: [
    { sectionType: 'intro',     bars: 8 },   // 8 bars — intro
    { sectionType: 'buildup',   bars: 16 },  // 16 bars — tension
    { sectionType: 'drop',      bars: 32 },  // 32 bars — full energy
    { sectionType: 'breakdown', bars: 16 },  // 16 bars — strip back
    { sectionType: 'outro',     bars: 8 },   // 8 bars — wind down
  ],
})
```

Section types: `'intro'` `'buildup'` `'drop'` `'breakdown'` `'outro'`

---

## Mixer

For multi-channel mixing with effects sends and master bus:

```js
import { createMixer } from '@score/mixer'

const mixer = createMixer(context, {
  channels: [
    { name: 'kick',  volume: 0.9,  pan: 0 },
    { name: 'snare', volume: 0.75, pan: 0 },
    { name: 'hihat', volume: 0.6,  pan: 0.1 },
    { name: 'bass',  volume: 0.8,  pan: 0 },
  ],
  masterVolume: 0.85,
  limiterCeiling: -3,       // dBFS — brick-wall, never exceeded
})

// Solo/mute channels
mixer.getChannel(0).setMute(true)
mixer.getChannel(1).setSolo(true)
```

---

## CLI commands

```bash
# Play a song
node score play my-song.js

# Live reload on save (300ms debounce)
node score play --watch my-song.js

# Skip security validation (developer only)
node score play --trust my-song.js

# Create a new song from template
node score new song my-track

# System health check
node score doctor

# Show version
node score --version
```

---

## What's allowed in song files

```js
// ✅ These always work
import { Kick, Snare, Song } from '@score/dsl'
import { euclidean, every, fast } from '@score/pattern'
import { fibonacci, entropy } from '@score/math'
import { myKit } from './sounds/my-kit.js'   // local relative imports

// ❌ These are blocked (security — AST-checked before execution)
import fs from 'fs'
import { exec } from 'child_process'
eval(...)
new Function(...)
process.exit()
```

---

## Next steps

- **Patterns** — see [PATTERNS.md](./PATTERNS.md) for full pattern reference
- **Instruments** — see [INSTRUMENTS.md](./INSTRUMENTS.md) for all synth parameters
- **Song format** — see [SONG_FORMAT.md](./SONG_FORMAT.md) for Song/Section/Track full spec
- **Harpsichord patch** — see [HARPSICHORD.md](./HARPSICHORD.md) for physical modelling example
- **Gregorian chant** — see [GREGORIAN_CHANT.md](./GREGORIAN_CHANT.md) for modal scale usage
