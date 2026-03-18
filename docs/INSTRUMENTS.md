# Score Instruments — DSL Reference

All instruments are factory functions that return an `InstrumentDescriptor`.
They accept a props object and are passed directly to `Song({ tracks: [...] })`.

No audio context required — the engine hydrates descriptors at play time.

---

## Kick

A synthesized kick drum. Uses an oscillator with pitch drop and a noise burst for the transient.

```js
import { Kick } from '@score/dsl'

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],  // four-on-the-floor
  volume:  0.9,
  synth: {
    frequency: 60,      // Hz — starting pitch of the pitch drop (default: 60)
    pitchDrop: 0.04,    // seconds — how long the pitch drops over (default: 0.04)
  },
})
```

### Pattern values

`1` = hit, `0` = silence. 16 steps = one bar at 16th-note resolution.

| Pattern | Sound | Usage |
|---------|-------|-------|
| `[1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]` | Four on the floor | House, techno |
| `[1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0]` | Half time | Trap, hip-hop |
| `[1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0]` | Push on the 3 | Funk |

### Using euclidean patterns

```js
import { euclidean } from '@score/pattern'

const kick = Kick({ pattern: euclidean(4, 16) })  // [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]
const kick = Kick({ pattern: euclidean(3, 8) })   // [1,0,0,1,0,0,1,0] — classic clave
```

---

## Snare

A synthesized snare with white noise body.

```js
import { Snare } from '@score/dsl'

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],  // backbeat (2 and 4)
  volume:  0.7,
})
```

| Pattern | Sound | Usage |
|---------|-------|-------|
| `[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]` | Backbeat (2 and 4) | Almost everything |
| `[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0]` | Off-beat snare | Reggae, dancehall |
| `[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]` | Every beat | Punk, metal |

---

## HiHat

Synthesized hi-hat using filtered noise.

```js
import { HiHat } from '@score/dsl'

const hihat = HiHat({
  pattern: [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0],  // straight 8ths
  volume:  0.5,
  open:    false,    // true = open hi-hat (longer decay), false = closed (short)
})
```

| `open` | Sound | Usage |
|--------|-------|-------|
| `false` | Tight, closed | 16th-note grooves, busy patterns |
| `true` | Washy, sustained | Off-beats, buildups |

---

## Synth

A subtractive synthesizer. One note plays per step of the pattern.
Supports note names (`'A2'`, `'F#3'`, `'Bb4'`) or raw Hz values.

```js
import { Synth } from '@score/dsl'

const bass = Synth({
  wave:      'sawtooth',    // 'sine' | 'square' | 'sawtooth' | 'triangle'
  frequency: 110,           // default frequency when pattern values are 1/0
  gain:      0.3,

  // Pattern: each non-zero value triggers a note
  pattern: ['A2', 0, 0, 0,  'D3', 0, 0, 0,  'F3', 0, 0, 0,  'E3', 0, 0, 0],

  envelope: {
    attack:  0.005,   // seconds — time to reach peak volume (default: 0.005)
    decay:   0.08,    // seconds — time from peak to sustain level (default: 0.08)
    sustain: 0.7,     // 0-1 — level to hold at during note (default: 0.7)
    release: 0.05,    // seconds — time to fade to silence after note ends (default: 0.05)
  },

  filter: {
    type:      'lowpass',   // 'lowpass' | 'highpass' | 'bandpass'
    frequency: 800,          // Hz cutoff
    Q:         1,            // resonance (1 = neutral, higher = more resonance)
  },
})
```

### Wave shapes and their character

| Wave | Sound | Real-world analogue | Usage |
|------|-------|---------------------|-------|
| `'sawtooth'` | Bright, buzzy, rich harmonics | Strings, brass, classic synth bass | Bass lines, leads |
| `'square'` | Hollow, reedy, strong odd harmonics | Clarinets, NES, chiptune | Arps, retro leads |
| `'sine'` | Pure, soft, no harmonics | Flute, sine-wave bass | Sub bass, soft pads |
| `'triangle'` | Soft, flute-like, few harmonics | Flute, gentle pluck | Gentle melodies, soft leads |

