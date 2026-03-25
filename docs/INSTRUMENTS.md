# Instruments

All instruments are imported from `@score/dsl`. They return `ChainablePart` objects — immutable builders that the engine hydrates at play time. No AudioContext is created in song files.

```js
import { Kick, Snare, HiHat, Kick808, Kick909, Snare909, Hihat808,
         Synth, SubSynth, FMSynth, Bass303, Arp, Sample, Theremin, Sax } from '@score/dsl'
```

Every instrument method returns a **new** instance — original is never mutated. Chain as many methods as you like:

```js
const kick = Kick(4).volume(0.9).reverb(0.1).swing(0.05)
```

---

## Common chain methods

All instruments share these methods.

### Pattern

| Method | Description |
|---|---|
| `.euclidean(hits, steps?)` | Replace pattern with euclidean distribution. Default steps = 16. |
| `.pattern(arr)` | Set combined pitch+rhythm array. Strings = note names, `0` = rest. |
| `.hits(...steps)` | Hit only at these step indices. `.hits(0, 4, 8, 12)` = four-on-floor. |
| `.fast(n)` | Play pattern `n` times faster. |
| `.slow(n)` | Play pattern `n` times slower. |
| `.rev()` | Reverse the pattern. |
| `.shift(n)` | Rotate `n` steps right (positive) or left (negative). |
| `.degrade(p)` | Randomly drop hits at probability `p` (0–1). |
| `.humanize(amt)` | Timing jitter in seconds. |
| `.swing(amount)` | Swing offset on off-beats (0–1). |
| `.every(n, fn)` | Apply `fn` every `n` bars. |
| `.fromBar(n)` | Start playing at bar `n`. |
| `.untilBar(n)` | Stop playing at bar `n`. |
| `.fadeIn(bars)` | Fade in over `bars` bars. |
| `.fadeOut(bars)` | Fade out over `bars` bars. |

### Pitch and notes

| Method | Description |
|---|---|
| `.note(pitch)` | Set a single pitch, e.g. `'C3'`. |
| `.notes(arr)` | Set a note sequence. `0` or `'R'` = rest. |
| `.octave(n)` | Shift `n` octaves up or down. |
| `.pitch(semitones)` | Transpose ±N semitones. |
| `.glide(time)` | Portamento time in seconds. |
| `.dur(time)` | Note duration in seconds. |

### Amplitude

| Method | Description |
|---|---|
| `.volume(v)` | Output gain 0–1. |
| `.attack(s)` | ADSR attack in seconds. |
| `.decay(s)` | ADSR decay in seconds. |
| `.sustain(v)` | ADSR sustain level 0–1. |
| `.release(s)` | ADSR release in seconds. |

### Effects

| Method | Description |
|---|---|
| `.reverb(wet, opts?)` | Reverb — `wet` = 0–1. |
| `.delay(time, feedback?)` | Echo — `time` in seconds or `'1/8d'`. |
| `.filter(freq, q?)` | Lowpass filter — cutoff Hz + optional resonance. |
| `.eq(low, mid, high)` | 3-band EQ in dB. |
| `.chorus(depth?)` | Chorus — `depth` = 0–1 (default 0.5). |
| `.flange(depth?)` | Flanger — `depth` = 0–1 (default 0.5). |
| `.bit(bits)` | Bit crusher — `bits` = 4–16. |
| `.saturate(amt)` | Saturation/distortion — `amt` = 0–1. |
| `.widen(amt)` | Stereo width — 0–2, 1 = unity. |
| `.pan(v)` | Stereo position — -1 (left) to 1 (right). |

### Modulation

| Method | Description |
|---|---|
| `.tremolo(rate, depth?)` | LFO on volume. `rate` Hz, `depth` 0–1. |
| `.vibrato(rate, depth?)` | Sine on pitch. `rate` Hz, `depth` Hz. |
| `.wobble(rate, depth?)` | LFO on filter cutoff (wobble bass / dubstep). |
| `.autopan(rate, depth?)` | LFO on pan (stereo movement). |
| `.drift(amt?)` | OU process on pitch — analog warmth. |
| `.swell(bars)` | Ramp volume over `bars` bars. |

