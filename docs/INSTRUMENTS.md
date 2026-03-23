# Instruments

All instruments are imported from `@score/dsl`. They return descriptors — plain objects the engine hydrates at play time. No AudioContext is created in song files.

```js
import { Kick, Snare, HiHat, Synth, Kick808, Kick909, Snare909, Hihat808, SubSynth, FMSynth, Arp, Sample, Theremin, Sax } from '@score/dsl'
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

---

## Sample

Plays an audio file. Pattern and volume work the same as other instruments.

```js
import { Sample } from '@score/dsl'

const rim = Sample({
  path: './samples/rimshot.wav',
  pattern: [0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0],
  volume: 0.8,
  rate: 1.0,
})
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `path` | `string` | **required** | Relative path to the audio file from the song file's location. Supports `.wav`, `.mp3`, `.ogg`. |
| `pattern` | `number[]` or `(step, bar) => number` | one hit per beat | 16-step rhythm. `1` = play, `0` = rest. |
| `volume` | `number` | `0.8` | Output level 0–1. |
| `rate` | `number` | `1.0` | Playback rate and pitch. `1.0` = original. `2.0` = octave up. `0.5` = octave down. `2 ** (semitones / 12)` for precise tuning. |
| `loop` | `boolean` | `false` | Loop the sample continuously. |
| `effects` | `EffectDescriptor[]` | `[]` | Effects chain — import descriptors from `@score/effects`. |

All props except `path` are optional.

### Path conventions

Paths resolve relative to the song file. The `samples/` directory next to your song file is the convention:

```
my-project/
  my-song.js
  samples/
    kick.wav
    snare.wav
    rimshot.wav
```

The `samples/` directory is gitignored — each user brings their own files. See [SAMPLE.md](SAMPLE.md) for full details.

### Pitch shifting

`rate` shifts pitch proportionally. `2 ** (semitones / 12)` converts semitone offsets to rates:

| Rate | Pitch |
|---|---|
| `0.5` | 1 octave down |
| `1.0` | Original |
| `2.0` | 1 octave up |
| `2 ** (7/12)` | Perfect fifth up (~1.498) |

### Examples

**Rim on the offbeat:**
```js
const rim = Sample({
  path: './samples/rim.wav',
  pattern: [0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0],
  volume: 0.5,
})
```

**Looped vinyl crackle texture:**
```js
import { Sample } from '@score/dsl'

const crackle = Sample({
  path: './samples/vinyl-crackle.wav',
  pattern: [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
  volume: 0.12,
  loop: true,
})
```

**Tuned bass sample — root at A2, shifted to D3 (+5 semitones):**
```js
const bass = Sample({
  path: './samples/bass-a2.wav',
  rate: 2 ** (5 / 12),
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.85,
})
```

See [SAMPLE.md](SAMPLE.md) for the full Sample reference including file formats, the `sounds/` directory convention, and melodic sequencing examples.

---

## Kick808

TR-808-style bass drum. Pure sine body with deep sub pitch fall — the foundation of deep house, trap, and 808-driven styles.

```js
import { Kick808 } from '@score/dsl'

const kick = Kick808({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.8,
  startFreq: 60,
  endFreq: 45,
  pitchFall: 0.15,
  decay: 0.7,
})
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `pattern` | `number[]` | four-on-the-floor | 16-step rhythm. `1` = hit, `0` = rest. |
| `volume` | `number` | `0.85` | Output level 0–1. |
| `startFreq` | `number` | `60` | Initial sine pitch in Hz. |
| `endFreq` | `number` | `45` | Final pitch after fall in Hz. Deep sub. |
| `pitchFall` | `number` | `0.15` | Duration of pitch fall in seconds. |
| `decay` | `number` | `0.7` | Amplitude decay in seconds. Longer than Kick for that 808 sustain. |
| `effects` | `EffectDescriptor[]` | `[]` | Effects chain. |

All props are optional. The 808 decay is noticeably longer than the standard Kick — use it for sub-heavy styles (trap, deep house, afrotech).

---

## Kick909

TR-909-style bass drum. Sine body with transient noise click — the signature of techno, house, and trance.

```js
import { Kick909 } from '@score/dsl'

