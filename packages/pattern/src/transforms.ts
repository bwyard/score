import type { PatternInput, PatternFn } from './types.js'
import { resolvePattern } from './types.js'

/**
 * Double (or multiply) the playback speed of a pattern.
 * Each step plays `n` times faster — a 4/4 kick becomes a rapid 16th-note fill.
 *
 * @param n - Speed multiplier. `2` = double time, `4` = quadruple time. Must be > 0.
 * @param pattern - Source pattern as an array or step function.
 * @returns A step function playing the pattern at `n×` speed.
 *
 * @example
 * ```ts
 * // Buildup: kick doubles in speed every 4 bars
 * const kick = Kick({ pattern: every(4, p => fast(2, p), [1, 0, 0, 0]) })
 * ```
 *
 * @see {@link slow} — the inverse: halve the speed
 * @see {@link every} — apply fast conditionally per bar
 */
export const fast = <T>(n: number, pattern: PatternInput<T>): PatternFn<T> =>
  (step: number, bar: number) => {
    const arr = Array.isArray(pattern)
      ? pattern
      : resolvePattern(pattern, Math.ceil(16 / n), bar)
    return arr[(step * n) % arr.length] as T
  }

/**
 * Halve (or divide) the playback speed of a pattern.
 * Each step lasts `n` times longer — a driving 8th-note bass becomes a slow half-time groove.
 *
 * @param n - Speed divisor. `2` = half time (each step doubled), `4` = quarter time. Must be > 0.
 * @param pattern - Source pattern as an array or step function.
 * @returns A step function playing the pattern at `1/n` speed.
 *
 * @example
 * ```ts
 * // Half-time snare feel — snare lands on beat 3 instead of 2 and 4
 * const snare = Snare({ pattern: slow(2, [0, 0, 1, 0,  0, 0, 1, 0]) })
 * ```
 *
 * @see {@link fast} — the inverse: multiply the speed
 * @see {@link every} — apply slow conditionally per bar
 */
export const slow = <T>(n: number, pattern: PatternInput<T>): PatternFn<T> => {
  const baseLen = Array.isArray(pattern) ? pattern.length : 16
  return (step: number, bar: number) => {
    const expanded = resolvePattern(pattern, baseLen, bar)
    const slowStep = Math.floor(step / n) % expanded.length
    return expanded[slowStep] as T
  }
}

/**
 * Reverse a pattern — plays it backwards from last step to first.
 * A four-on-the-floor reversed becomes a last-beat accent; a melodic phrase plays in retrograde.
 *
 * @param pattern - Source pattern as an array or step function.
 * @returns A step function that reads the pattern in reverse order.
 *
 * @example
 * ```ts
 * // Reverse a riff on every other bar for a call-and-response feel
 * const lead = Synth({ pattern: every(2, rev, ['C4', 'E4', 'G4', 'A4']) })
 * ```
 *
 * @see {@link shift} — rotate the pattern instead of reversing
 * @see {@link every} — apply rev conditionally per bar
 */
export const rev = <T>(pattern: PatternInput<T>): PatternFn<T> =>
  (step: number, bar: number) => {
    const arr = resolvePattern(pattern, Array.isArray(pattern) ? pattern.length : 16, bar)
    return arr[arr.length - 1 - (step % arr.length)] as T
  }

/**
 * Apply a transform to a pattern on every `n`th bar.
 * Use it to add fills, reverse phrases, or introduce variation without breaking the loop.
 *
 * @param n - Bar interval. `2` = every other bar, `4` = every fourth bar.
 * @param transform - Function that receives the pattern and returns a transformed version.
 * @param pattern - Source pattern as an array or step function.
 * @returns A step function that uses the transformed pattern on bar `0, n, 2n, …` and the original otherwise.
 *
 * @example
 * ```ts
 * // Kick doubles in speed every 4 bars — classic techno buildup
 * const kick = Kick({ pattern: every(4, p => fast(2, p), [1, 0, 0, 0]) })
 *
 * // Reverse the hi-hat pattern every other bar
 * const hat = HiHat({ pattern: every(2, rev, [1, 0, 1, 1]) })
 * ```
 *
 * @see {@link fast} — speed up a pattern
 * @see {@link rev} — reverse a pattern
 * @see {@link degrade} — randomly drop hits for variation
 */
export const every = <T>(
  n: number,
  transform: (p: PatternInput<T>) => PatternInput<T>,
  pattern: PatternInput<T>,
): PatternFn<T> =>
  (step: number, bar: number) => {
    const active = bar % n === 0 ? transform(pattern) : pattern
    const arr = resolvePattern(active, Array.isArray(active) ? (active as T[]).length : 16, bar)
    return arr[step % arr.length] as T
  }

/**
 * Randomly silence hits in a pattern — the higher the probability, the more gaps appear.
 * Uses a deterministic seed (step + bar) so the pattern is consistent within a bar
 * but varies across bars, giving a humanised, glitchy feel.
 *
 * @param probability - Drop chance per hit, from `0` to `1`. `0` = keep all hits, `1` = drop all hits.
 * @param pattern - Source pattern as an array or step function. Zeros are always preserved.
 * @returns A step function that passes zeros through and drops active steps by `probability`.
 *
 * @example
 * ```ts
 * // Hi-hat with 30% chance of dropping each hit — loose, live feel
 * const hat = HiHat({ pattern: degrade(0.3, [1, 1, 1, 1]) })
 *
 * // Clap that becomes more sparse over time using every()
 * const clap = Clap({ pattern: every(8, p => degrade(0.5, p), [0, 0, 1, 0]) })
 * ```
 *
 * @see {@link every} — apply transforms conditionally per bar
 * @see {@link stack} — layer patterns together
 */