### Routing

| Method | Description |
|---|---|
| `.mute()` | Silence this part. |
| `.solo()` | Solo this part. |
| `.chokeGroup(name)` | Hits cut each other off within the group. |
| `.send(bus, amount?)` | Route to a named effect bus. |
| `.pumpWith(source, release?)` | EDM pump — duck gain on source hits. |
| `.duckWith(source, opts?)` | Sidechain ducking. |

---

## Kick

Synthesized bass drum. Sine body with pitch envelope and amplitude decay.

```js
// Four-on-the-floor (engine default)
Kick().volume(0.9)

// Euclidean — shorthand: pass hit count
Kick(4).volume(0.9)          // same as Kick().euclidean(4, 16)
Kick(5).swing(0.08)          // 5 hits, with swing

// Custom pattern
Kick().pattern([1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0]).volume(0.85)

// With reverb
Kick(4).volume(0.9).reverb(0.08)
```

`Kick(hits?)` — `hits` is optional euclidean hit count (1–16). Omit for engine default (four-on-the-floor).

---

## Snare

Synthesized snare drum. Noise burst with tone body.

```js
// Standard backbeat
Snare().volume(0.6)

// Euclidean ghost notes
Snare(3).degrade(0.3).volume(0.5)

// Manual pattern
Snare().pattern([0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0])
```

`Snare(hits?)` — `hits` is optional euclidean hit count. Omit for engine default (beats 2 and 4).

---

## HiHat

Synthesized hi-hat. Metal noise filtered to a closed or open hat timbre.

```js
// Straight 8th notes
HiHat(8).volume(0.25)

// Dense pattern with humanize
HiHat(11).humanize(0.008).volume(0.2)

// Open and closed hats with choke
const closed = HiHat(8).chokeGroup('hat').volume(0.3)
const open   = HiHat().hits(15).chokeGroup('hat').volume(0.4)
```

`HiHat(hits?)` — `hits` is optional euclidean hit count. Omit for engine default (every other 16th).

---

## Kick808

TR-808-style bass drum. Pure sine body with deep sub pitch fall. Sugar for `Kick().model('808')`.

```js
Kick808().volume(0.9)
Kick808(4).decay(0.7)          // sustain the sub
Kick808().pumpWith(kick)       // classic pump on self-reference
```

---

## Kick909

TR-909-style bass drum. Sine body with a short noise click transient. Sugar for `Kick().model('909')`.

```js
Kick909().volume(0.85)
Kick909(4).reverb(0.05)
```

**808 vs 909:** Use `Kick808` for sub-heavy sustained kicks (trap, deep house). Use `Kick909` for punchy click-forward kicks (techno, house, trance).

---

## Snare909

TR-909-style snare. Two triangle oscillators (tone) mixed with filtered white noise. Sugar for `Snare().model('909')`.

```js
Snare909().volume(0.75)
Snare909(2).reverb(0.12)
```

---

## Hihat808

TR-808-style hi-hat. Six detuned square oscillators through bandpass + HPF filtering. Sugar for `HiHat().model('808')`.

```js
Hihat808(8).volume(0.5)
Hihat808().hits(15).volume(0.4)      // open hat on last 16th
Hihat808(8).humanize(0.01).volume(0.3)
```

Mix closed and open hats in two tracks to build classic 808 patterns.

---

## Synth

General-purpose subtractive synth. Oscillator → ADSR envelope → optional filter.

