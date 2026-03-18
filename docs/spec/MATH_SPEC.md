# @score/math — Mathematical Framework Spec (Phase 9b + 9f)

Score's mathematical depth is a primary differentiator. Built with
formal mathematical correctness — not approximations.

---

## Phase 9b — Implemented ✅

### What's built
- `fibonacci(n)`, `padovan(n)`, `tribonacci(n)` — recurrence sequences
- `fibonacciRhythm(n, steps)` — map sequence to binary rhythm
- `entropy(pattern)` — Shannon entropy (0–1). Musical patterns: 0.6–0.95
- `isMusical(pattern)` — `entropy >= 0.6 && entropy <= 0.95`
- `density(pattern)` — fraction of non-zero steps
- `lcm(a, b)` — least common multiple (for polyrhythm grids)
- `polyrhythm(a, b)` — boolean grid of two rhythms aligned to LCM
- `patternOr`, `patternAnd`, `patternXor`, `patternNot` — boolean algebra on patterns
- `tile(pattern, length)` — extend/tile a pattern to target length

23 tests passing.

### Still to add (Phase 9b)
- `circleOfFifths(n)` — `['C','G','D','A','E','B','F#','C#','G#','D#','A#','F'][n % 12]`

---

## Phase 9f — Extended Math ⬜

### Tuning Systems (`@score/math/harmony/tuning.ts`)

Microtonal and historical tuning systems as frequency multiplier tables.
Each returns `Record<string, number>` mapping note name to Hz multiplier from C4.

```ts
just()          // just intonation — pure ratios (5:4 major third)
pythagorean()   // Pythagorean — pure fifths (3:2), irrational thirds
meantone()      // quarter-comma meantone — Renaissance standard
edo19()         // 19-tone equal temperament — good minor thirds
edo31()         // 31-tone equal temperament — best just approximation
```

Usage in song files:
```js
import { just } from '@score/math'
const synth = Synth({ tuning: just(), note: 'E4' })
```

### Circle of Fifths (`@score/math/harmony/circle.ts`)

```ts
circleOfFifths(n: number): string
// Returns note at position n (0-indexed, mod 12)
// circleOfFifths(0) → 'C', circleOfFifths(1) → 'G', circleOfFifths(7) → 'C#'
```

### Chaos Theory (`@score/math/chaos/`)

**Lorenz Attractor** (`lorenz.ts`):
```ts
type LorenzConfig = { sigma?: number; rho?: number; beta?: number; dt?: number }
lorenz(config: LorenzConfig): {
  step(): [number, number, number]       // one RK4 integration step → [x, y, z]
  toSequence(options: { scale: string; length: number }): string[]
}
```
Default params: sigma=10, rho=28, beta=8/3 (classic chaotic regime).
`toSequence` maps x-coordinate (bounded to scale) to note names.

**Logistic Map** (`logistic.ts`):
```ts
logistic(r: number, x0?: number): {
  step(): number                          // next value (0–1)
  toPattern(steps: number): number[]      // binary pattern via threshold 0.5
}
// r < 3.57 = periodic, r > 3.57 = chaotic
```

**Lyapunov Exponent** (`lyapunov.ts`):
```ts
lyapunov(series: number[]): number
// Positive → chaotic, negative → stable, 0 → edge of chaos
```

### L-System Rewriting (`@score/math/lsystem/`)

```ts
type LSystemConfig = {
  axiom: string
  rules: Record<string, string>
  iterations: number
}

lsystem(config: LSystemConfig): string
lsystemToPattern(result: string, mapping: Record<string, number>): number[]
```

Example — Fibonacci L-System:
```ts
const seq = lsystem({ axiom: 'A', rules: { A: 'AB', B: 'A' }, iterations: 6 })
const pat = lsystemToPattern(seq, { A: 1, B: 0 })
// → [1,0,1,1,0,1,0,1,1,0,1,1,0]  self-similar Fibonacci rhythm
```

### Wolfram Cellular Automata (`@score/math/automata/`)

```ts
wolfram(rule: number, seed: number[], steps: number): number[][]
wolframToPattern(grid: number[][], row: number): number[]
```

Standard rules: 30 (chaotic), 90 (fractal — Sierpinski), 110 (universal computation).

### Generic RK4 Integrator (`@score/math/rk4.ts`)

```ts
type ODE = (t: number, y: number[]) => number[]
rk4(f: ODE, y0: number[], t0: number, dt: number): number[]
rk4Trajectory(f: ODE, y0: number[], t0: number, dt: number, steps: number): number[][]
```

Lorenz and OUProcess both use `rk4` internally.

### Ornstein-Uhlenbeck Process (`@score/math/stochastic/ouprocess.ts`)

Mean-reverting stochastic process for gradual automation drift.

```ts
type OUConfig = { theta?: number; mu?: number; sigma?: number; dt?: number }
ouprocess(config: OUConfig): {
  step(): number               // next value (bounded near mu)
  current(): number            // current value
  reset(): void
}
// theta = reversion speed (0.01 = slow drift, 1 = fast)
// mu    = target mean (default 0)
// sigma = noise amplitude (0.01 = subtle, 0.5 = wild)
```

Used internally by `drift(pattern, rate)` in Phase 9 DSL.

---

## Information Theory

Shannon entropy formula:
```
H(X) = -Σ p(x) * log₂(p(x))
```

Normalised 0–1 for binary patterns. Rule of thumb:
```
entropy < 0.3  → too repetitive (four-on-the-floor kick without variation)
entropy 0.6–0.95 → musical (interesting variation, recognisable structure)
entropy > 0.95  → too random (white noise — no groove)
```

Entropy validation before committing a pattern:
```js
import { entropy, isMusical } from '@score/math'
const pat = lorenz({ ... }).toPattern(16)
if (!isMusical(pat)) console.warn('Pattern entropy out of musical range')
```

---

## Discrete Mathematics

### Euclidean Rhythms
Already in @score/pattern — `euclidean(hits, steps, rotation?)`.
Canonical Bjorklund form via ceiling-division formula:
`pos(i) = floor((i * steps + hits - 1) / hits)`
First hit always at position 0.

### Boolean Pattern Algebra
```ts
patternOr(a, b)   // union — hit if either has a hit
patternAnd(a, b)  // intersection — hit only if both have a hit
patternXor(a, b)  // symmetric difference — hit if exactly one has a hit
patternNot(a)     // complement — flip 0s and 1s
```

### Modular Arithmetic (CRT)
Chinese Remainder Theorem for polyrhythm alignment. Used internally by `polyrhythm()`.
Available for advanced use cases via `crt(remainders, moduli)` if exposed post-v1.0.
