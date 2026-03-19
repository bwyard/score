# Effects

All effects are imported from `@score/effects`. They are descriptor factories — they return plain data objects. No AudioContext is created in song files. The engine hydrates descriptors at play time.

```js
import { Delay, Reverb, Filter, Distortion, EQ, Compressor, Limiter, BitCrusher, Chorus, Phaser, Flanger, StereoWidener, Gate } from '@score/effects'
```

Attach effects to any instrument via its `effects` prop:

```js
const bass = Synth({
  wave: 'sawtooth',
  gain: 0.3,
  pattern: ['A2', 0, 'A2', 0,  'D3', 0, 'E3', 0],
  effects: [
    Delay({ time: 0.375, feedback: 0.4, mix: 0.3 }),
    Reverb({ decay: 2.0, mix: 0.2 }),
  ],
})
```

Effects process in array order — left to right, top to bottom. The output of each effect feeds the input of the next.

---

## Delay

Repeats the signal after a fixed time. Creates echoes, rhythmic doubling, and spatial depth.

### Props

| Prop | Type | Default | Range | Description |
|---|---|---|---|---|
| `time` | `number` | `0.25` | `0–5` | Delay time in seconds. `0.25` = quarter note at 60 BPM. `0.375` = dotted-eighth at 80 BPM. |
| `feedback` | `number` | `0.3` | `0–0.95` | How much of the wet signal feeds back into the delay. Higher = longer decaying echo tail. Keep below `0.9` for stability. |
| `mix` | `number` | `0.5` | `0–1` | Dry/wet blend. `0` = dry only, `1` = wet only. Most uses stay between `0.2–0.5`. |

### Examples

**Tight rhythmic doubling** — eighth-note echo, subtle mix, fast decay:
```js
Delay({ time: 0.1875, feedback: 0.15, mix: 0.25 })
```

**Ping-pong ambient tail** — dotted-eighth sync, long feedback, moderate mix:
```js
Delay({ time: 0.375, feedback: 0.65, mix: 0.4 })
```

### Signal routing note

Delay sits best before Reverb in the chain. Delaying into reverb creates natural-sounding echo spaces. Reversing the order (reverb into delay) produces a smeared, washed-out character.

---

## Reverb

Simulates acoustic space by convolving the signal with a room impulse. Adds depth, dimension, and glue.

### Props

| Prop | Type | Default | Range | Description |
|---|---|---|---|---|
| `decay` | `number` | `2.0` | `0.1–30` | Reverb tail length in seconds. `0.5` = small room. `2.0` = medium hall. `8.0+` = cathedral or plate. |
| `mix` | `number` | `0.3` | `0–1` | Dry/wet blend. Drums typically `0.1–0.2`. Pads `0.3–0.6`. |

### Examples

**Tight room** — short decay, low mix, keeps transients punchy:
```js
Reverb({ decay: 0.5, mix: 0.12 })
```

**Large hall** — long tail, higher mix, for atmospheric pads:
```js
Reverb({ decay: 6.0, mix: 0.45 })
```

### Signal routing note

Place Reverb last in the effects chain (or second-to-last before Limiter). Reverb after Distortion smears the distorted harmonics into unpleasant mud; Reverb before Distortion can work for lo-fi texture.

---

## Filter

A biquad filter for frequency shaping. Use to sculpt tone, add resonance, or cut unwanted frequencies.

### Props

| Prop | Type | Default | Range | Description |
|---|---|---|---|---|
| `type` | `string` | `'lowpass'` | `'lowpass'` \| `'highpass'` \| `'bandpass'` \| `'notch'` | Filter shape. See table below. |
| `frequency` | `number` | `1000` | `20–20000` | Cutoff frequency in Hz. |
| `Q` | `number` | `1.0` | `0.001–1000` | Resonance. At low values, smooth roll-off. Higher values create a peak at the cutoff frequency. Above `10` the resonance becomes audible as a tone. |
| `gain` | `number` | `0` | any dB | Only used by `peaking` and shelf filter types. No effect on `lowpass`, `highpass`, `bandpass`, or `notch`. |

### Filter types

| Type | What it does |
|---|---|
| `lowpass` | Passes frequencies below cutoff. Rolls off highs. Most common for bass tone-shaping. |
| `highpass` | Passes frequencies above cutoff. Rolls off lows. Use to thin out bass mud or isolate tops. |
| `bandpass` | Passes a band around cutoff, attenuates above and below. |
| `notch` | Attenuates a narrow band at cutoff. Use to remove specific resonances. |