```js
// Bass line
Synth('sawtooth', 'A2')
  .filter(900)
  .notes(['A2', 'A2', 'D3', 'E3'])
  .volume(0.3)

// Pad
Synth('triangle', 'C4')
  .notes(['C4', 'E4', 'G4'])
  .attack(0.4)
  .sustain(0.8)
  .release(0.6)
  .reverb(0.4)
  .volume(0.4)

// Lead with delay
Synth('sawtooth', 'E4')
  .notes(['E4', 'D4', 'C4', 'A3'])
  .delay(0.375, 0.35)
  .reverb(0.15)
  .volume(0.25)
```

`Synth(wave?, pitch?)` — `wave` is the oscillator shape, `pitch` is an optional starting note.

### Wave shapes

| Wave | Character | Use for |
|---|---|---|
| `'sine'` | Pure, no harmonics | Sub-bass, soft pads |
| `'triangle'` | Soft, few harmonics | Warm leads, mellow pads |
| `'square'` | Hollow, odd harmonics | Bass, retro leads |
| `'sawtooth'` | Bright, all harmonics | Acid bass, leads, strings |

Default: `'sawtooth'`.

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

### ADSR presets

| Sound | `.attack()` | `.decay()` | `.sustain()` | `.release()` |
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

---

## SubSynth

Analogue subtractive synth voice. Detuned oscillators → resonant LP filter → ADSR VCA. Juno-60 / Minimoog model. Adds `.unison()` and `.detune()` on top of the base chain methods.

```js
// Deep house bass — dual oscillator, filter sweep
SubSynth('C2')
  .unison(2)
  .detune(8)
  .filter(600, 1.2)
  .wobble(0.5)
  .volume(0.6)

// Reese bass — heavy detune, hard saturation
SubSynth('A1')
  .unison(4)
  .detune(20)
  .saturate(0.6)
  .volume(0.5)
```

`SubSynth(pitch?)` — optional starting pitch.

### SubSynth-specific methods

| Method | Description |
|---|---|
| `.unison(n)` | Oscillator count: `1` = mono, `2` = dual, `4` = quad. |
| `.detune(cents)` | Detune spread in cents across oscillators. Default `8`. |

### Unison and detune combinations

| `.unison()` | `.detune()` | Character |
|---|---|---|
| `1` | `8` | Subtle, slightly warm |
| `2` | `12` | Classic Juno-style doubling |
| `4` | `20` | Supersaw-adjacent, very thick |

---

## FMSynth

2-operator FM synthesis. Carrier modulated by a modulator with independent envelopes. Adds `.ratio()`, `.modIndex()`, and `.feedback()` on top of the base chain methods.

```js
// DX7 Rhodes voicing — classic deep house chord
FMSynth('A3')
  .ratio(1.273)
  .modIndex(3)
  .reverb(0.3)
  .volume(0.6)

// Metallic FM lead — inharmonic ratio, high mod index
FMSynth('C4')
  .ratio(3.5)
  .modIndex(6)
  .delay(0.375, 0.4)
  .volume(0.3)
```

`FMSynth(pitch?)` — optional starting pitch.

### FMSynth-specific methods

| Method | Description |
|---|---|
| `.ratio(n)` | Modulator-to-carrier frequency ratio. `1.0` = harmonic. Non-integer = metallic. Default `1.273`. |
| `.modIndex(n)` | Modulation index — how much the modulator affects the carrier. `0` = pure sine. `1–5` = Rhodes range. `8+` = metallic. |
| `.feedback(n)` | Carrier feeds back to modulator (0–1). Adds harmonics and brightness. Default `0`. |

### FM timbres

| Sound | `.ratio()` | `.modIndex()` | Character |
|---|---|---|---|
| Rhodes / electric piano | `1.0` | `2–3` | Warm, glassy |
| Bell / tine | `3.0` | `1.5` | Metallic, inharmonic |
| Brass / organ | `1.0` | `5–8` | Bright, complex |
| Techno lead | `2.0` | `6–10` | Aggressive, industrial |
| Sub bass | `0.5` | `1` | Deep sine with weight |

---

## Bass303

Roland TB-303 acid bass. Sawtooth/square oscillator + resonant filter with envelope. The defining voice of acid house, acid techno, and trance. Adds `.cutoff()`, `.resonance()`, `.accent()`, and `.slide()` on top of the base chain methods.

