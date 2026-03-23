# ADR 014 — Fluent DSL Chain API

**Date:** 2026-03-23
**Status:** Accepted
**Deciders:** Project owner

---

## Context

The current `@score/dsl` API uses a props-object style:

```ts
const kick = Kick({ model: '808', pattern: euclidean(4, 16), volume: 0.8 })
const bass = Bass303({ note: 'C2', pattern: [1,0,0,0], filter: { frequency: 600, Q: 0.8 } })
export default Song({ bpm: 128, tracks: [kick, bass] })
```

This is valid TypeScript but it does not read as music. It reads as config. The goal of Score is for math to read as music — the DSL is the primary authoring surface and must feel natural to performers, not just programmers.

Additionally, the GUI (Score Studio) generates code from user interactions via `codePatcher`. When a user drags a volume slider, the generated code should be beautiful. With the props API, patching produces a deeply nested mutation that is hard to read and hard to correlate back to a single UI gesture.

---

## Decision

Replace the props-object DSL authoring API with an **immutable fluent chain API**.

Every DSL instrument factory returns a `ChainableTrack` — a plain object (no classes) with arrow-function methods, each returning a new `ChainableTrack`. The chain terminates when passed to `Song`.

```ts
export default Song(128, [
  Kick(4).volume(0.9).reverb(0.1),
  Snare(2).volume(0.7),
  HiHat(8).degrade(0.2),
  Bass303('C2').cutoff(400).resonance(0.9),
  Synth('saw', 'C3').notes(['C3','Eb3','G3','Bb3']).delay(0.375),
])
```

### First argument shorthand

| Instrument | First arg | Meaning |
|---|---|---|
| `Kick(n)` | step count | `euclidean(n, 16)` pattern |
| `Kick([...])` | explicit array | literal step pattern |
| `Kick('bd*4')` | mini-notation string | parsed via Layer 2 |
| `Synth(wave, pitch)` | wave + root note | oscillator type + frequency |
| `Bass303(pitch)` | root note | starting frequency |
| `Sample(path)` | file path | sample source |

Model variants are props on the first arg or a second options arg:

```ts
Kick(4)                        // default (808)
Kick(4, { model: '909' })      // 909 kick
Kick({ model: '909', decay: 0.8 }, 4)  // full props + step count
```

### Chain method set (all instruments)

**Pattern** — wraps current pattern with `@score/pattern` functions:

```ts
.speed(n)           // n>1 fast, n<1 slow, n<0 reverse. Unifies slow/fast/rev.
.slow(n)            // sugar: speed(1/n)
.fast(n)            // sugar: speed(n)
.rev()              // sugar: speed(-1)
.repeat(n)          // play pattern n times per cycle
.euclidean(h, s)    // replace pattern with euclidean(h, s)
.shift(n)           // rotate n steps — negative = shift left
.invert()           // flip 1s and 0s
.mask(pattern)      // mute steps where mask = 0
.stutter(n)         // repeat last hit n times
.palindrome()       // pattern + rev(pattern)
.degrade(p)         // drop hits at probability p
.humanize(amt)      // timing jitter
.swing(amount)      // swing offset on off-beats
.every(n, fn)       // apply fn every n cycles
.apply(fn)          // custom (pattern: number[]) => number[] — full math access
```

**Pitch / notes:**

```ts
.note(pitch)            // single pitch e.g. 'C3'
.notes([...])           // pitch sequence
.scale('minor', 'C3')   // constrain to scale
.pitch(semitones)       // transpose ±n semitones
.glide(time)            // portamento time between notes
```

**Amplitude / dynamics:**

```ts
.volume(v)          // output gain 0–1
.attack(s)          // ADSR attack shorthand
.decay(s)           // ADSR decay shorthand
.sustain(v)         // ADSR sustain level
.release(s)         // ADSR release shorthand
.sidechain(track)   // duck gain when track hits
```

**Tone / colour:**

```ts
.filter(freq, q?)   // lowpass cutoff + resonance
.eq(low, mid, high) // 3-band EQ (-1 to 1 each band)
.bit(bits)          // bit crusher (4–16 bits)
.saturate(amt)      // overdrive / warmth
```

**Space:**

```ts
.pan(v)             // stereo position -1 to 1
.widen(amt)         // stereo width 0–1
.reverb(wet, opts?) // reverb send
.delay(time, fb?)   // delay send (time in seconds or note value e.g. '1/8d')
.chorus(depth?)     // chorus / unison detune
.flange(depth?)     // flanger
```

