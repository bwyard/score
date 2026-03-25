# Effects

Effects are applied via chain methods on any instrument. No imports needed for the common effects.

```js
const bass = Bass303('A2').cutoff(600).wobble(0.5).delay(0.375, 0.3).reverb(0.15)
const kick  = Kick(4).volume(0.9).reverb(0.08)
const lead  = Synth('sawtooth', 'E4').filter(1200, 2.0).chorus(0.4).delay(0.25)
```

Effects process in chain order — left to right. The output of each effect feeds the input of the next.

---

## Chain effects reference

### `.reverb(wet, opts?)`

Simulates acoustic space. Adds depth, dimension, and glue.

| Param | Type | Default | Description |
|---|---|---|---|
| `wet` | `number` | — | Dry/wet blend 0–1. `0.1–0.2` for drums. `0.3–0.6` for pads. |
| `opts.decay` | `number` | `2.0` | Tail length in seconds. `0.5` = small room. `6.0` = large hall. |
| `opts.preDelay` | `number` | `0` | Pre-delay in seconds. `0.02–0.04` keeps attack punchy. |

```js
Kick(4).reverb(0.08)                              // tight room on kick
Synth('triangle').reverb(0.4, { decay: 6.0 })    // large hall on pad
Snare().reverb(0.2, { decay: 1.2, preDelay: 0.03 }) // deep house snare tail
```

**Routing:** Place reverb last (or second-to-last before a limiter). Reverb after distortion smears harmonics; reverb before distortion gives lo-fi texture.

---

### `.delay(time, feedback?)`

Repeats the signal after a fixed time. Creates echoes, rhythmic doubling, and spatial depth.

| Param | Type | Default | Description |
|---|---|---|---|
| `time` | `number \| string` | — | Delay time in seconds, or a note value string (`'1/8d'`). |
| `feedback` | `number` | `0.3` | How much of the wet signal feeds back. Higher = longer echo tail. Keep below `0.9`. |

```js
Synth('sawtooth').delay(0.375, 0.35)   // dotted-eighth sync, moderate tail
Arp(['C4','E4','G4']).delay(0.1875, 0.2)  // tight eighth-note doubling
FMSynth('A3').delay(0.375, 0.5).reverb(0.2)  // delay into reverb — natural echo space
```

**Routing:** Delay sits best before reverb. Delaying into reverb → natural echo space. Reversed order → smeared, washed-out character.

---

### `.filter(freq, q?)`

Lowpass filter. Attenuates frequencies above the cutoff.

| Param | Type | Default | Description |
|---|---|---|---|
| `freq` | `number` | — | Cutoff frequency in Hz. |
| `q` | `number` | `1.0` | Resonance. Higher = peak at cutoff. Above `10` resonance becomes audible as a tone. |

```js
Synth('sawtooth').filter(900)           // basic tone-shaping
Bass303('A2').filter(400, 8.0)          // acid squelch — high resonance
SubSynth('C2').filter(600, 1.2)        // analogue warmth
```