```js
// Classic acid bassline
Bass303('C2')
  .cutoff(600)
  .resonance(2.0)
  .accent([0, 4, 8])
  .wobble(0.5)
  .volume(0.6)

// Slide phrase across a scale
Bass303('C2')
  .notes(['C2', 'D2', 'F2', 'G2'])
  .slide([1, 3])
  .cutoff(500)
  .resonance(1.5)
  .volume(0.55)
```

`Bass303(pitch?)` — optional starting pitch.

### Bass303-specific methods

| Method | Description |
|---|---|
| `.cutoff(freq)` | Filter cutoff in Hz. Default `400`. |
| `.resonance(q)` | Filter resonance Q. Default `0.8`. High values → self-oscillation. |
| `.filter(freq, q?)` | Sets cutoff + optional resonance together. |
| `.accent(steps)` | Step indices where velocity is boosted and filter opens fully. |
| `.slide(steps)` | Step indices with portamento (glide) to next note. |

`.wobble(rate)` is especially effective on Bass303 — it sweeps the filter cutoff with an LFO, giving the classic acid wobble.

---

## Arp

Arpeggiator. Cycles through a note list in sequence. Each step triggers the next note at the current synth voice.

```js
// Classic trance arp — up mode, triangle wave
Arp(['C4', 'E4', 'G4', 'B4'])
  .euclidean(8, 16)
  .volume(0.5)
  .delay(0.375, 0.3)

// Dense 16th-note arp with reverb
Arp(['A3', 'C4', 'E4', 'A4'])
  .fast(2)
  .reverb(0.25)
  .volume(0.4)
```

`Arp(notes)` — `notes` is an ordered array of note names or MIDI pitch numbers to arpeggiate.

---

## Theremin

Continuous pitch/volume control. Sine oscillator with LFO vibrato. Plays continuously — use `.note()` to set pitch.

```js
Theremin('A4').vibrato(5, 8).volume(0.4)
Theremin('C4').drift(0.4).glide(0.1).volume(0.3)
```

`Theremin(pitch?)` — optional starting pitch.

---

## Sax

Saxophone-style voice. Sawtooth through bandpass filter with ADSR envelope. Breathy, reedy character.

```js
Sax('A4')
  .notes(['A4', 'B4', 'C5', 'D5'])
  .dur(0.35)
  .reverb(0.2)
  .volume(0.4)
```

`Sax(pitch?)` — optional starting pitch.

---

## Sample

Plays an audio file. Triggered on each pattern hit.

```js
// One-shot clap on beats 2 and 4
Sample('./samples/clap.wav').hits(4, 12).volume(0.7)

// Euclidean rim shot
Sample('./samples/rim.wav').euclidean(3, 16).volume(0.5)

// Looped vinyl crackle texture
Sample('./samples/vinyl-crackle.wav')
  .hits(0)
  .volume(0.12)
```

`Sample(path)` — `path` is required. Relative to the song file. Supports `.wav`, `.mp3`, `.ogg`.

### Path conventions

```
my-project/
  my-song.js
  samples/
    kick.wav
    snare.wav
    rim.wav
```

Paths resolve relative to the song file. The `samples/` directory is gitignored — each user brings their own files. See [SAMPLE.md](SAMPLE.md) for full details.

### Pitch shifting

Use `.pitch(semitones)` to transpose:

```js
// Root at A2, shift to D3 (+5 semitones)
Sample('./samples/bass-a2.wav').pitch(5).hits(0, 4, 8, 12)
```

---

## Using Sequence()

`Sequence()` parses a space-separated string of note names and rests into an array. `.` = rest.

```js
import { Synth, Sequence } from '@score/dsl'

const lead = Synth('sawtooth', 'A2')
  .notes(Sequence('A2 . D3 . F3 . E3 .'))
  .volume(0.2)
```
