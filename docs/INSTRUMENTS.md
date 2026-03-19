# Instruments

All instruments are imported from `@score/dsl`. They return descriptors — plain objects the engine hydrates at play time. No AudioContext is created in song files.

```js
import { Kick, Snare, HiHat, Synth } from '@score/dsl'
```

---

## Kick

Synthesized bass drum. Pitched sine with pitch drop envelope.

```js
const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.9,
  synth: { frequency: 75, pitchDrop: 0.09 },
})
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `pattern` | `number[]` or `(step, bar) => number` | four-on-floor | 16-step rhythm. `1` = hit, `0` = rest. |
| `volume` | `number` | `0.85` | Output level 0–1. |
| `synth.frequency` | `number` | `80` | Starting pitch in Hz. |
| `synth.pitchDrop` | `number` | `0.1` | How fast the pitch falls (seconds). |
| `effects` | `EffectDescriptor[]` | `[]` | Effects chain — use descriptor factories from `@score/effects`. |

All props are optional.

---

## Snare

Synthesized snare drum. Noise body with pitched transient.

```js
const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.6,
})
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `pattern` | `number[]` or `(step, bar) => number` | beats 2 and 4 | 16-step rhythm. |
| `volume` | `number` | `0.5` | Output level 0–1. |
| `effects` | `EffectDescriptor[]` | `[]` | Effects chain. |

All props are optional.

---

## HiHat

Synthesized hi-hat. Open and closed variants via filtered noise.

```js
const hihat = HiHat({
  pattern: [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0],
  volume: 0.25,
  open: false,
})
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `pattern` | `number[]` or `(step, bar) => number` | straight 8ths | 16-step rhythm. |
| `volume` | `number` | `0.25` | Output level 0–1. |
| `open` | `boolean` | `false` | `true` = open hi-hat (longer sustain). |
| `effects` | `EffectDescriptor[]` | `[]` | Effects chain. |

All props are optional.

---

## Synth

Subtractive synthesizer with ADSR envelope and optional filter.

```js
const bass = Synth({
  wave: 'sawtooth',
  gain: 0.3,
  envelope: {
    attack: 0.005,
    decay: 0.1,
    sustain: 0.6,
    release: 0.05,
  },
  filter: {
    type: 'lowpass',
    frequency: 900,
    Q: 1.2,
  },
  pattern: ['A2', 0, 'A2', 0,  0, 'A2', 0, 'D3',  'E3', 0, 'E3', 0,  0, 'A3', 0, 0],
})
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `wave` | `'sine'` \| `'square'` \| `'sawtooth'` \| `'triangle'` | `'sawtooth'` | Oscillator waveform. |
| `frequency` | `number` | `440` | Base frequency in Hz when pattern values are `1`. |
| `gain` | `number` | `0.25` | Output level 0–1. |
| `pattern` | `(number\|string)[]` or `(step, bar) => string\|number` | — | Note names or Hz values. `0` = rest. |
| `sequence` | `string[]` | — | Pre-parsed note array (output of `Sequence()`). |
| `envelope.attack` | `number` | `0.005` | Seconds from silence to peak. Short = punchy, long = pad swell. |
| `envelope.decay` | `number` | `0.08` | Seconds from peak to sustain level. |
| `envelope.sustain` | `number` | `0.7` | Level held while note is active (0–1). |
| `envelope.release` | `number` | `0.05` | Seconds to silence after note ends. |
| `filter.type` | `'lowpass'` \| `'highpass'` \| `'bandpass'` | — | Filter shape. Omit to bypass filter. |
| `filter.frequency` | `number` | `2000` | Filter cutoff in Hz. |
| `filter.Q` | `number` | `1` | Resonance. Higher = more pronounced peak at cutoff. |
| `effects` | `EffectDescriptor[]` | `[]` | Effects chain. |

### Wave shapes

| Wave | Character | Use for |
|---|---|---|
| `sine` | Pure, no harmonics | Sub-bass, soft pads |
| `triangle` | Soft, few harmonics | Warm leads, mellow pads |
| `square` | Hollow, odd harmonics | Bass, retro leads |
| `sawtooth` | Bright, all harmonics | Acid bass, leads, strings |

### ADSR diagram

```
Volume
  1.0 │    /\
      │   /  \
sus   │  /    \____________________
      │ /                          \
  0.0 │/                            \___
      └──────────────────────────────────▶ Time
           A    D        S             R
```

- **A (attack)**: time from note-on to peak volume
- **D (decay)**: time from peak down to sustain level
- **S (sustain)**: level held until note-off
- **R (release)**: time from note-off to silence

### Envelope presets

| Sound | attack | decay | sustain | release |
|---|---|---|---|---|
| Punchy bass | `0.002` | `0.05` | `0.5` | `0.03` |
| Pad / string | `0.4` | `0.1` | `0.8` | `0.6` |
| Pluck | `0.001` | `0.15` | `0.0` | `0.08` |
| Organ | `0.005` | `0.0` | `1.0` | `0.01` |
| Brass hit | `0.01` | `0.1` | `0.7` | `0.2` |

### Note name format

Format: **letter** + optional **`#`** (sharp) or **`b`** (flat) + **octave number**.

| Note | Frequency | Description |
|---|---|---|
| `'C4'` | 261.63 Hz | Middle C |
| `'A4'` | 440 Hz | Concert A |
| `'A2'` | 110 Hz | Deep bass |
| `'F#3'` | 185 Hz | F sharp octave 3 |
| `'Bb4'` | 466 Hz | B flat octave 4 |

Typical ranges:
- Sub-bass: `A1`–`A2`
- Bass: `A2`–`A3`
- Mid: `A3`–`A4`
- Lead: `A4`–`A5`

### Effects on instruments

```js
import { Synth } from '@score/dsl'
import { Delay, Reverb, Distortion } from '@score/effects'

const lead = Synth({
  wave: 'sawtooth',
  gain: 0.2,
  pattern: ['E4', 0, 'D4', 0,  'C4', 0, 'A3', 0],
  effects: [
    Distortion({ amount: 0.3 }),
    Delay({ time: 0.375, feedback: 0.35, mix: 0.25 }),
    Reverb({ decay: 1.5, mix: 0.15 }),
  ],
})
```

Effect descriptors are pure data — no AudioContext in song files. The engine hydrates them at play time. See [EFFECTS.md](EFFECTS.md) for all available effects.

### Using Sequence()

`Sequence()` parses a space-separated string of note names and rests into an array. `.` = rest.

```js
import { Synth, Sequence } from '@score/dsl'

const lead = Synth({
  wave: 'sawtooth',
  gain: 0.2,
  sequence: Sequence('A2 . D3 . F3 . E3 .'),
})
```