### Examples

**Low-pass sub carve** — removes mud below 120 Hz from bass instruments:
```js
Filter({ type: 'highpass', frequency: 80, Q: 0.7 })
```

**Resonant acid sweep** — classic TB-303 character, high Q at cutoff:
```js
Filter({ type: 'lowpass', frequency: 400, Q: 12.0 })
```

---

## Compressor

Reduces the dynamic range of the signal. Attenuates peaks that exceed the threshold, bringing up the overall level and gluing elements together.

### Props

| Prop | Type | Default | Range | Description |
|---|---|---|---|---|
| `threshold` | `number` | `-24` | `-100–0` dBFS | Level in dBFS where compression begins. Signals below this are unaffected. |
| `ratio` | `number` | `4` | `1–20` | Compression ratio (N:1). `4` = for every 4 dB over threshold, output increases 1 dB. `20` = near brick-wall. |
| `attack` | `number` | `0.003` | `0–1` | Seconds before compression engages after threshold is crossed. Fast attack catches transients; slow attack lets them through. |
| `release` | `number` | `0.25` | `0–1` | Seconds for gain to recover after signal drops below threshold. |
| `knee` | `number` | `10` | `0–40` dB | Width of the soft-knee transition zone around the threshold. `0` = hard knee (abrupt). Higher = smooth gradual onset. |

### Examples

**Drum bus glue** — moderate ratio, fast attack/release, soft knee:
```js
Compressor({ threshold: -18, ratio: 4, attack: 0.005, release: 0.1, knee: 6 })
```

**Heavy limiting compression** — high ratio, tight knee, catches peaks hard:
```js
Compressor({ threshold: -12, ratio: 16, attack: 0.001, release: 0.05, knee: 2 })
```

### Signal routing note

Compressor before EQ shapes dynamics first, then tone. Compressor after EQ applies dynamics to the already-toned signal. Both are valid — use whichever gives the result you want.

---

## EQ

Three-band equalizer: low shelf, mid peak, high shelf. Use for tone shaping and frequency balance.

### Props

| Prop | Type | Default | Range | Description |
|---|---|---|---|---|
| `low` | `number` | `0` | `-40–40` dB | Low shelf gain in dB. Positive boosts lows; negative cuts. |
| `mid` | `number` | `0` | `-40–40` dB | Peaking mid gain in dB. |
| `high` | `number` | `0` | `-40–40` dB | High shelf gain in dB. |
| `lowFreq` | `number` | `250` | `20–500` Hz | Low shelf transition frequency. |
| `midFreq` | `number` | `1000` | `200–8000` Hz | Mid peak center frequency. |
| `highFreq` | `number` | `4000` | `2000–20000` Hz | High shelf transition frequency. |

### Examples

**Warm bass boost** — lift lows, cut harsh mids, add air:
```js
EQ({ low: 4, mid: -2, high: 2, lowFreq: 120, midFreq: 800, highFreq: 8000 })
```

**Presence cut** — scoop harsh upper-mids for smooth leads:
```js
EQ({ low: 0, mid: -5, high: 1, midFreq: 3000, highFreq: 10000 })
```

---

## Distortion

Applies nonlinear waveshaping to the signal. Adds harmonics and grit.

### Props

| Prop | Type | Default | Range | Description |
|---|---|---|---|---|
| `amount` | `number` | `0.5` | `0–1` | Distortion intensity. `0.1` = subtle saturation. `0.5` = moderate crunch. `0.8+` = heavy clip. |
| `mode` | `string` | `'soft'` | `'soft'` \| `'hard'` \| `'foldback'` | Waveshaping algorithm. See table below. |

### Distortion modes

| Mode | Character | Use for |
|---|---|---|
| `soft` | Smooth harmonic saturation. Even harmonics predominant. | Bass warmth, analog tape character. |
| `hard` | Abrupt clipping. Odd harmonics, more aggressive. | Industrial textures, harsh leads. |
| `foldback` | Signal folds back when it exceeds the ceiling. Chaotic at high amounts. | Metallic, sci-fi, experimental sound design. |

### Examples

**Tape saturation** — subtle soft clip for analog warmth:
```js
Distortion({ amount: 0.15, mode: 'soft' })
```

**Reese bass grit** — moderate hard clip on a sawtooth bass:
```js
Distortion({ amount: 0.55, mode: 'hard' })
```

