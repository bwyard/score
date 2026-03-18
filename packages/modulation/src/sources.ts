// Pattern value sources — pure functions that return step-function value generators
// Use these anywhere a PatternFn<number> is accepted: filter automation, volume rides, etc.

/**
 * Create a linear ramp value source over a given number of bars.
 * Returns a step function that interpolates linearly from `from` to `to`.
 * The ramp clamps at `to` once `bars` have elapsed.
 *
 * @param from - Starting value at bar 0.
 * @param to - Target value at bar `bars`.
 * @param bars - Number of bars to complete the ramp. Default `8`.
 * @returns Step function `(step, bar) => number` — pass to any `pattern:` or automation prop.
 *
 * @example
 * ```ts
 * import { ramp } from '@score/modulation'
 *
 * // Filter opens from 200Hz to 4000Hz over 16 bars (DJ-style filter sweep)
 * const filterSweep = ramp(200, 4000, 16)
 * // In transport tick: filter.setFrequency(filterSweep(step, bar))
 *
 * // Volume fade-in over 8 bars
 * const fadeIn = ramp(0, 1, 8)
 * ```
 *
 * @see {@link sine} — for oscillating rather than directional modulation
 */
export const ramp = (from: number, to: number, bars = 8) =>
  (_step: number, bar: number): number => {
    const t = Math.min(bar / bars, 1)
    return from + (to - from) * t
  }

/**
 * Create a sine wave value source oscillating between `center - depth` and `center + depth`.
 * The cycle repeats every `rate` bars.
 *
 * @param rate - Oscillation period in bars. `4` = one full cycle every 4 bars.
 * @param depth - Amplitude — half the total swing. Default `1`.
 * @param center - Center value around which the sine oscillates. Default `0`.
 * @returns Step function `(step, bar) => number`.
 *
 * @example
 * ```ts
 * import { sine } from '@score/modulation'
 *
 * // Filter breathes up and down by ±600Hz, centred at 1000Hz, period 8 bars
 * const filterLFO = sine(8, 600, 1000)
 *
 * // Slow pan automation: left-to-right and back over 16 bars
 * const autoPan = sine(16, 1, 0)
 * ```
 *
 * @see {@link cosine} — starts at peak value (bar 0 = center + depth)
 * @see {@link ramp} — for directional rather than oscillating modulation
 */
export const sine = (rate: number, depth = 1, center = 0) =>
  (_step: number, bar: number): number =>
    center + depth * Math.sin((2 * Math.PI * bar) / rate)

/**
 * Create a cosine wave value source oscillating between `center - depth` and `center + depth`.
 * Like {@link sine} but starts at peak value at bar 0 — useful when you want the
 * modulation to begin at its maximum and descend first.
 *
 * @param rate - Oscillation period in bars. `4` = one full cycle every 4 bars.
 * @param depth - Amplitude — half the total swing. Default `1`.
 * @param center - Center value around which the cosine oscillates. Default `0`.
 * @returns Step function `(step, bar) => number`.
 *
 * @example
 * ```ts
 * import { cosine } from '@score/modulation'
 *
 * // Filter starts wide open (1000+500=1500Hz) and descends — opposite phase to sine
 * const filterCos = cosine(8, 500, 1000)
 * ```
 *
 * @see {@link sine} — same shape, starts at zero crossing instead of peak
 */
export const cosine = (rate: number, depth = 1, center = 0) =>
  (_step: number, bar: number): number =>
    center + depth * Math.cos((2 * Math.PI * bar) / rate)