### Note names

Score accepts standard music notation. The format is: **letter + optional accidental + octave number**.

| Note | Frequency | Description |
|------|-----------|-------------|
| `'C4'` | 261.63 Hz | Middle C |
| `'A4'` | 440 Hz | Concert A (tuning reference) |
| `'A2'` | 110 Hz | Deep bass A |
| `'F#3'` | 185.00 Hz | F sharp, octave 3 |
| `'Bb4'` | 466.16 Hz | B flat, octave 4 |

**Octave numbers:** Each octave spans C to B. `C4` = middle C. Lower numbers = lower pitch.

- `'#'` = sharp (raises by one semitone) — type a regular hash key
- `'b'` = flat (lowers by one semitone) — type a regular letter b

```js
// Sub bass line in A minor
pattern: ['A1', 0, 0, 0,  'A1', 0, 0, 0,  'F1', 0, 0, 0,  'G1', 0, 0, 0]

// Mid bass melody
pattern: ['A2', 0, 'C3', 0,  'E3', 0, 'G2', 0]

// Lead melody
pattern: ['E4', 0, 'D4', 0,  'C4', 0, 'A3', 0]
```

### ADSR envelope — what each stage does

```
Volume
  |         peak
  |        /    \
  |       /  D   \
  |      /        \ S (sustain level)
  |  A  /          \___________
  |    /                       \   R
  |   /                         \
  |__/                           \___
  0                               time
       Attack  Decay     Hold    Release
```

- **Attack** — how quickly the note reaches full volume. Short = punchy. Long = pad-like.
- **Decay** — how quickly it falls from peak to sustain. Short = plucky. Long = slow bloom.
- **Sustain** — the level it holds at while the note is playing (0 = silent, 1 = full volume).
- **Release** — how quickly it fades after the note ends. Short = staccato. Long = reverb-like tail.

### Envelope presets by instrument type

| Sound | attack | decay | sustain | release |
|-------|--------|-------|---------|---------|
| Punchy bass | 0.002 | 0.05 | 0.5 | 0.03 |
| Pad / string | 0.4 | 0.1 | 0.8 | 0.6 |
| Pluck | 0.001 | 0.15 | 0.0 | 0.08 |
| Organ | 0.005 | 0.0 | 1.0 | 0.01 |
| Brass hit | 0.01 | 0.1 | 0.7 | 0.2 |

### Filter — shape the brightness

- **lowpass** — removes high frequencies. Lower cutoff = darker/warmer. Used on bass.
- **highpass** — removes low frequencies. Higher cutoff = thinner/airier. Used on pads, hi-hats.
- **bandpass** — passes only a narrow frequency band. Nasal, telephone-like character.
- **Q** — resonance. Values > 2 add a ringing peak at the cutoff frequency.

---

## Arrangement (Song sections)

Sections let you specify which tracks play during each part of the song.

```js
import { Song, Intro, Drop, Breakdown, Outro } from '@score/dsl'

export default Song({
  bpm: 128,
  tracks: [kick, snare, hihat, bass, pad],

  arrangement: [
    Intro({ bars: 8,  tracks: [hihat] }),
    Drop({ bars: 32,  tracks: [kick, snare, hihat, bass, pad] }),
    Breakdown({ bars: 16, tracks: [pad, bass] }),
    Drop({ bars: 32,  tracks: [kick, snare, hihat, bass, pad] }),
    Outro({ bars: 8,  tracks: [hihat, pad] }),
  ],
})
```

### Section types

| Section | `sectionType` | Typical use |
|---------|--------------|-------------|
| `Intro()` | `'intro'` | Opening build — sparse arrangement |
| `Buildup()` | `'buildup'` | Energy rise before drop |
| `Drop()` | `'drop'` | Full arrangement, peak energy |
| `Breakdown()` | `'breakdown'` | Strip back — emotional pause |
| `Outro()` | `'outro'` | Fade or strip out |

Each section plays the listed tracks for the specified number of bars, then moves to the next.
