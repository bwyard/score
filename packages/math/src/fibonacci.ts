// Fibonacci, Padovan, and Tribonacci sequences as rhythm generators
// These produce self-similar, non-periodic patterns with musical coherence

/**
 * Generate the first n Fibonacci numbers.
 *
 * The Fibonacci sequence (1, 1, 2, 3, 5, 8, 13, 21, ...) grows by summing
 * the two preceding values. Fibonacci numbers appear in natural proportions
 * and are musically useful for creating rhythmic patterns with long-range
 * self-similarity — a groove that never quite repeats.
 *
 * @param n - How many numbers to return. `0` returns `[]`, `1` returns `[1]`.
 * @returns Array of the first `n` Fibonacci numbers starting from `[1, 1, ...]`.
 *
 * @example
 * ```ts
 * fibonacci(8)  // → [1, 1, 2, 3, 5, 8, 13, 21]
 *
 * // Use as velocity values — hits get louder following the sequence
 * const velocities = fibonacci(16).map(v => Math.min(v / 21, 1))
 *
 * // Scale to a filter frequency range
 * import { normalize, range } from './transforms.js'
 * const filterSweep = range(200, 4000, normalize(fibonacci(8)))
 * ```
 *
 * @see {@link fibonacciRhythm} — binary hit pattern at Fibonacci positions
 * @see {@link padovan} — a related sequence with smoother growth
 * @see {@link tribonacci} — sums three preceding values instead of two
 */
export const fibonacci = (n: number): number[] => {
  if (n <= 0) return []
  if (n === 1) return [1]
  type FibAcc = { readonly seq: number[]; readonly last: number; readonly prev: number }
  return (Array.from({ length: n - 2 })).reduce<FibAcc>(
    ({ seq, last, prev }) => ({ seq: [...seq, last + prev], last: last + prev, prev: last }),
    { seq: [1, 1], last: 1, prev: 1 },
  ).seq
}

/**
 * Generate a binary rhythm with hits at Fibonacci positions.
 *
 * Places a `1` (hit) at every step index that is a Fibonacci number
 * (0, 1, 2, 3, 5, 8, 13, ...) and `0` (rest) elsewhere. The resulting
 * pattern is irregular, non-repeating, and self-similar — it sounds like
 * a human groove rather than a mathematical exercise.
 *
 * @param steps - Total length of the pattern. Must be > 0.
 * @returns Binary array of length `steps` — `1` = hit, `0` = rest,
 *   with hits at positions 0, 1, 2, 3, 5, 8, 13, ... up to `steps - 1`.
 *
 * @example
 * ```ts
 * fibonacciRhythm(16)
 * // → [1,1,1,1,0,1,0,0,1,0,0,0,0,1,0,0]
 * // Hits at steps: 0, 1, 2, 3, 5, 8, 13
 *
 * // Use as a hi-hat pattern with an irregular, living feel
 * const hiHat = HiHat({ pattern: fibonacciRhythm(16) })
 *
 * // Combine with a four-on-the-floor kick via patternOr
 * const kick = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
 * const merged = patternOr(kick, fibonacciRhythm(16))
 * ```
 *
 * @see {@link fibonacci} — the raw number sequence
 * @see {@link patternOr} — combine this with other rhythms
 */
export const fibonacciRhythm = (steps: number): number[] => {
  // Generate fibonacci values as an array (duplicates handled by Set below)
  type FibPosAcc = { readonly positions: number[]; readonly a: number; readonly b: number }
  const { positions } = (Array.from({ length: steps })).reduce<FibPosAcc>(
    ({ positions, a, b }) =>
      a >= steps
        ? { positions, a, b }
        : { positions: [...positions, a], a: b, b: a + b },
    { positions: [], a: 0, b: 1 },
  )
  const fibSet = new Set(positions)
  return Array.from({ length: steps }, (_, i) => fibSet.has(i) ? 1 : 0)
}

/**
 * Generate the first n Padovan numbers.
 *
 * The Padovan sequence (1, 1, 1, 2, 2, 3, 4, 5, 7, 9, 12, ...) sums
 * P(n) = P(n-2) + P(n-3) — growing more slowly than Fibonacci, with a
 * smoother, more gradual character. Useful for velocity ramps, rhythmic
 * patterns with gentle acceleration, or proportional spacing.
 *
 * @param n - How many numbers to return.
 * @returns Array of the first `n` Padovan numbers.
 *   The first three values are always `[1, 1, 1]`.
 *
 * @example
 * ```ts
 * padovan(7)   // → [1, 1, 1, 2, 2, 3, 4]
 * padovan(10)  // → [1, 1, 1, 2, 2, 3, 4, 5, 7, 9]
 *
 * // Gradual velocity ramp — gentler than Fibonacci
 * import { normalize, range } from './transforms.js'
 * const vels = range(0.3, 1.0, normalize(padovan(8)))
 * ```
 *
 * @see {@link fibonacci} — faster-growing sibling sequence
 * @see {@link tribonacci} — sums three preceding values
 */
export const padovan = (n: number): number[] => {
  if (n <= 0) return []
  if (n <= 3) return Array(n).fill(1) as number[]
  // P(k) = P(k-2) + P(k-3); track last three values as [a=last, b=second, c=third]
  type PadAcc = { readonly seq: number[]; readonly last: [number, number, number] }
  return (Array.from({ length: n - 3 })).reduce<PadAcc>(
    ({ seq, last: [a, b, c] }) => {
      const next = b + c
      return { seq: [...seq, next], last: [next, a, b] }
    },
    { seq: [1, 1, 1], last: [1, 1, 1] },
  ).seq
}

/**
 * Generate the first n Tribonacci numbers.
 *
 * The Tribonacci sequence (0, 0, 1, 1, 2, 4, 7, 13, 24, ...) sums the
 * three preceding values: T(n) = T(n-1) + T(n-2) + T(n-3). It grows faster
 * than Fibonacci, converging to the "tribonacci constant" ≈ 1.839.
 * Use it for explosive velocity builds, exponential-feel pattern growth,
 * or asymmetric polyrhythmic spacing.
 *
 * @param n - How many numbers to return.
 * @returns Array of the first `n` Tribonacci numbers starting `[0, 0, 1, 1, ...]`.
 *
 * @example
 * ```ts
 * tribonacci(7)   // → [0, 0, 1, 1, 2, 4, 7]
 * tribonacci(10)  // → [0, 0, 1, 1, 2, 4, 7, 13, 24, 44]
 *
 * // Use the growth rate for an accelerating rhythmic build
 * import { normalize, range } from './transforms.js'
 * const buildUp = range(0.1, 1.0, normalize(tribonacci(8)))
 * ```
 *
 * @see {@link fibonacci} — sums two preceding values (slower growth)
 * @see {@link padovan} — sums with a gap of two (slowest growth)
 */
export const tribonacci = (n: number): number[] => {
  if (n <= 0) return []
  if (n === 1) return [0]
  if (n === 2) return [0, 0]
  // T(k) = T(k-1) + T(k-2) + T(k-3); track last three as [a=last, b=second, c=third]
  type TribAcc = { readonly seq: number[]; readonly last: [number, number, number] }
  return (Array.from({ length: n - 3 })).reduce<TribAcc>(
    ({ seq, last: [a, b, c] }) => {
      const next = a + b + c
      return { seq: [...seq, next], last: [next, a, b] }
    },
    { seq: [0, 0, 1], last: [1, 0, 0] },
  ).seq
}
