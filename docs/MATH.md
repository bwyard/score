# @score/math

Pure mathematical functions for pattern generation, chaos, stochastic processes, and harmony.

```js
import { /* see sections below */ } from '@score/math'
```

All functions are pure — same inputs always produce same outputs. No AudioContext, no side effects.

---

## Sequences

### `fibonacci(n)`
First `n` Fibonacci numbers.
```js
fibonacci(8)  // → [1, 1, 2, 3, 5, 8, 13, 21]
```

### `fibonacciRhythm(steps)`
Binary pattern with hits at Fibonacci positions (0, 1, 2, 3, 5, 8, 13, ...).
```js
fibonacciRhythm(16)  // → [1,1,1,1,0,1,0,0,1,0,0,0,0,1,0,0]
```

### `padovan(n)`
First `n` Padovan numbers: `P(n) = P(n-2) + P(n-3)`. Grows slower than Fibonacci.
```js
padovan(7)   // → [1, 1, 1, 2, 2, 3, 4]
```

### `tribonacci(n)`
First `n` Tribonacci numbers: `T(n) = T(n-1) + T(n-2) + T(n-3)`.
```js
tribonacci(7)  // → [0, 0, 1, 1, 2, 4, 7]
```

---

## Transforms

Map, scale, and shape numeric arrays.

### `range(min, max, pattern)`
Map values from `[0,1]` to `[min, max]`.
```js
range(200, 2000, [0, 0.5, 1])  // → [200, 1100, 2000]
```

### `normalize(pattern)`
Rescale so the max absolute value = 1.
```js
normalize([0, 2, 4])  // → [0, 0.5, 1]
```

### `clip(min, max, pattern)`
Clamp each value to `[min, max]`.
```js
clip(0, 1, [-1, 0.5, 2])  // → [0, 0.5, 1]
```

### `smooth(n, pattern)`
Sliding-window average of size `n`. `n=1` = no change, `n=8` = slow wash.
```js
smooth(2, [1, 3, 5])  // → [1, 2, 4]
```

### `quantize(steps, pattern)`
Snap each value to the nearest of `steps` equal divisions in `[0,1]`.
```js
quantize(4, [0, 0.3, 0.7, 1])  // → [0, 0.25, 0.75, 1]
```

### `interp(a, b, t)`
Linear interpolation between two arrays. `t=0` returns `a`, `t=1` returns `b`.
```js
interp([0, 0], [1, 1], 0.5)  // → [0.5, 0.5]
```

---

## Stochastic

### `drunk(stepSize, length, seed?)`
Random walk clamped to `[0,1]`. Starts at `0.5`.
```js
drunk(0.1, 16)      // 16 gently drifting values
drunk(0.3, 16, 99)  // wider walk, seed 99

// Organic filter sweep
const filterFreqs = range(200, 4000, drunk(0.1, 16))
```

| Param | Default | Description |
|---|---|---|
| `stepSize` | — | Max change per step (0–1). `0.05` = subtle, `0.5` = chaotic. |
| `length` | — | Number of values. |
| `seed` | `42` | Reproducibility seed. |

### `markov(matrix, length, seed?)`
First-order Markov chain. `matrix[i][j]` = probability of moving from state `i` to `j`. Each row must sum to 1.
```js
const chain = markov([
  [0.7, 0.2, 0.1],
  [0.3, 0.4, 0.3],
  [0.1, 0.1, 0.8],
], 16)

const notes = chain.map(i => ['A3', 'C4', 'E4'][i])
```

Always starts at state 0.

### `createOUProcess(theta?, mu?, sigma?)`
Ornstein-Uhlenbeck process — mean-reverting Brownian motion.
```js
const ou = createOUProcess(0.5, 0, 0.3)
ou.value    // current value (starts at mu)
ou.next()   // advance one step, return new value
ou.reset()  // reset to mu
```

| Param | Default | Description |
|---|---|---|
| `theta` | `0.5` | Mean reversion speed. |
| `mu` | `0` | Long-term mean. |
| `sigma` | `0.3` | Volatility. |

---

## Chaos

### `logisticMap(r, x0, n)`
Iterate `x = r * x * (1 - x)` for `n` steps. Returns values in `[0,1]`.
```js
logisticMap(3.9, 0.5, 16)  // 16 chaotic values
logisticMap(3.2, 0.5, 8)   // period-2 oscillation
```

`r > 3.57` = chaos. `r = 4` = maximum chaos. Throws `ScoreError` if `r > 4` or `x0` outside `[0,1]`.

### `logisticSequence(r, x0?)`
Stateful logistic generator. Returns a function — each call advances one step.
```js
const seq = logisticSequence(3.9)
const vals = Array.from({ length: 16 }, () => seq())
```