---

## Limiter

A brick-wall limiter. No signal ever exceeds the ceiling. Place at the end of mastering chains to prevent clipping.

### Props

| Prop | Type | Default | Range | Description |
|---|---|---|---|---|
| `ceiling` | `number` | `-0.3` | `-40–0` dBFS | Maximum output level. The signal will never exceed this value. `-0.3` leaves headroom for codec encoding. |
| `release` | `number` | `0.05` | `0–1` | Seconds for gain to recover after limiting. Shorter = snappier. Longer = smoother. |
| `lookahead` | `number` | `0.005` | `0–0.1` | Seconds of lookahead. Allows the limiter to anticipate peaks and reduce distortion. |

### Examples

**Mastering limiter** — transparent ceiling with short lookahead:
```js
Limiter({ ceiling: -0.3, release: 0.05, lookahead: 0.005 })
```

**Hard clip protection** — tighter ceiling, faster release:
```js
Limiter({ ceiling: -1.0, release: 0.02, lookahead: 0.003 })
```

### Signal routing note

Always place Limiter last in any chain where it appears. Its purpose is final output protection — nothing should process after it.

---

## BitCrusher

Reduces bit depth and sample rate to create digital degradation. Classic lo-fi texture.

### Props

| Prop | Type | Default | Range | Description |
|---|---|---|---|---|
| `bitDepth` | `number` | `8` | `1–16` | Bit depth of the output. `16` = CD quality (no effect). `8` = classic 8-bit. `4` = extreme crunch. `1` = 1-bit comparator. |
| `sampleRate` | `number` | `0.5` | `0–1` | Normalized sample rate reduction. `1.0` = original sample rate (no effect). `0.5` = half rate. `0.1` = extreme decimation. |

### Examples

**Classic 8-bit** — bit depth crunch, moderate sample rate reduction:
```js
BitCrusher({ bitDepth: 8, sampleRate: 0.5 })
```

**Extreme decimation** — 4-bit depth, severe sample rate reduction:
```js
BitCrusher({ bitDepth: 4, sampleRate: 0.15 })
```

---

## Chorus

Modulates a short delayed copy of the signal with an LFO and mixes it back. Creates thickness and shimmer.

### Props

| Prop | Type | Default | Range | Description |
|---|---|---|---|---|
| `rate` | `number` | `1.5` | `0.01–20` Hz | LFO rate in Hz. How fast the pitch modulates. Below `0.5` Hz = slow, lush. `2–4` Hz = obvious shimmer. |
| `depth` | `number` | `0.5` | `0–1` | Modulation depth. How far the pitch deviates. Low = subtle detuning. High = wide warble. |
| `mix` | `number` | `0.5` | `0–1` | Dry/wet blend. |

### Examples

**Lush pad doubling** — slow rate, moderate depth:
```js
Chorus({ rate: 0.3, depth: 0.6, mix: 0.4 })
```

**Tight vocal-style shimmer** — faster rate, low depth, subtle mix:
```js
Chorus({ rate: 2.5, depth: 0.25, mix: 0.3 })
```

---

## Phaser

An allpass filter bank swept by an LFO. Creates a sweeping, organic, whooshing movement.

### Props

| Prop | Type | Default | Range | Description |
|---|---|---|---|---|
| `rate` | `number` | `1.0` | `0.01–20` Hz | LFO rate in Hz. |
| `depth` | `number` | `0.5` | `0–1` | Modulation depth. |
| `stages` | `number` | `4` | `2–12` | Number of allpass filter stages. More stages = more pronounced notches and a richer sweep. |
| `mix` | `number` | `0.5` | `0–1` | Dry/wet blend. |

### Examples

**Classic 4-stage sweep** — moderate rate, standard stages:
```js
Phaser({ rate: 0.8, depth: 0.6, stages: 4, mix: 0.5 })
```

**Deep 8-stage sweep** — slow, hypnotic, rich notching:
```js
Phaser({ rate: 0.2, depth: 0.9, stages: 8, mix: 0.6 })
```

---

## Flanger

Short modulated delay mixed with dry signal. Creates jet-plane sweeps, comb filtering, and metallic shimmer.

### Props