const kick = Kick909({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.9,
  clickLevel: 0.25,
  clickDecay: 0.03,
})
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `pattern` | `number[]` | four-on-the-floor | 16-step rhythm. |
| `volume` | `number` | `0.85` | Output level 0–1. |
| `startFreq` | `number` | `65` | Initial sine pitch in Hz. |
| `endFreq` | `number` | `48` | Final pitch after fall in Hz. |
| `pitchFall` | `number` | `0.12` | Duration of pitch fall in seconds. |
| `decay` | `number` | `0.65` | Sine body decay in seconds. |
| `clickLevel` | `number` | `0.25` | Noise click level relative to body (0–1). ≈ −12 dBFS. |
| `clickDecay` | `number` | `0.03` | Noise click decay in seconds. Shorter = snappier attack. |
| `effects` | `EffectDescriptor[]` | `[]` | Effects chain. |

**808 vs 909:** Use `Kick808` for sub-heavy, sustained kicks (trap, deep house). Use `Kick909` for punchier, click-forward kicks (techno, house, trance).

---

## Snare909

TR-909-style snare. Pitched triangle tone layer plus white noise body — classic crisp techno snare.

```js
import { Snare909 } from '@score/dsl'

const snare = Snare909({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.7,
  toneNoiseRatio: 0.35,
})
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `pattern` | `number[]` | beats 2 and 4 | 16-step rhythm. |
| `volume` | `number` | `0.6` | Output level 0–1. |
| `toneDecay` | `number` | `0.2` | Triangle oscillator decay in seconds. |
| `noiseDecay` | `number` | `0.3` | Noise body decay in seconds. |
| `toneNoiseRatio` | `number` | `0.4` | Balance between tone and noise (0 = all noise, 1 = all tone). |
| `effects` | `EffectDescriptor[]` | `[]` | Effects chain. |

Lower `toneNoiseRatio` (0.2–0.3) = snappier, noise-dominant snare. Higher (0.5–0.6) = more tonal, rimshot character.

---

## Hihat808

TR-808-style hi-hat. Six-oscillator metallic noise source with bandpass filtering — the tight, characteristic 808 hat.

```js
import { Hihat808 } from '@score/dsl'

const hihat = Hihat808({
  pattern: [1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1],
  volume: 0.3,
  open: false,
})
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `pattern` | `number[]` | straight 16ths | 16-step rhythm. |
| `volume` | `number` | `0.3` | Output level 0–1. |
| `decay` | `number` | `0.06` (closed) / `0.3` (open) | Amplitude decay in seconds. |
| `open` | `boolean` | `false` | `true` = open hi-hat (longer sustain, `0.3s` decay). |
| `effects` | `EffectDescriptor[]` | `[]` | Effects chain. |

Mix closed (`open: false`) and open (`open: true`) variants across two tracks to build classic 808 drum machine patterns.

---

## SubSynth

Full Juno-60 / Minimoog model subtractive synthesizer. Unison oscillators, filter envelope, and ADSR amp envelope. For acid lines, Reese bass, detuned pads, and analog leads.

