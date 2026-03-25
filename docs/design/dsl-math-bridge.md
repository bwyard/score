# DSL–Math Bridge Design

**Date:** 2026-03-24
**Branch:** feat/dsl-chain-audit
**Author:** W3 audit pass

Answers the open question from the DSL chain audit:
> Should `@score/math` expose a DSL adapter (e.g. `drift()`, `lorenz()`, `scatter()` as chain modifiers)? Where does that belong — `@score/dsl` or a new `@score/math-dsl`?

---

## Answer

**Yes — add `packages/dsl/src/math.ts` as a thin adapter layer inside `@score/dsl`.**

Do NOT create a separate `@score/math-dsl` package. The adapter lives in `@score/dsl` and re-exports from `@score/math` with musical ergonomics.

Do NOT straight re-export `@score/math` into `@score/dsl/index.ts`. Raw math functions have argument orders and names designed for generality, not live coding. The adapter adapts them.

---

## What the adapter does

Four jobs:

1. **Musical naming aliases** — rename functions to read as music at the call site
2. **Argument order** — musical intent first, math parameter second
3. **Curried transforms** — wrap functions so they compose with `.apply()` naturally
4. **Selective re-export** — only expose what belongs in the song authoring layer

---

## `packages/dsl/src/math.ts` — design