| Prop | Type | Default | Range | Description |
|---|---|---|---|---|
| `rate` | `number` | `0.5` | `0.01–20` Hz | LFO rate in Hz. |
| `depth` | `number` | `0.5` | `0–1` | Modulation depth. |
| `feedback` | `number` | `0.7` | `0–0.95` | How much of the wet signal recirculates. Higher = more intense comb filtering. |
| `mix` | `number` | `0.5` | `0–1` | Dry/wet blend. |

### Examples

**Subtle jet sweep** — slow rate, moderate feedback:
```js
Flanger({ rate: 0.3, depth: 0.4, feedback: 0.5, mix: 0.4 })
```

**Intense metallic flange** — fast rate, high feedback:
```js
Flanger({ rate: 2.0, depth: 0.8, feedback: 0.85, mix: 0.6 })
```

---

## StereoWidener

Mid-side processing to expand or collapse the stereo image.

### Props

| Prop | Type | Default | Range | Description |
|---|---|---|---|---|
| `width` | `number` | `0.5` | `0–1` | `0` = fully mono. `0.5` = natural stereo. `1` = maximum width. Values above `0.7` may cause phase issues on mono playback systems — check in mono. |

### Examples

**Subtle widening** — adds space without phase risk:
```js
StereoWidener({ width: 0.6 })
```

**Maximum width** — for pads and atmospheric layers:
```js
StereoWidener({ width: 1.0 })
```

### Signal routing note

Keep low-frequency instruments (kick, bass) in mono — do not apply StereoWidener to them, or use it at very low values (`0.1` or less). Wide bass causes phase cancellation on mono speakers.

---

## Gate

Noise gate. Silences the signal when its level drops below the threshold. Use to cut bleed and tighten sustained sounds.

### Props

| Prop | Type | Default | Range | Description |
|---|---|---|---|---|
| `threshold` | `number` | `-40` | `-100–0` dBFS | Signal below this level is silenced. Set just above the noise floor or bleed you want to remove. |
| `attack` | `number` | `0.005` | `0–1` | Seconds for the gate to open once the signal exceeds threshold. |
| `release` | `number` | `0.1` | `0–1` | Seconds for the gate to close after the signal drops below threshold. Longer = more natural decay. |

### Examples

**Tight snare gate** — fast open, fast close, high threshold:
```js
Gate({ threshold: -30, attack: 0.002, release: 0.05 })
```

**Gated reverb** — classic 80s effect, slow gate close on reverb tail:
```js
Gate({ threshold: -35, attack: 0.001, release: 0.3 })
```

---

## Chaining Effects

Effects chain in array order. Output of `effects[0]` feeds `effects[1]`, and so on.

### Mastering chain

Full track output chain. Compression first, then EQ, then limiting:

```js
import { EQ, Compressor, Limiter } from '@score/effects'

const masterChain = [
  Compressor({ threshold: -18, ratio: 3, attack: 0.01, release: 0.2, knee: 8 }),
  EQ({ low: 1.5, mid: -1, high: 2, lowFreq: 100, midFreq: 2000, highFreq: 10000 }),
  Limiter({ ceiling: -0.3, release: 0.05, lookahead: 0.005 }),
]

const kick = Kick({ pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0], effects: masterChain })
```

### Creative send chain

Delay feeding a long reverb for a washy ambient send effect:

```js
import { Delay, Reverb, Filter } from '@score/effects'

const ambientSend = [
  Filter({ type: 'highpass', frequency: 300, Q: 0.7 }),
  Delay({ time: 0.375, feedback: 0.5, mix: 0.6 }),
  Reverb({ decay: 5.0, mix: 0.7 }),
]

const pad = Synth({
  wave: 'triangle',
  gain: 0.15,
  envelope: { attack: 0.8, decay: 0.2, sustain: 0.9, release: 1.5 },
  pattern: ['C4', 0, 0, 0,  'E4', 0, 0, 0,  'G4', 0, 0, 0,  'A4', 0, 0, 0],
  effects: ambientSend,
})
```

### Lo-fi drum chain

BitCrusher and noise Gate for vintage sampler texture:

```js
import { Filter, BitCrusher, Compressor, Gate } from '@score/effects'

const lofiDrums = [
  Filter({ type: 'lowpass', frequency: 8000, Q: 0.5 }),
  BitCrusher({ bitDepth: 12, sampleRate: 0.7 }),
  Compressor({ threshold: -20, ratio: 6, attack: 0.002, release: 0.08, knee: 4 }),
  Gate({ threshold: -45, attack: 0.001, release: 0.08 }),
]

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.7,
  effects: lofiDrums,
})
```