### `lyapunovExponent(r, x0?, iterations?)`
Estimate the Lyapunov exponent at rate `r`. Positive = chaotic, negative = stable.
```js
lyapunovExponent(4)     // → ≈ 0.693  (maximally chaotic)
lyapunovExponent(2)     // → negative (stable)
lyapunovExponent(3.57)  // → ≈ 0      (edge of chaos)
```

### `createLorenz(params?)`
Lorenz attractor via RK4. Returns `{ next(dt?), reset(), state }`.
```js
const lorenz = createLorenz()

const xs = Array.from({ length: 32 }, () => lorenz.next().x)
const freqs = range(200, 800, normalize(xs))
```

Default params: `sigma=10`, `rho=28`, `beta=8/3` (classic butterfly).

### `lsystem(axiom, rules, generations)`
L-system string rewriting.
```js
lsystem('A', { A: 'AB', B: 'A' }, 4)   // → 'ABAABABAABAAB'
lsystem('F', { F: 'F+F-F-F+F' }, 2)
```

### `lsystemToPattern(axiom, rules, generations, alphabet)`
Generate an L-system string and map to binary. Characters in `alphabet` = `1`, others = `0`.
```js
lsystemToPattern('F', { F: 'F+F-F-F+F' }, 1, 'F')
// → [1, 0, 1, 0, 1, 0, 1, 0, 1]
```

### `wolframCA(rule, width, generations, seed?)`
Wolfram elementary cellular automaton. Returns a 2D array `[generation][cell]`.
```js
const grid = wolframCA(30, 16, 8)
// grid[0] = seed row, grid[7] = 8th generation

const bits = wolframCA(30, 64, 64).map(row => row[32])  // center column
```

| Rule | Character |
|---|---|
| 30 | Highly chaotic |
| 90 | Sierpinski triangle |
| 110 | Turing complete |

`rule` must be 0–255.

---

## Analysis

### `entropy(pattern)`
Shannon entropy normalized to `[0,1]`. `0` = all identical, `1` = perfectly alternating.
Musical sweet spot: ~0.6–0.95.
```js
entropy([1, 0, 1, 0, 1, 0, 1, 0])  // → 1.0
entropy([1, 0, 0, 0, 1, 0, 0, 0])  // → ~0.81
```

### `isMusical(pattern)`
Returns `true` if entropy is in `[0.6, 0.95]`.
```js
isMusical([1, 0, 0, 0, 1, 0, 0, 0])  // → true
isMusical([1, 1, 1, 1, 1, 1, 1, 1])  // → false
```

### `density(pattern)`
Fraction of active steps.
```js
density([1, 0, 0, 0, 1, 0, 0, 0])  // → 0.25
```

---

## Boolean pattern operations

```js
patternOr([1,0,0,0], [0,0,1,0])   // → [1,0,1,0]  — hit where either hits
patternAnd([1,0,1,0], [1,0,0,0])  // → [1,0,0,0]  — hit only where both hit
patternXor([1,0,1,0], [1,0,0,0])  // → [0,0,1,0]  — hit where exactly one hits
patternNot([1,0,0,0])             // → [0,1,1,1]  — invert
tile([1,0,0], 8)                  // → [1,0,0,1,0,0,1,0]  — fill to length
polyrhythm([1,0,0], [1,0,0,0])   // — OR over their LCM length (3-against-4 = 12 steps)
lcm(3, 4)                         // → 12
```

---

## Harmony

### `circleOfFifths(n)`
Note name at position `n` on the circle of fifths. Wraps mod 12.
```js
circleOfFifths(0)   // → 'C'
circleOfFifths(1)   // → 'G'
circleOfFifths(7)   // → 'C#'
circleOfFifths(-1)  // → 'F'
```

### Tuning systems
All return `Record<string, number>` — note name → frequency ratio relative to C4 (261.63 Hz).

| Function | Character |
|---|---|
| `just()` | Pure harmonic ratios — beatless chords |
| `pythagorean()` | Stacked pure fifths — bright, tense thirds |
| `meantone()` | Pure major thirds — Renaissance/Baroque |
| `edo19()` | 19-tone equal temperament — sweeter major thirds |
| `edo31()` | 31-tone equal temperament — nearly just major thirds |

```js
const C4 = 261.63
const chord = ['C', 'E', 'G'].map(n => C4 * just()[n])
// Pure major chord in just intonation
```

`edo19()` and `edo31()` use numeric keys (step indices, not note names).

---

## Numerical integration

### `rk4(state, t, dt, deriv, add, scale)`
4th-order Runge-Kutta integrator. Integrate any ODE.
```js
// dy/dt = y (exponential growth)
const y1 = rk4(1, 0, 0.1, (y, _t) => y, (a, b) => a + b, (a, k) => a * k)
// → ≈ 1.10517 (e^0.1)
```