```ts
// dsl/src/math.ts — DSL adapter for @score/math
//
// @score/math is the raw math layer — use it directly for anything not listed here.
// This file adapts math functions to be ergonomic at the song authoring call site:
//   - Musical naming (fibonacciRhythm → fibonacci)
//   - Argument order (musical intent first)
//   - Curried .apply() wrappers
//
// Thesis: @score/math stays pure math. This adapter stays pure DSL sugar.

import {
  fibonacciRhythm, drunk, circleOfFifths,
  polyrhythm, tile, entropy,
  normalize, clip, range, interp, smooth,
  createLorenz, logisticMap, createOUProcess,
  lsystem, lsystemToPattern, wolframCA,
} from '@score/math'
import type { PatternInput } from '@score/pattern'

// ── Rhythm generators ──────────────────────────────────────────────────────────

/**
 * Fibonacci rhythm — n steps distributed via Fibonacci spacing.
 * Alias for `fibonacciRhythm(n)` with musical arg name.
 *
 * @example
 * ```ts
 * HiHat().apply(fibonacci(8))     // 8-step Fibonacci spacing
 * HiHat().apply(fibonacci(13))    // 13-step Fibonacci hi-hat
 * ```
 */
export const fibonacci = (n: number): ReturnType<typeof fibonacciRhythm> =>
  fibonacciRhythm(n)

/**
 * Drunk walk pattern — steps that wander ±stepSize from each position.
 * Adapted: length first (musical), stepSize second (math detail).
 *
 * @example
 * ```ts
 * Bass303('A2').apply(drunkWalk(16))         // 16-step drunk walk, default step 1
 * Synth().apply(drunkWalk(16, 2))            // wider steps
 * ```
 */
export const drunkWalk = (length: number, stepSize = 1): ReturnType<typeof drunk> =>
  drunk(length, stepSize)

/**
 * Polyrhythm combinator — OR two patterns of different lengths.
 * Gives the union of hits when the two cycles align.
 *
 * @example
 * ```ts
 * Kick().apply(poly([1,0,0,0], [1,0,0]))  // 4-beat + 3-beat polyrhythm
 * ```
 */
export const poly = (a: number[], b: number[]): number[] =>
  polyrhythm(a, b)

/**
 * Tile a short pattern to fill `length` steps.
 * Useful for building variations from a seed cell.
 *
 * @example
 * ```ts
 * HiHat().apply(fill([1,0,1], 16))  // tile [1,0,1] to 16 steps
 * ```
 */
export const fill = (cell: number[], length: number): number[] =>
  tile(cell, length)

// ── Curried .apply() transforms ───────────────────────────────────────────────
//
// These return (pattern: number[]) => number[] so they compose directly with
// ChainablePart.apply(). Call as: Kick(4).apply(clamp(0)(1)).
//
// Note: .apply() is currently unhydrated in the engine (see dsl-audit.md).
// These are designed for when engine hydration lands — they are ready.

/**
 * Clamp pattern values to [lo, hi].
 * Curried: `clamp(lo)(hi)(pattern)` — compose with `.apply()`.
 *
 * @example
 * ```ts
 * Kick(4).apply(clamp(0)(1))
 * ```
 */
export const clamp =
  (lo: number) =>
  (hi: number) =>
  (pattern: number[]): number[] =>
    pattern.map(v => clip(v, lo, hi))

/**
 * Normalise pattern values to [0, 1].
 *
 * @example
 * ```ts
 * Synth().apply(norm)
 * ```
 */
export const norm = (pattern: number[]): number[] =>
  normalize(pattern)

/**
 * Rescale pattern values to [lo, hi].
 *
 * @example
 * ```ts
 * Kick(4).apply(rescale(0.2)(0.8))
 * ```
 */
export const rescale =
  (lo: number) =>
  (hi: number) =>
  (pattern: number[]): number[] =>
    pattern.map(v => interp(v, lo, hi))

/**
 * Smooth pattern values with a sliding average of `window` steps.
 *
 * @example
 * ```ts
 * Pad('A3').apply(smoothed(4))
 * ```
 */
export const smoothed =
  (window: number) =>
  (pattern: number[]): number[] =>
    smooth(pattern, window)

// ── Chaos generators ──────────────────────────────────────────────────────────
//
// These return PatternInput-compatible generators. Use directly with .apply()
// (when hydrated) or pass as step functions to createStepSequencer.
//
// These do NOT replace the modulation source API (lfo/lorenz in modulation.ts).
// Use modulation sources for continuous DSP-level modulation.
// Use these for discrete step-level pattern generation.

/**
 * Lorenz attractor step generator — returns a (length: number) => number[] pattern.
 * Produces deterministic chaos that never exactly repeats.
 *
 * @param axis - Which axis to use: 'x' | 'y' | 'z'. Default 'x'.
 * @param speed - Traversal speed through attractor. Default 0.01.
 *
 * @example
 * ```ts
 * HiHat(8).apply(lorenzPattern())          // chaotic hi-hat pattern
 * Kick().apply(lorenzPattern('z', 0.02))   // z-axis, faster traversal
 * ```
 */
export const lorenzPattern =
  (axis: 'x' | 'y' | 'z' = 'x', speed = 0.01) =>
  (length: number): number[] => {
    const lorenz = createLorenz({ speed })
    return Array.from({ length }, () => {
      const state = lorenz.next()
      const v = state[axis]
      return Math.abs(v) > 14 ? 1 : 0  // threshold: hit when attractor is in outer lobe
    })
  }

/**
 * Logistic map pattern generator — edge-of-chaos sequence.
 * At `r` near 4, produces unpredictable but bounded patterns.
 *
 * @example
 * ```ts
 * HiHat().apply(logistic())                 // default r=3.9
 * Perc().apply(logistic(3.57))              // onset of chaos
 * ```
 */
export const logistic =
  (r = 3.9, seed = 0.5) =>
  (length: number): number[] =>
    logisticMap(r, seed, length).map(v => (v > 0.5 ? 1 : 0))

/**
 * L-system pattern generator — grammar-based self-similar rhythm.
 * Good for fractal drumming and procedural structure.
 *
 * @example
 * ```ts
 * const rules = { A: 'AB', B: 'A' }
 * Snare().apply(lsystemPattern('A', rules, 5))  // 5 iterations
 * ```
 */
export const lsystemPattern =
  (axiom: string, rules: Record<string, string>, iterations = 4) =>
  (_length: number): number[] =>
    lsystemToPattern(lsystem(axiom, rules, iterations))

// ── Harmony utilities ─────────────────────────────────────────────────────────

/**
 * Circle of fifths lookup — interval n from C in the circle of fifths.
 * Re-exported as-is. Already musical naming in @score/math.
 *
 * @example
 * ```ts
 * const root = circleOf(2)  // 'D' (2 steps from C)
 * ```
 */
export { circleOfFifths as circleOf } from '@score/math'

// ── Pattern analysis ──────────────────────────────────────────────────────────

/**
 * Pattern density — fraction of steps that are hits (0–1).
 * Useful in `.apply()` guards: if (density(p) < 0.3) return sparsify(p).
 *
 * @example
 * ```ts
 * const d = density([1,0,0,0,1,0,0,0])  // → 0.25
 * ```
 */
export { entropy, density } from '@score/math'
```

