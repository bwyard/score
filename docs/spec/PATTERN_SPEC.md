# @score/pattern — Functional Pattern System Spec (Phase 9c)

Score's pattern system is inspired by TidalCycles but prioritises human
readability over terseness. A Score pattern should sound like it reads.

---

## Design Goal

TidalCycles is the academic inspiration — Score is the musician's implementation.

```ts
// TidalCycles style (terse, powerful, cryptic to newcomers)
d1 $ every 4 (fast 2) $ sound "bd sd hh cp"

// Score style (same result — reads like a production note)
const kick = Kick({ pattern: every(4, fast(2), beat(1, 0, 1, 0)) })
```

---

## Implemented ✅ (Phase 9c)

### Core transforms — `@score/pattern`

```ts
euclidean(hits, steps, rotation?)  // Bjorklund rhythm
fast(n, pattern)                   // multiply speed by n
slow(n, pattern)                   // divide speed by n
rev(pattern)                       // reverse
shift(n, pattern)                  // rotate by n steps
degrade(probability, pattern)      // randomly drop hits (0 = never, 1 = always)
every(n, fn, pattern)              // apply fn every n bars
scaleNotes(scale, root, count)     // n notes from scale starting at root
chordNotes(chord)                  // chord voicing as note array
resolvePattern(input, steps, bar?) // resolve PatternInput → T[]
```

### Scale library — 80+ scales

Major, Natural/Harmonic/Melodic Minor, all church modes, Pentatonic (major/minor/blues),
Whole tone, Diminished, Chromatic, Phrygian Dominant, Lydian Dominant, Altered, and more.

```ts
scaleNotes('Dorian', 'D3', 8)       // → ['D3','E3','F3','G3','A3','B3','C4','D4']
scaleNotes('PhrygianDominant', 'E3', 6)
```

---

## To Add (Phase 9c remaining)

### `stack(...patterns)` — polyphony combinator

Layer multiple patterns into one array. Critical for TidalCycles parity.

```ts
// Stack two patterns — result is union of all hits
const combined = stack(
  [1, 0, 0, 0,  1, 0, 0, 0],   // kick pattern
  [0, 0, 1, 0,  0, 0, 1, 0],   // snare pattern
)
// → [1, 0, 1, 0,  1, 0, 1, 0]
```

For melodic patterns (note arrays), `stack` returns a flat merged sequence sorted by step.

### `beat(...steps)` — readable shorthand

Named-step shorthand for pattern arrays. Makes patterns read like drum notation.

```ts
beat(1, 0, 0, 0)          // → [1, 0, 0, 0]
beat(1, 0, 1, 0, 1, 0)    // → [1, 0, 1, 0, 1, 0]
```

Purely cosmetic — identical to an array literal. Exists so code reads like music.

### `humanize(amount, pattern)` — Gaussian variation

Add timing and velocity variation to remove mechanical precision.

```ts
humanize(0,   pattern)   // no change — mechanical
humanize(0.3, pattern)   // subtle — like a tight drummer
humanize(0.7, pattern)   // loose — like a live drummer rushing
humanize(1,   pattern)   // very loose — almost random
```

Internally adds Gaussian-distributed timing offsets and velocity scaling.
Returns `PatternInput` with step offsets baked in.

---

## Future (Post Phase 9c)

### Mini-notation adapter (migration bridge)

`mini()` accepts Strudel/TidalCycles mini-notation strings and returns Score PatternInput.
This is a **migration bridge**, not a primary interface.

```ts
const pat = mini("bd sd hh cp")      // → [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0] approx
const pat = mini("bd(3,8)")          // euclidean via mini-notation
```

The Score native syntax is always preferred. `mini()` is for migrating existing patterns.

### Extended scale list
Ragas, Balinese pelog/slendro, Messiaen modes of limited transposition, microtonal EDO grids.
Deferred — post-v1.0 or Phase 9c+.

---

## Core Type — PatternInput

```ts
type PatternInput<T = number> = T[] | Pattern<T>
type Pattern<T> = (step: number, bar: number) => T

// Sequencer resolves either format:
const resolvePattern = <T>(input: PatternInput<T>, steps: number, bar = 0): T[] =>
  Array.isArray(input)
    ? input
    : Array.from({ length: steps }, (_, s) => input(s, bar))
```

Both formats are permanent — arrays never removed.

---

## Backward Compatibility — Non-Negotiable

```ts
// Both of these always work — the array format is never deprecated
const kick = Kick({ pattern: [1, 0, 0, 0, 1, 0, 0, 0] })
const kick = Kick({ pattern: every(4, fast(2), beat(1, 0, 0, 0)) })
```

---

## Live Coding Visualisation (Phase 11b)

Data is available headlessly from the pattern system for terminal/REPL output:

- **Punchcard view** — grid showing active steps per track (like Strudel)
- **Piano roll** — time-scrolling note display for melodic patterns
- **Pattern graph** — visual DAG of transformations (fast, every, stack, etc.)

All visualisations are driven by the pattern system and transport position.
GUI renders them (Phase 13), but headless data is available from Phase 11b.

---

## Impact on Existing Packages

- `@score/core`, `@score/effects`, `@score/mixer` — no changes
- `@score/components` — type widening only (non-breaking)
- `@score/sequencer` — PatternInput type union already integrated
- Existing song files and tests — no changes ever