**Routing:**

```ts
.send('busName', amt)  // send to named return bus
.mute()                // silence this track
.solo()                // solo this track
```

**Math / modulation:**

```ts
.modulate('filter', lfo(0.25))          // LFO on filter cutoff
.modulate('volume', lorenz({...}))      // chaos on volume
.modulate('pan', ou(0.3))               // stochastic brownian pan
.modulate('pitch', sine(0.1, 12))       // sine on pitch (vibrato)
```

**Instrument-specific extras chain naturally:**

```ts
Bass303('C2').cutoff(600).resonance(0.8).accent([0,0,0,0,1,0,0,0]).slide([...])
FMSynth('C3').ratio(2).modIndex(4).feedback(0.3)
Kick(4, { model: '909' }).decay(0.8).click(0.3)
SubSynth('C2').detune(8).unison(2).filter(800, 4).release(0.4)
```

### GUI palette notes

The full method set (~40 methods) maps 1:1 to GUI widgets but should be grouped and some combined due to panel space:
- ADSR methods → single ADSR widget (four knobs)
- `slow`/`fast`/`speed` → single Speed control
- `reverb`/`delay`/`chorus`/`flange` → Effects section with toggle + depth per effect
- `eq`/`filter`/`saturate`/`bit` → Tone section
- Less common methods → overflow / Edit menu → "Advanced"
- Every widget generates exactly one chain method call in the editor

### Song shorthand

```ts
Song(128, [...tracks])          // BPM + tracks shorthand
Song({ bpm: 128, tracks: [...] }) // full props — still valid
```

### Implementation rule

`ChainableTrack` is a **plain object** (zero classes). Methods are arrow functions. Every method call returns a new `ChainableTrack` via object spread — never mutation. This is the same functional constraint as the rest of Score.

```ts
// Implementation shape (simplified)
const createChain = (descriptor: TrackDescriptor): ChainableTrack => ({
  ...descriptor,
  slow: (n) => createChain({ ...descriptor, pattern: slow(n, descriptor.pattern) }),
  volume: (v) => createChain({ ...descriptor, volume: v }),
  reverb: (wet) => createChain({ ...descriptor, effects: [...(descriptor.effects ?? []), Reverb({ wet })] }),
  // ...
})
```

### GUI codegen correlation

This ADR is the implementation contract for GUI codegen. Each GUI interaction maps to exactly one chain method call:

| GUI gesture | Generated code |
|---|---|
| Drag volume slider to 0.8 | `.volume(0.8)` |
| Click reverb toggle, set wet to 0.3 | `.reverb(0.3)` |
| Change step count from 4 to 6 | `Kick(6)` (first arg) |
| Toggle step in punchcard | `.euclidean(...)` or explicit array |
| Change filter cutoff | `.filter(800)` |
| Pan instrument left | `.pan(-0.3)` |

The `codePatcher` functions in the GUI must be updated to generate and modify chain method calls rather than nested prop mutations.

---

## Implementation Plan

1. `packages/dsl/src/chain.ts` — `ChainableTrack` type + `createChain()` factory
2. Update each factory in `packages/dsl/src/` to return `ChainableTrack`
3. `packages/dsl/src/song.ts` — add `Song(bpm, tracks[])` shorthand overload
4. `packages/dsl/index.ts` — re-export all `@score/effects` and `@score/pattern` utilities (single import)
5. Update `packages/gui/src/main/index.ts` vm context — chain methods must be available in eval sandbox
6. Update `codePatcher` in GUI to generate chain syntax
7. Update STARTER template + all docs/examples
8. Add migration note: old props API is removed — this is a clean break before tester release

---

## Consequences

**Positive:**
- Song files read as music, not config
- GUI-generated code is beautiful and legible
- Single `@score/dsl` import covers instruments + effects + pattern utils
- Chain correlates 1:1 with GUI gestures — bidirectional sync is straightforward
- Beginner-accessible: `Kick(4).volume(0.8)` is learnable in 30 seconds
- Consistent with Layer 1 (natural language) and Layer 2 (mini-notation) — all return `ChainableTrack`

**Negative:**
- Breaking change — all existing song files and docs need updating
- `codePatcher` needs a rewrite for chain syntax
- Chain method types must be kept in sync with `@score/pattern` and `@score/effects`

**Mitigation:** Breaking change is acceptable because it happens before any tester release. Clean from day one.