---

## What stays in `@score/math`

`@score/math` is the escape hatch for song authors who need raw math.

Never adapt these — expose as-is from `@score/math`:

- `createLorenz`, `createOUProcess` — full stateful system access
- `rk4` — Runge-Kutta numerical integration
- `just`, `pythagorean`, `meantone`, `edo19`, `edo31` — tuning systems
- `markov` — Markov chain (complex interface, not ready for DSL sugar yet)
- `wolframCA` — Wolfram cellular automaton (same)
- `lyapunovExponent` — analysis tool, not live coding

---

## What does NOT belong in a DSL adapter

The modulation sources (`lfo`, `sine`, `ramp`, `lorenz`, `ou`, `logistic`) are in `dsl/src/modulation.ts`, not `@score/math`. They are DSP-level descriptors for continuous parameter modulation. They belong in the DSL modulation system and should be exported from `@score/dsl/src/index.ts` directly.

This is a separate fix from the math adapter — see the export gap noted in `dsl-audit.md`.

---

## Where does the adapter belong

`@score/dsl` — not a new package.

Reason: Song authors import from `@score/dsl`. Adding a new `@score/math-dsl` package creates an import split that hurts ergonomics. The adapter is DSL sugar, not new math. It stays coupled to the DSL.

```ts
// Song file (correct — single import)
import { Kick, HiHat, Song, fibonacci, drunkWalk, lorenzPattern } from '@score/dsl'
```

vs.

```ts
// Song file (wrong — two imports for one authoring layer)
import { Kick, HiHat, Song } from '@score/dsl'
import { fibonacci, drunkWalk } from '@score/math-dsl'  // ← package sprawl
```

---

## Index exports to add

When `packages/dsl/src/math.ts` is created, add to `packages/dsl/src/index.ts`:

```ts
export {
  fibonacci, drunkWalk, poly, fill,
  clamp, norm, rescale, smoothed,
  lorenzPattern, logistic, lsystemPattern,
  circleOf,
  entropy, density,
} from './math.js'
```

And for modulation sources (separate fix, same PR opportunity):

```ts
export { lfo, sine, ramp, lorenz, ou, logistic } from './modulation.js'
export type { ModulationDescriptor } from './modulation.js'
```

---

## Implementation note: `.apply()` dependency

The curried transform functions (`clamp`, `norm`, `rescale`, `smoothed`) are designed for `.apply()`. As of this audit, `.apply()` is unhydrated in the engine (`_applyFn` not passed to `partToInstrumentDescriptor`).

The adapter can be written now — it is pure data construction. The engine hydration of `_applyFn` is a separate Phase 13 task. Once hydrated, all `.apply(clamp(0)(1))` and `.apply(fibonacci(8))` calls will work without changes to the adapter.

See `dsl-audit.md` for the full list of unhydrated fields.

---

## Naming decision: `drift` vs `drunkWalk`

`@score/dsl/src/modifiers.ts` already exports a `drift(center, sigma, theta)` function — this is a note-pitch drift via OU process, returning a `PatternFn<string>`.

The math adapter's `drunkWalk(length, stepSize)` is different — it generates a numeric pattern array.

These are different things. `drift` stays in `modifiers.ts`. `drunkWalk` goes in `math.ts`. No naming conflict.

`@score/math`'s raw `drunk(length, stepSize)` is the underlying function. The adapter renames it `drunkWalk` to distinguish it from the pitch-drift `drift` in the DSL.