export const degrade = (probability: number, pattern: PatternInput): PatternFn<number> =>
  (step: number, bar: number) => {
    const arr = resolvePattern(pattern, Array.isArray(pattern) ? pattern.length : 16, bar)
    const val = arr[step % arr.length] ?? 0
    if (val === 0) return 0
    // Simple deterministic "random" based on step + bar
    const seed = (step * 1237 + bar * 4567) % 9999
    return (seed / 9999) < probability ? 0 : val
  }

/**
 * Rotate a pattern by `n` steps — pushes every hit forward (or back for negative values).
 * Use it to offset a syncopated groove, delay a snare, or create phasing patterns.
 *
 * @param n - Step offset. Positive = shift right (later), negative = shift left (earlier).
 * @param pattern - Source pattern as an array or step function.
 * @returns A step function that reads the pattern offset by `n` steps.
 *
 * @example
 * ```ts
 * // Snare lands one 16th late — classic shuffle pocket
 * const snare = Snare({ pattern: shift(1, [0, 0, 1, 0,  0, 0, 1, 0]) })
 *
 * // Phase two hi-hat patterns against each other
 * const hat1 = HiHat({ pattern: [1, 0, 1, 0] })
 * const hat2 = HiHat({ pattern: shift(1, [1, 0, 1, 0]) })
 * ```
 *
 * @see {@link rev} — reverse a pattern instead of rotating
 * @see {@link stack} — combine two patterns at the same position
 */
export const shift = <T>(n: number, pattern: PatternInput<T>): PatternFn<T> =>
  (step: number, bar: number) => {
    const arr = resolvePattern(pattern, Array.isArray(pattern) ? pattern.length : 16, bar)
    return arr[((step - n) % arr.length + arr.length) % arr.length] as T
  }

/**
 * Layer multiple patterns into one by merging hits at each step.
 *
 * For number patterns: a step is active if ANY input pattern has a non-zero value at that step —
 * the first non-zero value found is returned (preserving velocity/accent data).
 * For string patterns: returns the first non-empty string value at each step.
 * Accepts any mix of array patterns and step functions.
 *
 * @param patterns - Two or more patterns to layer together.
 * @returns A pattern function that merges all inputs at each step.
 *
 * @example
 * ```ts
 * // Combine kick and snare patterns into one composite rhythm
 * const combined = stack(
 *   [1, 0, 0, 0,  1, 0, 0, 0],  // kick
 *   [0, 0, 1, 0,  0, 0, 1, 0],  // snare
 * )
 * // step 0 → 1 (kick), step 2 → 1 (snare), step 4 → 1 (kick)
 *
 * // Layer two euclidean rhythms for a polyrhythmic groove
 * const poly = stack(euclidean(3, 8), euclidean(5, 8))
 * ```
 *
 * @see {@link beat} — shorthand for creating a single pattern array
 * @see {@link every} — apply transforms conditionally per bar
 */
export const stack = <T extends number | string>(
  ...patterns: PatternInput<T>[]
): PatternFn<T> =>
  (step: number, bar: number): T => {
    const maxLen = patterns.reduce(
      (m, p) => Math.max(m, Array.isArray(p) ? p.length : 16), 16
    )
    for (const pat of patterns) {
      const arr = resolvePattern(pat, Array.isArray(pat) ? pat.length : maxLen, bar)
      const val = arr[step % arr.length]
      if (val !== undefined && val !== 0 && val !== '') return val
    }
    return 0 as T
  }

/**
 * Shorthand for creating a pattern array — reads like drum notation.
 * Identical to writing an array literal; exists so patterns read like music rather than data.
 *
 * @param steps - Step values. Use `1` for hit, `0` for rest in rhythmic patterns;
 *   note names (e.g. `'A3'`, `'C4'`) for melodic patterns.
 * @returns Array of step values — exactly `[...steps]`.
 *
 * @example
 * ```ts
 * beat(1, 0, 0, 0)                     // → [1, 0, 0, 0]  four-on-the-floor kick
 * beat(0, 0, 1, 0)                     // → [0, 0, 1, 0]  backbeat snare
 * beat(1, 0, 1, 0, 1, 0)               // → [1, 0, 1, 0, 1, 0]  straight 8ths
 *
 * const kick = Kick({ pattern: beat(1, 0, 0, 0,  1, 0, 0, 0) })
 * const groove = stack(
 *   beat(1, 0, 0, 0,  1, 0, 0, 0),   // kick
 *   beat(0, 0, 1, 0,  0, 0, 1, 0),   // snare
 * )
 * ```
 *
 * @see {@link euclidean} — for mathematically distributed rhythms
 * @see {@link stack} — for layering multiple beat patterns
 */
export const beat = <T>(...steps: T[]): T[] => [...steps]