For **highpass** or **bandpass** filtering, or for full `@score/effects` filter control (e.g. notch), use the `Filter` descriptor factory — see [Advanced: `@score/effects` factories](#advanced-scoreeffects-factories) below.

---

### `.eq(low, mid, high)`

Three-band equalizer. Gains in dB.

| Param | Description |
|---|---|
| `low` | Low shelf gain in dB. Positive = boost lows. |
| `mid` | Mid peak gain in dB. |
| `high` | High shelf gain in dB. |

```js
Synth('sawtooth').eq(4, -2, 2)    // warm bass boost — lift lows, cut harsh mids, add air
Kick(4).eq(2, 0, -3)              // lift sub, cut harsh top
```

---

### `.chorus(depth?)`

Modulates a short delayed copy with an LFO and mixes it back. Creates thickness and shimmer.

| Param | Type | Default | Description |
|---|---|---|---|
| `depth` | `number` | `0.5` | Modulation depth 0–1. Low = subtle detuning. High = wide warble. |

```js
SubSynth('C3').chorus(0.4)       // lush pad doubling
Synth('triangle').chorus(0.25)   // subtle vocal-style shimmer
```

---

### `.flange(depth?)`

Short modulated delay mixed with dry signal. Jet-plane sweeps, comb filtering, metallic shimmer.

| Param | Type | Default | Description |
|---|---|---|---|
| `depth` | `number` | `0.5` | Modulation depth 0–1. |

```js
Synth('square').flange(0.4)      // subtle jet sweep
FMSynth('C4').flange(0.8)        // intense metallic flange
```

---

### `.bit(bits)`

Bit crusher. Reduces bit depth for digital degradation and lo-fi texture.

| Param | Type | Description |
|---|---|---|
| `bits` | `number` | Bit depth 4–16. `16` = CD quality (no effect). `8` = classic 8-bit. `4` = extreme crunch. |

```js
Snare().bit(8)          // classic 8-bit snare
HiHat(8).bit(12)       // subtle vintage sampler texture
Sample('./samples/kick.wav').bit(6)  // extreme crush
```

---

### `.saturate(amt)`

Overdrive / saturation. Adds harmonics and warmth.

| Param | Type | Description |
|---|---|---|
| `amt` | `number` | Drive 0–1. `0.1` = subtle tape warmth. `0.5` = moderate crunch. `0.8+` = heavy clip. |

```js
Bass303('A2').saturate(0.3)     // analog warmth
SubSynth('A1').saturate(0.6)    // Reese bass grit
```

---

### `.widen(amt)`

Mid-side stereo width control.

| Param | Type | Description |
|---|---|---|
| `amt` | `number` | `0` = mono. `1` = unity. `2` = maximum width. Values above `1.5` may cause phase issues on mono playback — check in mono. |

```js
Synth('triangle').reverb(0.4).widen(1.5)   // wide atmospheric pad
FMSynth('A3').widen(1.2)                    // spread chords
```

**Routing:** Do not apply `.widen()` to kick or bass — wide low frequencies cause phase cancellation on mono speakers.

---

### `.pan(v)`

Stereo position.

| Param | Type | Description |
|---|---|---|
| `v` | `number` | `-1` = hard left. `0` = center. `1` = hard right. |

```js
HiHat(8).pan(0.3)     // slight right
Arp(['C4','E4']).pan(-0.4)  // slight left
```

---

## Chain recipes

### Classic delay + reverb send

```js
const lead = FMSynth('A3')
  .ratio(1.273)
  .modIndex(3)
  .delay(0.375, 0.4)
  .reverb(0.25)
  .volume(0.4)
```

### Lo-fi drum texture

```js
const snare = Snare909()
  .bit(12)
  .saturate(0.2)
  .reverb(0.15)
  .volume(0.6)
```

### Deep house pad

```js
const pad = SubSynth('C3')
  .unison(2)
  .detune(12)
  .filter(1200, 1.5)
  .chorus(0.35)
  .reverb(0.45, { decay: 4.0 })
  .widen(1.3)
  .volume(0.4)
```

### EDM pump (sidechain)

```js
const kick = Kick808(4).volume(0.9)
const pad  = SubSynth('C3').reverb(0.4).pumpWith(kick, 0.3).volume(0.5)
```

---

## Advanced: `@score/effects` factories

For effects not yet available as chain methods — Compressor, Limiter, Phaser, Gate, and Distortion (with mode control) — import the descriptor factories from `@score/effects` and attach them via the `_effects` field directly, or wait for upcoming chain methods.

```js
import { Compressor, Limiter, Phaser, Gate, Distortion } from '@score/effects'
```

> **Note:** These factories produce `EffectDescriptor` objects. Direct `_effects` attachment is the current escape hatch while chain methods for these effects are planned.

### Compressor

Reduces dynamic range. Attenuates peaks above the threshold.

```js
// Drum bus glue
Compressor({ threshold: -18, ratio: 4, attack: 0.005, release: 0.1, knee: 6 })

// Heavy limiting compression
Compressor({ threshold: -12, ratio: 16, attack: 0.001, release: 0.05, knee: 2 })
```

| Prop | Default | Description |
|---|---|---|
| `threshold` | `-24` dBFS | Level where compression begins. |
| `ratio` | `4` | Compression ratio (N:1). `20` = near brick-wall. |
| `attack` | `0.003` | Seconds before compression engages. Fast = catches transients. |
| `release` | `0.25` | Seconds for gain to recover after signal drops below threshold. |
| `knee` | `10` dB | Soft-knee width. `0` = hard knee. |

### Limiter

Brick-wall limiter. No signal exceeds the ceiling. Place last in mastering chains.

```js
// Mastering limiter
Limiter({ ceiling: -0.3, release: 0.05, lookahead: 0.005 })
```

| Prop | Default | Description |
|---|---|---|
| `ceiling` | `-0.3` dBFS | Maximum output level. |
| `release` | `0.05` | Seconds for gain to recover. |
| `lookahead` | `0.005` | Seconds of lookahead — anticipates peaks, reduces distortion. |

### Phaser

Allpass filter bank swept by an LFO. Sweeping, organic, whooshing movement.

```js
Phaser({ rate: 0.8, depth: 0.6, stages: 4, mix: 0.5 })
```

| Prop | Default | Description |
|---|---|---|
| `rate` | `1.0` Hz | LFO rate. |
| `depth` | `0.5` | Modulation depth 0–1. |
| `stages` | `4` | Allpass stages. More = richer sweep. |
| `mix` | `0.5` | Dry/wet blend. |

### Gate

Noise gate. Silences the signal below the threshold. Cuts bleed, tightens sustained sounds.

```js
// Tight snare gate
Gate({ threshold: -30, attack: 0.002, release: 0.05 })

// Classic 80s gated reverb
Gate({ threshold: -35, attack: 0.001, release: 0.3 })
```

| Prop | Default | Description |
|---|---|---|
| `threshold` | `-40` dBFS | Signal below this level is silenced. |
| `attack` | `0.005` | Seconds for gate to open. |
| `release` | `0.1` | Seconds for gate to close. Longer = more natural decay. |

### Distortion

Nonlinear waveshaping. Soft, hard, or foldback modes.

```js
// Tape saturation
Distortion({ amount: 0.15, mode: 'soft' })

// Hard industrial crunch
Distortion({ amount: 0.6, mode: 'hard' })
```

| Prop | Default | Description |
|---|---|---|
| `amount` | `0.5` | Intensity 0–1. |
| `mode` | `'soft'` | `'soft'` = even harmonics, tape character. `'hard'` = aggressive clipping. `'foldback'` = chaotic fold. |

### Filter (full control)

For highpass, bandpass, or notch filtering — the chain `.filter()` method is lowpass only.

```js
// Highpass — remove sub mud
Filter({ type: 'highpass', frequency: 80, Q: 0.7 })

// Resonant notch — remove a specific frequency
Filter({ type: 'notch', frequency: 1200, Q: 5.0 })
```

| Prop | Default | Description |
|---|---|---|
| `type` | `'lowpass'` | `'lowpass'` \| `'highpass'` \| `'bandpass'` \| `'notch'` |
| `frequency` | `1000` Hz | Cutoff frequency. |
| `Q` | `1.0` | Resonance. |
