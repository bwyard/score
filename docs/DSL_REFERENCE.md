# Score DSL Reference

**Package:** `@score/dsl`
**Last updated:** 2026-03-29 (post PRs #88–#94, dev branch)

This is the authoritative reference for the Score chain API. Every instrument factory, every chain method, and every effect descriptor is listed here with signature, description, example, and engine hydration status.

For gap analysis and method-by-method audit history see [`docs/design/dsl-audit.md`](design/dsl-audit.md).

---

## Two DSL layers

Score has two authoring layers. Song files typically use Layer 1.

| Layer | API | Returns | When to use |
|---|---|---|---|
| **Layer 1 — chain API** | `Kick808().volume(0.9).reverb(0.15)` | `ChainablePart` | All new songs |
| **Layer 2 — descriptor API** | `Kick808({ pattern: [1,0,0,0], volume: 0.9 })` | `InstrumentDescriptor` | Legacy only — deprecated, no new songs |

Both layers export the same function names. The chain API (`@score/dsl`) is the canonical authoring surface. The descriptor API (`@score/dsl/instruments`) remains for backwards compatibility.

---

## Hydration status key

| Status | Meaning |
|---|---|
| **WIRED** | Engine reads this field and produces audio behavior |
| **PARTIAL** | Field passes through but has incomplete or platform-specific behavior |
| **NO-OP** | Field is set on the descriptor but engine ignores it — silent no-op |
| **GUI** | No audio effect — used by GUI (mixer, visuals, codePatcher) only |

---

## Instrument factories

### `Kick(hits?)`

Kick drum — sine oscillator body with pitch envelope and amplitude decay.

```ts
Kick(hits?: number): ChainablePart
```

| Param | Type | Description |
|---|---|---|
| `hits` | `number?` | Euclidean hit count 1–16. `Kick(5)` = `euclidean(5, 16)`. Omit for engine default (4-on-the-floor). |

```ts
// 4-on-the-floor kick
Kick().volume(0.9).reverb(0.1)

// Euclidean kick — 5 hits spread over 16 steps
Kick(5).swing(0.1)
```

---

### `Kick808(hits?)`

Roland TR-808 kick — pure sine oscillator with pitch envelope and amplitude decay. Sugar for `Kick(hits).model('808')`.

```ts
Kick808(hits?: number): ChainablePart
```

```ts
Kick808().volume(0.9).decay(0.7)

// Sidechain pump off the kick
Kick808(5).pumpWith(kick)
```

---

### `Kick909(hits?)`

Roland TR-909 kick — sine body with a short noise click transient for punch. Sugar for `Kick(hits).model('909')`.

```ts
Kick909(hits?: number): ChainablePart
```

```ts
Kick909().volume(0.85)
```

---

### `Snare(hits?)`

Snare drum — noise burst with tone body.

```ts
Snare(hits?: number): ChainablePart
```

```ts
// Standard backbeat
Snare().volume(0.7)

// Euclidean ghost notes — 3 hits over 16 steps
Snare(3).degrade(0.3)
```

---

### `Snare909(hits?)`

Roland TR-909 snare — two triangle oscillators (tone body) mixed with filtered white noise (snap/sizzle). Sugar for `Snare(hits).model('909')`.

```ts
Snare909(hits?: number): ChainablePart
```

```ts
Snare909().volume(0.75)
```

---

### `HiHat(hits?)`

Hi-hat — metal noise filtered to a closed or open hat timbre.

```ts
HiHat(hits?: number): ChainablePart
```

```ts
HiHat(8).volume(0.5)

// Euclidean hi-hat rolls
HiHat(11).humanize(0.01)
```

---

### `Hihat808(hits?)`

Roland TR-808 hi-hat — six detuned square oscillators through bandpass + HPF filtering. Sugar for `HiHat(hits).model('808')`.

```ts
Hihat808(hits?: number): ChainablePart
```

```ts
Hihat808(8).volume(0.5).chokeGroup('hat')

// Open hat on the last 16th
Hihat808().hits(15).volume(0.4)
```

---

### `Synth(wave?, pitch?)`

General-purpose oscillator synth — oscillator + ADSR envelope + optional filter.

```ts
Synth(
  wave?: 'sine' | 'square' | 'sawtooth' | 'triangle',  // default: 'sawtooth'
  pitch?: string,
): ChainablePart
```

```ts
// Pad chord
Synth('sine', 'C3').notes(['C3','E3','G3']).reverb(0.4).volume(0.5)

// Bass voice
Synth('sawtooth').notes(['C2','C2','G1','C2']).filter(600).volume(0.7)
```

---

### `SubSynth(pitch?)` → `SubSynthPart`

Analogue subtractive voice — detuned oscillators → resonant LP filter → ADSR VCA. Inspired by Juno-60 and Minimoog.

Returns a `SubSynthPart` with two extras: `.unison()` and `.detune()`.

```ts
SubSynth(pitch?: string): SubSynthPart
```

| Extra method | Signature | Description |
|---|---|---|
| `.unison(n)` | `(1 \| 2 \| 4) => SubSynthPart` | Number of detuned oscillators. Default `1`. |
| `.detune(cents)` | `(number) => SubSynthPart` | Spread in cents across unison oscillators. Default `8`. |

```ts
// Deep house bass — dual oscillator, filter sweep
SubSynth('C2').unison(2).detune(8).filter(600, 1.2).wobble(0.5)

// Pad with wide unison
SubSynth('A3').unison(4).detune(12).attack(0.4).release(1.0).reverb(0.5)
```

---

### `FMSynth(pitch?)` → `FMSynthPart`

2-operator FM synthesis — DX7 Rhodes / metallic leads / electric piano. Carrier and modulator are both sine oscillators.

Returns an `FMSynthPart` with three extras: `.ratio()`, `.modIndex()`, `.feedback()`.

```ts
FMSynth(pitch?: string): FMSynthPart
```

| Extra method | Signature | Description |
|---|---|---|
| `.ratio(n)` | `(number) => FMSynthPart` | Modulator-to-carrier frequency ratio. Non-integer = inharmonic/metallic. Default `1.273`. |
| `.modIndex(n)` | `(number) => FMSynthPart` | Modulation index — peak deviation of carrier frequency. Default `3`. |
| `.feedback(n)` | `(number) => FMSynthPart` | Feedback amount 0–1 (carrier feeds back to modulator). Default `0`. |

```ts
// DX7 Rhodes — classic deep house chord
FMSynth('A3').ratio(1.273).modIndex(3).reverb(0.3).volume(0.6)

// Metallic FM lead — inharmonic ratio, high index
FMSynth('C4').ratio(3.5).modIndex(6).delay(0.375, 0.4)
```

---

### `Bass303(pitch?)` → `Bass303Part`

Roland TB-303-style acid bass — sawtooth/square oscillator + resonant envelope filter. The voice of acid house and acid techno.

Returns a `Bass303Part` with four extras: `.cutoff()`, `.resonance()`, `.accent()`, `.slide()`.

```ts
Bass303(pitch?: string): Bass303Part
```

| Extra method | Signature | Description |
|---|---|---|
| `.cutoff(freq)` | `(number) => Bass303Part` | Filter cutoff in Hz. Default `400`. |
| `.resonance(q)` | `(number) => Bass303Part` | Filter resonance Q. High values self-oscillate. Default `0.8`. |
| `.filter(freq, q?)` | `(number, number?) => Bass303Part` | Overrides base `.filter()` — maps `freq → cutoff`, `q → resonance` in props. |
| `.accent(steps)` | `(number[]) => Bass303Part` | Step indices where velocity is boosted and filter opens fully. |
| `.slide(steps)` | `(number[]) => Bass303Part` | Step indices with portamento (glide) to the next note. |

> **Note:** Use `.cutoff()` + `.resonance()` rather than the inherited `.filter()`. The base `.filter()` method is overridden on `Bass303Part` to map into props correctly, but the generic `_filter` descriptor field is not hydrated — `.cutoff()` is the reliable path.

```ts
// Classic acid bassline
Bass303('C2').cutoff(600).resonance(2.0).accent([0, 4, 8]).wobble(0.5)

// Sliding phrase
Bass303('C2').notes(['C2','D2','F2','G2']).slide([1,3]).cutoff(500).resonance(1.5)
```

---

### `Arp(notes)`

Arpeggiator — cycles through `notes` in sequence on each pattern step.

```ts
Arp(notes: (string | number)[]): ChainablePart
```

```ts
// Classic trance arp
Arp(['C4','E4','G4','B4']).euclidean(8, 16).volume(0.5).delay(0.375, 0.3)

// Minor pentatonic arp, fast
Arp(['C3','Eb3','F3','G3','Bb3']).fast(2).reverb(0.2)
```

---

### `Sax(pitch?)`

Saxophone — sawtooth oscillator through bandpass filter with ADSR. Breathy, reedy character.

```ts
Sax(pitch?: string): ChainablePart
```

```ts
Sax('A4').notes(['A4','B4','C5','D5']).dur(0.35).reverb(0.2)
```

---

### `Theremin(pitch?)`

Theremin — continuous sine oscillator with LFO vibrato. No pattern needed — sustains indefinitely.

```ts
Theremin(pitch?: string): ChainablePart
```

```ts
Theremin('A4').vibrato(5, 8).volume(0.4)
```

---

### `Pad(pitch?)` ⚠️ stub

Soft pad voice — long attack, sustained, gentle filter. Engine falls back to `Synth('sine')`.

```ts
Pad(pitch?: string): ChainablePart
```

```ts
Pad('C4').attack(0.3).release(1.2).reverb(0.5).volume(0.4)
```

---

### `Rhodes(pitch?)` ⚠️ stub

Fender Rhodes electric piano — FM voice with tine character. Engine falls back to `Synth('sine')`.

```ts
Rhodes(pitch?: string): ChainablePart
```

---

### `Pluck(pitch?)` ⚠️ stub

Plucked string — fast attack, fast decay. Karplus-Strong pending. Engine falls back to `Synth('sine')`.

```ts
Pluck(pitch?: string): ChainablePart
```

---

### `Stab(pitch?)` ⚠️ stub

Short stab — percussive attack, no sustain. Engine falls back to `Synth('sine')`.

```ts
Stab(pitch?: string): ChainablePart
```

---

### `Sample(path)`

Sample playback — load and trigger an audio file on each pattern hit.

```ts
Sample(path: string): ChainablePart
```

```ts
// One-shot clap on beats 2 and 4
Sample('./samples/clap.wav').hits(4, 12).volume(0.7)
```

---

### Other stubs ⚠️

The following instruments are defined in `@score/dsl` but have no dedicated engine implementation — they fall back to `Synth('sine')`. Use for sound design previews; full implementations are roadmapped.

| Factory | Description |
|---|---|
| `Wurlitzer(pitch?)` | Wurlitzer electric piano — reedy, slightly overdriven |
| `Hammond(pitch?)` | Hammond B3 tonewheel organ |
| `Clavinet(pitch?)` | Hohner Clavinet — percussive clavichord, funk |
| `DX7Lead(pitch?)` | DX7-style FM lead — bright, metallic |
| `WavetableSynth(pitch?)` | Wavetable synth — cycles through waveform tables |
| `SuperSaw(pitch?)` | Supersaw — N detuned sawtooth oscillators (trance, big room) |
| `KarplusSynth(pitch?)` | Karplus-Strong string synthesis |
| `Guitar(pitch?)` | Electric guitar — Karplus-Strong with pick model |
| `AcousticGuitar(pitch?)` | Acoustic guitar — Karplus with body resonance |
| `BassGuitar(pitch?)` | Bass guitar — Karplus with low-frequency body |
| `Trumpet(pitch?)` | Bright brass with mute options |
| `Trombone(pitch?)` | Warm, sliding brass |
| `FrenchHorn(pitch?)` | Rich, mellow brass |
| `Flugelhorn(pitch?)` | Darker, softer trumpet variant |

---

## Chain methods

All chain methods are available on every `ChainablePart`. Methods return a **new** `ChainablePart` — the original is never mutated.

Sub-types (`SubSynthPart`, `FMSynthPart`, `Bass303Part`) preserve their sub-type through all chain calls.

---

### Pattern group

#### `.speed(n)` — WIRED

Speed multiplier. `n > 1` = faster, `0 < n < 1` = slower, `n < 0` = reverse.

```ts
speed(n: number): T   // n ≠ 0
```

Pre-expands `_pattern` in the DSL — engine receives the resolved array.

```ts
Kick808().speed(2)     // double time
HiHat(8).speed(0.5)   // half time
Snare().speed(-1)      // reversed
```

---

#### `.slow(n)` — WIRED

Sugar: `speed(1/n)`. Play `n` times slower.

```ts
slow(n: number): T
```

```ts
Arp(['C3','E3','G3']).slow(2)   // half speed arp
```

---

#### `.fast(n)` — WIRED

Sugar: `speed(n)`. Play `n` times faster.

```ts
fast(n: number): T
```

---

#### `.rev()` — WIRED

Reverse the pattern.

```ts
rev(): T
```

---

#### `.halfTime()` — WIRED

Half-time feel. Sugar for `speed(0.5)`.

---

#### `.doubleTime()` — WIRED

Double-time feel. Sugar for `speed(2)`.

---

#### `.tripletTime()` — WIRED

Triplet feel — 3 against 2. Sugar for `speed(2/3)`.

---

#### `.retrograde()` — WIRED

Classical term: reverse. Alias for `.rev()`.

---

#### `.augment(n?)` — WIRED

Classical: lengthen by factor `n`. Sugar for `slow(n)`. Default `n = 2`.

---

#### `.diminish(n?)` — WIRED

Classical: shorten by factor `n`. Sugar for `fast(n)`. Default `n = 2`.

---

#### `.euclidean(hits, steps?)` — WIRED

Replace pattern with an evenly-distributed euclidean rhythm.

```ts
euclidean(hits: number, steps?: number): T   // default steps = 16
```

```ts
HiHat().euclidean(11, 16)   // Afro-Cuban clave feel
Kick().euclidean(3, 8)
```

---

#### `.shift(n)` — WIRED

Rotate pattern `n` steps. Negative = shift left.

```ts
shift(n: number): T
```

```ts
Snare().shift(2)   // rotate right by 2 steps
```

---

#### `.invert()` — WIRED

Flip 1s and 0s. Hits become rests, rests become hits.

---

#### `.palindrome()` — WIRED

Palindrome — pattern + reversed pattern (exclusive center). Doubles the effective length.

---

#### `.hits(...args)` — WIRED

Set hit positions explicitly.

```ts
hits(...args: (number | { of: number })[]): T
```

`{ of: N }` sets the total step count (default 16).

```ts
Snare().hits(4, 12)                    // beats 2 and 4 in a 16-step grid
Snare().hits(4, 12, { of: 16 })        // explicit — same as above
HiHat().hits(0, 2, 4, 6, { of: 8 })   // every other step in 8-step grid
```

---

#### `.pattern(pat)` — WIRED

Set a combined pitch+rhythm pattern directly. String values are note names; `0` = rest.

```ts
pattern(pat: (string | number)[]): T
```

Splits into `_pattern` (rhythm) and `_notes` (pitch sequence) automatically.

```ts
Bass303('C2').cutoff(600).pattern(['C2', 0, 0, 0, 'D3', 0, 0, 0])
Synth().pattern(['C4', 'E4', 0, 'G4', 0, 0, 'E4', 0])
```

---

#### `.mask(pattern)` — WIRED

Mute steps where mask = 0. ANDs mask against the hit pattern.

```ts
mask(pattern: PatternInput): T
```

```ts
// Only allow hits on steps where mask is 1
HiHat(16).mask([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0])
```

---

#### `.repeat(n)` — WIRED

Play the pattern `n` times per cycle. Flat-maps each step to `n` copies.

```ts
repeat(n: number): T   // n > 0
```

```ts
Kick808(4).repeat(2)   // play the 4-hit pattern twice per bar
```

---

#### `.degrade(p)` — WIRED

Drop hits randomly at probability `p`. `0` = never drop, `1` = always silence all hits.

```ts
degrade(p: number): T   // p >= 0
```

Uses a seeded PRNG — same seed produces same drop pattern each loop.

```ts
// 30% of hi-hats drop out each cycle
HiHat808(8).degrade(0.3)

// Ghost notes — dense pattern with many drops
Snare(7).degrade(0.6)
```

---

#### `.humanize(amt)` — WIRED

Timing jitter in seconds. Randomly offsets each step trigger forward by up to `amt` seconds.

```ts
humanize(amt: number): T
```

```ts
HiHat(8).humanize(0.01)    // subtle timing variation
Snare().humanize(0.005)
```

---

#### `.swing(amount)` — WIRED

Swing offset on off-beats. Range `0–1`. Delays even-numbered 16th notes.

```ts
swing(amount: number): T
```

```ts
HiHat(8).swing(0.1)    // subtle swing
Kick808().swing(0.15)   // deeper groove
```

---

#### `.stutter(n)` — NO-OP

Stutter — repeat the last hit `n` times. `n = 0` is a no-op.

```ts
stutter(n: number): T   // n >= 0
```

> ⚠️ `_stutter` is set in the descriptor but not yet read by the engine.

---

#### `.every(n, fn)` — WIRED

Apply a pattern transform function every `n` cycles.

```ts
every(n: number, fn: (p: number[]) => number[]): T
```

`fn` receives the current pattern and returns a new one.

```ts
// Every 4 cycles, reverse the hi-hat pattern
HiHat(8).every(4, p => [...p].reverse())

// Every 2 cycles, invert the snare pattern
Snare().every(2, p => p.map(v => v ? 0 : 1))
```

---

#### `.apply(fn)` — WIRED

Custom pattern transform applied every cycle.

```ts
apply(fn: (p: number[], ctx: PatternCtx) => number[]): T
```

`PatternCtx` provides `{ bar, bpm, steps, seed }`.

```ts
// Randomize pattern each bar using the seeded context
Kick().apply((p, ctx) => p.map(() => Math.random() < 0.5 ? 1 : 0))
```

---

#### `.mapNotes(fn)` — WIRED

Custom note sequence transform applied at descriptor resolution.

```ts
mapNotes(fn: (notes: (string | number)[], ctx: PatternCtx) => (string | number)[]): T
```

```ts
// Transpose notes up by one octave each bar
Synth().notes(['C3','E3','G3']).mapNotes((notes, ctx) =>
  notes.map(n => typeof n === 'string' ? n.replace(/\d/, d => String(+d + 1)) : n)
)
```

---

#### `.stepProb(probs)` — WIRED

Per-step fire probability array. Each entry is 0–1 — the probability that the step fires.

```ts
stepProb(probs: number[]): T
```

Uses a seeded Mulberry32 PRNG.

```ts
// Steady on beat 1, probabilistic on offbeats
Kick().stepProb([1, 0, 0.3, 0, 1, 0, 0.2, 0, 1, 0, 0, 0.4, 1, 0, 0, 0])
```

---

#### `.stretch(bars)` — WIRED

Fit the entire pattern into exactly `n` bars. Recalculates step timing so the pattern spans `bars` bars instead of 1.

```ts
stretch(bars: number): T
```

```ts
// 16-step pattern spread over 2 bars — half speed without changing step count
HiHat(16).stretch(2)

// 8-step melody over 4 bars
Synth().notes(['C3','D3','F3','G3','A3','G3','F3','D3']).stretch(4)
```

---

#### `.phase(amount)` — WIRED

Offset start position through the pattern. `0` = start at beginning, `0.5` = start halfway through.

```ts
phase(amount: number): T   // 0–1
```

```ts
// Phase offset for polyrhythmic feel
HiHat(16).phase(0.5)
Kick808().phase(0.25)
```

---

#### `.fromBar(n)` — WIRED

Start playing at bar `n`. Part is silent before this bar.

```ts
fromBar(n: number): T
```

```ts
// Drop the bass in at bar 9
Bass303('C2').cutoff(600).fromBar(9)
```

---

#### `.untilBar(n)` — WIRED

Stop playing at bar `n`. Part is silent from this bar onward.

```ts
untilBar(n: number): T
```

```ts
// Intro element that drops out at bar 5
Theremin('E4').untilBar(5)
```

---

#### `.fadeIn(bars)` — WIRED

Fade in over `bars` bars, starting from silence.

```ts
fadeIn(bars: number): T
```

```ts
Pad('C4').fadeIn(4).reverb(0.6)
```

---

#### `.fadeOut(bars)` — WIRED

Fade out over `bars` bars, ending in silence.

```ts
fadeOut(bars: number): T
```

```ts
Synth('sawtooth').notes(['A3','C4','E4']).untilBar(16).fadeOut(2)
```

---

### Pitch / notes group

#### `.note(pitch)` — WIRED

Set a single pitch.

```ts
note(pitch: string): T
```

```ts
Theremin().note('A4')
SubSynth().note('C2')
```

---

#### `.notes(arr)` — WIRED

Set a note/chord sequence. `'R'` or `0` = rest. The sequencer steps through this array on each hit.

```ts
notes(arr: (string | number)[]): T
```

```ts
Synth().notes(['C4','E4','G4','B4'])
Arp(['C3','E3','G3']).notes(['C3','Eb3','G3'])   // override Arp notes
```

---

#### `.scale(name, root)` — WIRED

Constrain all notes to the named scale. Notes not in the scale are quantized to the nearest scale degree.

```ts
scale(name: string, root: string): T
```

```ts
Synth().notes(['C4','D4','E4','F#4','G4']).scale('minor', 'A')
Bass303('A2').scale('phrygian', 'A')
```

---

#### `.pitch(semitones)` — WIRED

Transpose all notes by `semitones` (positive = up, negative = down).

```ts
pitch(semitones: number): T
```

```ts
Synth().notes(['C4','E4','G4']).pitch(7)    // up a perfect fifth
Bass303('C2').pitch(-2)                      // down a whole tone
```

---

#### `.octave(n)` — WIRED

Shift all notes by `n` octaves. `n = 1` = one octave up, `n = -1` = one octave down.

```ts
octave(n: number): T
```

```ts
Synth().notes(['C4','E4','G4']).octave(-1)   // drop to C3
```

---

#### `.glide(time)` — WIRED

Portamento / glide time in seconds. Slides smoothly from the previous pitch to the current note.

```ts
glide(time: number): T
```

```ts
Bass303('C2').notes(['C2','F2','G2','A2']).glide(0.05)
SubSynth('C2').glide(0.1)
```

---

#### `.dur(time)` — WIRED

Note duration in seconds. Overrides the default note length.

```ts
dur(time: number): T
```

```ts
Sax('A4').notes(['A4','C5','E5']).dur(0.35)
Arp(['C4','E4','G4']).dur(0.1)
```

---

### Amplitude group

#### `.volume(v)` — WIRED

Output gain. Range `0–1`. `1` = full volume.

```ts
volume(v: number): T
```

---

#### `.attack(s)` — WIRED

ADSR attack time in seconds.

```ts
attack(s: number): T
```

---

#### `.decay(s)` — WIRED

ADSR decay time in seconds.

```ts
decay(s: number): T
```

---

#### `.sustain(v)` — WIRED

ADSR sustain level, `0–1`.

```ts
sustain(v: number): T
```

---

#### `.release(s)` — WIRED

ADSR release time in seconds.

```ts
release(s: number): T
```

```ts
// Long pad envelope
Pad('C4').attack(0.4).decay(0.2).sustain(0.8).release(1.5)

// Punchy pluck
Pluck('C4').attack(0.001).decay(0.3).sustain(0).release(0.1)
```

---

#### `.duckWith(source, opts?)` — NO-OP

Duck gain when `source` part hits (sidechain compression / EDM pump).

```ts
duckWith(
  source: string | ChainablePart,
  opts?: { amount?: number; attack?: number; release?: number }
): T
```

> ⚠️ `_sidechain` is set but not yet hydrated by the engine.

---

#### `.pumpWith(source, release?)` — NO-OP

EDM pump effect. Sugar for `.duckWith()` with `amount: 0.8, attack: 0.001`.

```ts
pumpWith(source: string | ChainablePart, release?: number): T
```

> ⚠️ Same as `duckWith` — not yet hydrated.

---

#### `.swellWith(source)` — NO-OP

Rise on trigger — reverse sidechain.

```ts
swellWith(source: string | ChainablePart): T
```

> ⚠️ Not yet hydrated.

---

#### `.sidechain(source, opts?)` — NO-OP

Full sidechain control — escape hatch with all options.

```ts
sidechain(
  source: string | ChainablePart,
  opts?: Partial<{ amount: number; attack: number; release: number; mode: 'duck' | 'reverse' }>
): T
```

> ⚠️ Not yet hydrated.

---

### Tone group

#### `.filter(freq, q?)` — WIRED

Lowpass filter — cutoff frequency in Hz, optional resonance Q.

```ts
filter(freq: number, q?: number): T
```

> **Note:** On `Bass303Part`, `.filter()` is overridden to set `props.cutoff` and `props.resonance` directly. For Bass303, prefer `.cutoff()` + `.resonance()`.

```ts
SubSynth('C2').filter(600, 1.2)
Synth('sawtooth').filter(800)
```

---

#### `.eq(lo, mid, hi)` — NO-OP

3-band EQ in dB. Low shelf at 320 Hz, peaking mid at 1 kHz, high shelf at 3.2 kHz.

```ts
eq(lo: number, mid: number, hi: number): T
```

> ⚠️ `_eq` is set but not yet hydrated. Use the `EQ` effect descriptor instead:
> ```ts
> Synth().reverb(0.3).delay(0.375)  // then add EQ effect descriptor via effects array
> ```

---

#### `.bit(bits)` — WIRED

Bit crusher — reduce bit depth for vintage sampler / lo-fi sound.

```ts
bit(bits: number): T   // 4–16
```

Appends a `bitcrusher` `EffectDescriptor` to `_effects`. Fully hydrated.

```ts
Snare().bit(8).volume(0.7)
HiHat(8).bit(12)
```

---

#### `.saturate(amt)` — WIRED

Overdrive / saturation warmth via tanh soft-clip.

```ts
saturate(amt: number): T   // 0–1
```

Appends a `saturation` `EffectDescriptor` to `_effects`. Fully hydrated.

```ts
Bass303('A1').cutoff(600).saturate(0.4)
Kick808().saturate(0.2)
```

---

### Space group

#### `.pan(v)` — WIRED

Stereo position. `-1` = hard left, `0` = center, `1` = hard right.

```ts
pan(v: number): T   // -1 to 1
```

```ts
HiHat(8).pan(0.3)     // slightly right
Kick808().pan(-0.1)   // subtle left
```

---

#### `.widen(amt)` — WIRED

Stereo width via mid/side gain. `0` = mono, `1` = unity, `2` = extra wide.

```ts
widen(amt: number): T   // 0–2
```

Appends a `stereo-widener` `EffectDescriptor`.

```ts
Pad('C4').widen(1.8)
SubSynth('C2').unison(4).widen(1.5)
```

---

#### `.reverb(wet, opts?)` — WIRED

Add reverb. `wet` = dry/wet mix, `0–1`.

```ts
reverb(wet: number, opts?: Record<string, unknown>): T
```

Appends a `reverb` `EffectDescriptor`. Pass additional props in `opts` (e.g. `decay`).

```ts
Snare909().reverb(0.3)
Pad('C4').reverb(0.6, { decay: 4.0 })
```

---

#### `.delay(time, feedback?)` — WIRED

Add delay. `time` in seconds or note value string. `feedback = 0–1`.

```ts
delay(time: number | string, feedback?: number): T
```

Appends a `delay` `EffectDescriptor`. Sync to BPM: 120 BPM quarter note = `0.5s`, 8th note = `0.25s`, dotted 8th = `0.375s`.

```ts
Arp(['C4','E4','G4']).delay(0.375, 0.4)    // dotted 8th at 120 BPM
FMSynth('A3').delay('1/8d', 0.35)
```

---

#### `.chorus(depth?)` — WIRED

Chorus / ensemble detune. Thickens a signal by layering slightly-delayed copies.

```ts
chorus(depth?: number): T   // default 0.5
```

```ts
Synth('triangle').chorus(0.4)
```

---

#### `.flange(depth?)` — WIRED

Flanger sweep. Comb-filter sweeps with metallic character.

```ts
flange(depth?: number): T   // default 0.5
```

---

### Routing group

#### `.send(bus, amount?)` — NO-OP

Route to a named effect bus.

```ts
send(bus: string, amount?: number): T   // amount default 1
```

> ⚠️ `_sends` is set but bus routing is not yet implemented in the engine.

---

#### `.mute()` — NO-OP (DSL), GUI (runtime)

Silence this part.

```ts
mute(): T
```

> ⚠️ `_mute` from the DSL is not read by `partToInstrumentDescriptor`. Runtime muting via the GUI mixer (`engine:patch` IPC) works correctly. DSL `.mute()` is currently a no-op.

---

#### `.solo()` — NO-OP

Solo this part (silence all others).

```ts
solo(): T
```

> ⚠️ Not yet hydrated.

---

#### `.chokeGroup(name)` — WIRED (hihat)

Assign to a choke group — hits from any part in the same group cut each other off.

```ts
chokeGroup(name: string): T
```

Currently wired for hi-hat instruments. Use for open/closed hat mutual muting.

```ts
Hihat808(8).chokeGroup('hat').volume(0.5)
Hihat808().hits(15).chokeGroup('hat').volume(0.4)   // open hat cuts closed
```

---

#### `.layer(...parts)` — NO-OP

Layer additional parts under this one — play all simultaneously.

```ts
layer(...parts: ChainablePart[]): T
```

> ⚠️ `_layers` is set but not yet hydrated.

---

### Modulation group

All modulation methods append to `_modulations`. The modulation system is **not yet hydrated** — all methods below are NO-OP at runtime.

> ⚠️ The `_modulations` field is not read by `partToInstrumentDescriptor`. These will be wired when the modulation engine phase lands.

#### `.tremolo(rate, depth?)` — NO-OP

LFO on volume. Rate in Hz, depth `0–1`. Classic volume wobble.

```ts
tremolo(rate: number, depth?: number): T   // default depth 0.8
```

---

#### `.vibrato(rate, depth?)` — NO-OP

Sine on pitch. Rate in Hz, depth in Hz. Classic pitch vibrato.

```ts
vibrato(rate: number, depth?: number): T   // default depth 8
```

---

#### `.wobble(rate, depth?)` — NO-OP

LFO on filter cutoff. Rate in Hz. The dubstep/acid wobble effect.

```ts
wobble(rate: number, depth?: number): T   // default depth 1
```

```ts
Bass303('A1').cutoff(600).wobble(0.5)   // slow acid wobble — NO-OP until wired
```

---

#### `.autopan(rate, depth?)` — NO-OP

LFO on pan — stereo left/right movement.

```ts
autopan(rate: number, depth?: number): T   // default depth 0.8
```

---

#### `.flutter(rate?)` — NO-OP

Fast LFO on volume — flute flutter, organ tremolo.

```ts
flutter(rate?: number): T   // default rate 12 Hz
```

---

#### `.breathe(rate?)` — NO-OP

Slow LFO on volume — pad breathing.

```ts
breathe(rate?: number): T   // default rate 0.3 Hz
```

---

#### `.drift(amt?)` — NO-OP

Ornstein-Uhlenbeck process on pitch — analog warmth drift.

```ts
drift(amt?: number): T   // default amt 0.3
```

---

#### `.swell(bars)` — NO-OP

Ramp on volume — build over `bars` bars from silence.

```ts
swell(bars: number): T
```

---

#### `.modulate(param, source)` — NO-OP

Power escape hatch — modulate any parameter with any modulation source.

```ts
modulate(param: string, source: ModulationDescriptor): T
```

Import `ModulationDescriptor` sources (`lfo`, `sine`, `ramp`, `ou`, `lorenz`, `logistic`) from `@score/dsl`.

---

### Meta group

#### `.seed(n)` — WIRED

Per-part stochastic seed — overrides the song-level seed for this part. Affects `degrade`, `stepProb`, `humanize`, and `every`.

```ts
seed(n: number): T
```

```ts
HiHat(8).degrade(0.3).seed(42)    // deterministic drops, same every run
```

---

#### `.name(label)` — GUI

Human-readable label — shown in GUI mixer strip and used by `codePatcher` for track correlation. No audio effect.

```ts
name(label: string): T
```

```ts
Kick808().name('kick').volume(0.9)
```

---

#### `.model(variant)` — WIRED

Model variant — percussion instruments only. Selects the synthesis implementation.

```ts
model(variant: string): T   // '808' | '909' | 'hard' | 'generic'
```

Used internally by `Kick808()` / `Kick909()` / `Hihat808()` / `Snare909()` aliases.

```ts
Kick().model('808')    // same as Kick808()
HiHat().model('808')   // same as Hihat808()
```

---

### Visual group

Visual methods have no audio effect. `@score/visuals` reads these from `TrackVisualState` and merges them over the default instrument colour map.

#### `.visual(override)` — GUI

Set visual override fields in one call. Merges with any existing `_visual`.

```ts
visual(override: { color?: string; glyph?: string; label?: string; opacity?: number }): T
```

---

#### `.color(hex)` — GUI

Set track colour (CSS hex). Shown in Monaco arcs, PunchcardGrid, PerformanceCanvas.

```ts
color(hex: string): T
```

```ts
Kick808().color('#ff4444')
Pad('C4').color('#44aaff')
```

---

#### `.glyph(kind)` — GUI

Set the inline glyph kind for the Monaco editor margin.

```ts
glyph(kind: string): T
```

---

#### `.label(text)` — GUI

Set the display label. Defaults to the track variable name.

```ts
label(text: string): T
```

---

## Effects (chain)

These effects are appended via chain methods (`.reverb()`, `.delay()`, `.bit()`, etc.) or passed as `EffectDescriptor` objects in the legacy descriptor API.

All are WIRED — the engine hydrates every effect in `_effects`.

| Chain method | Effect type | Key props |
|---|---|---|
| `.reverb(wet, opts?)` | `reverb` | `wet`, `decay`, `preDelay` |
| `.delay(time, feedback?)` | `delay` | `time`, `feedback`, `mix` |
| `.chorus(depth?)` | `chorus` | `depth`, `voices`, `mix` |
| `.flange(depth?)` | `flanger` | `depth`, `feedback`, `mix` |
| `.widen(amt)` | `stereo-widener` | `width` (0–2) |
| `.bit(bits)` | `bitcrusher` | `bits` (4–16), `mix` |
| `.saturate(amt)` | `saturation` | `drive` (0–1), `mix` |

### Full effect descriptors (legacy descriptor API only)

Import from `@score/effects`. These are also accepted by the chain API's `_effects` array.

| Descriptor | Key props |
|---|---|
| `Delay({ time, feedback, mix })` | `time` (s or note string), `feedback` 0–1, `mix` 0–1 |
| `Reverb({ decay, wet, preDelay })` | `decay` (s), `wet` 0–1 |
| `Filter({ type, frequency, Q })` | `type`: `'lowpass'`/`'highpass'`/`'bandpass'`/`'notch'`, `frequency` (Hz), `Q` |
| `Compressor({ threshold, ratio, attack, release })` | All standard DRC parameters |
| `EQ({ low, mid, high })` | dB gain per band |
| `Distortion({ amount, mode, mix })` | `mode`: `'soft'`/`'hard'`/`'foldback'` |
| `Limiter({ ceiling, lookahead })` | `ceiling` (dBFS), `lookahead` (s) |
| `BitCrusher({ bits, mix })` | `bits` 4–16 |
| `Chorus({ voices, depth, mix })` | `voices`, `depth` (ms), `mix` 0–1 |
| `Phaser({ stages, feedback })` | `stages`, `feedback` 0–1 |
| `Flanger({ depth, feedback, mix })` | `depth`, `feedback`, `mix` |
| `StereoWidener({ width })` | `width` 0–2 |
| `Gate({ threshold, attack, release })` | Standard noise gate parameters |
| `Saturation({ drive, mix })` | `drive` 0–1, `mix` 0–1 |
| `AutoPan({ rate, depth, shape })` | `rate` (Hz), `depth` 0–1, `shape`: `'sine'`/`'triangle'`/`'square'` |

---

## Modulation sources

Import from `@score/dsl`.

> ⚠️ All modulation sources are defined and exported but the engine modulation system is not yet wired. These are authoring-ready — `.modulate()`, `.wobble()`, `.tremolo()` etc. are NO-OP at runtime.

| Factory | Signature | Description |
|---|---|---|
| `lfo(rate, depth?)` | `(Hz, 0–1) => ModulationDescriptor` | Sinusoidal LFO |
| `sine(rate, depth?)` | `(Hz, Hz) => ModulationDescriptor` | Sine on pitch (vibrato) |
| `ramp(bars)` | `(number) => ModulationDescriptor` | Linear ramp over n bars |
| `ou(amt?)` | `(0–1) => ModulationDescriptor` | Ornstein-Uhlenbeck process (analog drift) |
| `lorenz(scale?)` | `(number) => ModulationDescriptor` | Lorenz chaotic attractor |
| `logistic(r?)` | `(number) => ModulationDescriptor` | Logistic map (bifurcation / chaos) |

```ts
import { lfo, ou } from '@score/dsl'

// These compile but are audio-silent until the modulation engine lands
Bass303('A1').modulate('filter', lfo(0.5, 0.8))
Pad('C4').modulate('pitch', ou(0.2))
```

---

## `createPart(init)` — custom instruments

Create a `ChainablePart` from scratch. Only `instrumentType` is required.

```ts
import { createPart } from '@score/dsl'

const ReeseBass = (pitch?: string) =>
  createPart({ instrumentType: 'reese-bass', _notes: pitch ? [pitch] : [] })
    .volume(0.7)

Song({ bpm: 140, tracks: [ReeseBass('C2').wobble(0.5)] })
```

---

## `defineInstrument(typeName, factory)` — reusable instruments

Wrap a factory as a named, reusable instrument. The output is fully compatible with `Song`, `Group`, and all chain methods.

```ts
import { defineInstrument, createPart } from '@score/dsl'

const AnalogBass = defineInstrument('analog-bass', (pitch?: string) =>
  createPart({ instrumentType: 'sub-synth', _notes: pitch ? [pitch] : [] })
    .filter(500, 1.5)
    .volume(0.8)
)

Song({ bpm: 128, tracks: [AnalogBass('A1').wobble(0.3).reverb(0.1)] })
```

---

## Gap summary

Methods currently in the DSL that are NO-OP at runtime:

| Group | NO-OP methods |
|---|---|
| Pattern | `.stutter()` |
| Amplitude | `.duckWith()`, `.pumpWith()`, `.swellWith()`, `.sidechain()` |
| Tone | `.eq()` |
| Routing | `.send()`, `.mute()` (DSL only), `.solo()`, `.layer()` |
| Modulation | ALL — `.tremolo()`, `.vibrato()`, `.wobble()`, `.autopan()`, `.flutter()`, `.breathe()`, `.drift()`, `.swell()`, `.modulate()` |

See [`docs/design/dsl-audit.md`](design/dsl-audit.md) for full audit detail including per-field engine hydration trace.
