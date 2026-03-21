// Logistic map — classic 1D chaotic map
// x_{n+1} = r * x_n * (1 - x_n)
// For r in [3.57, 4.0] the map exhibits chaos; r=4 is maximally chaotic

import { ScoreError } from '@score/core'

/**
 * Validate logistic map parameters, throwing a `ScoreError` on invalid input.
 */
const validateLogistic = (r: number, x0: number) => {
  if (r < 0 || r > 4) {
    throw ScoreError('logisticMap: r must be in [0, 4]', {
      received: r,
      fix: 'Pass r in [0, 4]. For chaos use r in [3.57, 4].',
      docs: 'https://en.wikipedia.org/wiki/Logistic_map',
      code: 'LOGISTIC_INVALID_R',
    })
  }
  if (x0 < 0 || x0 > 1) {
    throw ScoreError('logisticMap: x0 must be in [0, 1]', {
      received: x0,
      fix: 'Pass x0 in [0, 1]. Typical default is 0.5.',
      docs: 'https://en.wikipedia.org/wiki/Logistic_map',
      code: 'LOGISTIC_INVALID_X0',
    })
  }
}

/**
 * Generate a sequence of values using the logistic map.
 *
 * The logistic map `x_{n+1} = r * x_n * (1 - x_n)` is one of the simplest
 * systems to exhibit deterministic chaos. For `r` between 3.57 and 4.0 the
 * sequence never repeats and is highly sensitive to initial conditions —
 * ideal for creating non-repeating modulation patterns.
 *
 * @param r - Growth rate in [0, 4]. Values in [3.57, 4] produce chaos; `r=4` is maximally chaotic.
 * @param x0 - Initial value in [0, 1]. Default `0.5`.
 * @param n - Number of iterations to return. Must be ≥ 1.
 * @returns Array of `n` values in [0, 1].
 * @throws {ScoreError} if `r < 0`, `r > 4`, `x0 < 0`, `x0 > 1`, or `n < 1`.
 *
 * @example
 * ```ts
 * // 16 chaotic values from the edge of chaos
 * logisticMap(3.9, 0.5, 16)
 *
 * // Stable period-2 oscillation
 * logisticMap(3.2, 0.5, 8)  // → alternates between two values
 * ```
 */
export const logisticMap = (r: number, x0: number, n: number): number[] => {
  validateLogistic(r, x0)
  if (n < 1) {
    throw ScoreError('logisticMap: n must be ≥ 1', {
      received: n,
      fix: 'Pass n ≥ 1.',
      docs: 'https://en.wikipedia.org/wiki/Logistic_map',
      code: 'LOGISTIC_INVALID_N',
    })
  }

  type LogAcc = { readonly values: number[]; readonly x: number }
  return (Array.from({ length: n })).reduce<LogAcc>(
    ({ values, x }) => ({ values: [...values, x], x: r * x * (1 - x) }),
    { values: [], x: x0 },
  ).values
}

/**
 * Create a stateful logistic map generator.
 *
 * Returns a zero-argument function — each call advances the logistic map
 * one step and returns the next value. Unlike {@link logisticMap}, this is
 * lazy: values are computed on demand, useful for real-time modulation.
 *
 * @param r - Growth rate in [0, 4]. Values in [3.57, 4] produce chaos.
 * @param x0 - Initial value in [0, 1]. Default `0.5`.
 * @returns A generator function `() => number` where each call returns the next value.
 * @throws {ScoreError} if `r < 0`, `r > 4`, `x0 < 0`, or `x0 > 1`.
 *
 * @example
 * ```ts
 * const seq = logisticSequence(3.9)
 * const vals = Array.from({ length: 16 }, () => seq()) // 16 chaotic values
 *
 * // Drive a filter cutoff in real time
 * const chaos = logisticSequence(3.99, 0.3)
 * // on each audio frame: filter.frequency = range(200, 4000, [chaos()])[0]
 * ```
 */
export const logisticSequence = (r: number, x0 = 0.5): (() => number) => {
  validateLogistic(r, x0)
  let state = x0
  return () => {
    const current = state
    state = r * state * (1 - state)
    return current
  }
}