```js
import { SubSynth } from '@score/dsl'
import { Reverb } from '@score/effects'

const lead = SubSynth({
  wave: 'sawtooth',
  frequency: 220,
  unison: 2,
  detune: 12,
  filter: {
    type: 'lowpass',
    frequency: 600,
    Q: 3.5,
    envDepth: 1200,
    adsr: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.1 },
  },
  adsr: { attack: 0.008, decay: 0.15, sustain: 0.6, release: 0.08 },
  pattern: ['A2', 0, 'A2', 0,  0, 'D3', 0, 'E3'],
  volume: 0.5,
  effects: [Reverb({ decay: 1.0, mix: 0.18 })],
})
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `pattern` | `(number\|string)[]` | — | Step pattern. Note names (`'A2'`) or Hz values. `0` = rest. |
| `volume` | `number` | `0.5` | Output level 0–1. |
| `wave` | `'sine'` \| `'square'` \| `'sawtooth'` \| `'triangle'` | `'sawtooth'` | Oscillator waveform. |
| `frequency` | `number` | `220` | Base pitch in Hz when pattern values are `1`. |
| `detune` | `number` | `8` | Total detune spread between oscillator pairs in cents. |
| `unison` | `1` \| `2` \| `4` | `1` | Oscillator pairs: `1` = 2 oscs, `2` = 4, `4` = 8. More pairs = thicker. |
| `filter.type` | `'lowpass'` \| `'highpass'` \| `'bandpass'` | `'lowpass'` | Filter shape. |
| `filter.frequency` | `number` | `2000` | Filter cutoff in Hz. |
| `filter.Q` | `number` | `1` | Resonance. |
| `filter.envDepth` | `number` | `800` | How far the filter envelope opens the cutoff (Hz). |
| `filter.adsr` | `AdsrProps` | — | Filter envelope — controls cutoff over time. |
| `adsr` | `AdsrProps` | defaults | Amplitude envelope — controls volume over time. |
| `effects` | `EffectDescriptor[]` | `[]` | Effects chain. |

### Unison and detune

`unison` + `detune` together control the chorus thickness:
- `unison: 1, detune: 8` — subtle, slightly warm
- `unison: 2, detune: 12` — classic Juno-style doubling
- `unison: 4, detune: 20` — supersaw-adjacent, very thick

### Filter envelope

`filter.envDepth` sets how much the filter opens from `filter.frequency` when the filter ADSR hits. With `frequency: 300, envDepth: 1200`, the cutoff sweeps from 300 Hz to 1500 Hz over the filter attack.

---

## FMSynth

2-operator FM synthesizer. Carrier oscillator modulated by a modulator oscillator with independent envelopes. Covers DX7 Rhodes-style tones, electric piano, metallic leads, and bell sounds.

```js
import { FMSynth } from '@score/dsl'
import { Reverb } from '@score/effects'

const rhodes = FMSynth({
  frequency: 261.63,
  modRatio: 1.0,
  modIndex: 2.5,
  ampAdsr:  { attack: 0.005, decay: 0.4,  sustain: 0.3, release: 0.25 },
  modAdsr:  { attack: 0.001, decay: 0.2,  sustain: 0.0, release: 0.1  },
  gain: 0.35,
  pattern: ['C4', 0, 0, 0,  'E4', 0, 0, 0,  'G4', 0, 0, 0,  'C5', 0, 0, 0],
  volume: 0.6,
  effects: [Reverb({ decay: 1.8, mix: 0.25 })],
})
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `pattern` | `(number\|string)[]` | — | Step pattern. Note names or Hz values. `0` = rest. |
| `volume` | `number` | `0.6` | Output level 0–1. |
| `frequency` | `number` | `440` | Carrier base frequency in Hz. |
| `modRatio` | `number` | `1.0` | Modulator-to-carrier frequency ratio. `1.0` = same pitch (harmonic). `2.0` = octave above. |
| `modIndex` | `number` | `3.0` | Modulation index — how much the modulator affects the carrier. `0` = pure sine. `1–5` = Rhodes/DX7 range. `8+` = metallic/inharmonic. |
| `ampAdsr` | `AdsrProps` | defaults | Amplitude envelope on the carrier output. |
| `modAdsr` | `AdsrProps` | defaults | Envelope on the modulation depth. Controls timbre evolution over time. |
| `gain` | `number` | `0.3` | Peak gain 0–1. |
| `effects` | `EffectDescriptor[]` | `[]` | Effects chain. |

### FM timbres

The combination of `modRatio` and `modIndex` determines the timbre:

| Sound | modRatio | modIndex | Character |
|---|---|---|---|
| Rhodes / electric piano | `1.0` | `2–3` | Warm, slightly glassy |
| Bell / tine | `3.0` | `1.5` | Metallic, inharmonic partials |
| Brass / organ | `1.0` | `5–8` | Bright, complex |
| Techno lead | `2.0` | `6–10` | Aggressive, industrial |
| Sub bass | `0.5` | `1` | Deep sine with weight |

### Modulator envelope

`modAdsr` controls how the timbral brightness evolves. A fast-decaying modulator envelope gives the DX7 pluck character: bright attack, darkening sustain:

```js
// Classic DX7 "E. Piano 1" timbral envelope
modAdsr: { attack: 0.001, decay: 0.3, sustain: 0.0, release: 0.15 }
```
