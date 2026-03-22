// Pure array transformation functions for pattern shaping and interpolation

/**
 * Map pattern values from [0,1] range to [min, max] range.
 *
 * Stretches or shifts a normalized pattern to fit any numeric range —
 * essential for mapping abstract sequences to musical parameters like
 * frequency, volume, or filter cutoff.
 *
 * @param min - Output minimum. Values at 0 in the input map here.
 * @param max - Output maximum. Values at 1 in the input map here.
 * @param pattern - Input values, expected in [0,1].
 * @returns New array with values scaled to [min, max].
 *
 * @example
 * ```ts
 * range(200, 2000, [0, 0.5, 1])  // → [200, 1100, 2000]
 *
 * // Map a chaos sequence to a filter frequency sweep
 * const filterFreqs = range(200, 4000, drunk(0.1, 16))
 * ```
 *
 * @see {@link normalize} — to bring an arbitrary range back to [0,1] first
 * @see {@link clip} — to hard-clamp values after mapping
 */
export const range = (min: number, max: number, pattern: readonly number[]): number[] =>
  pattern.map(v => min + v * (max - min))

/**
 * Rescale a pattern so its maximum absolute value maps to 1.
 *
 * Normalizing a pattern before passing it to {@link range} ensures values
 * stay within expected bounds regardless of their original magnitude. A
 * common step before routing a raw LFO or sequence into a frequency parameter.
 *
 * @param pattern - Input values at any scale.
 * @returns New array with values rescaled to [0,1] relative to the maximum
 *   absolute value. Returns an all-zero array if all inputs are zero.
 *
 * @example
 * ```ts
 * normalize([0, 2, 4])   // → [0, 0.5, 1]
 * normalize([0, 0, 0])   // → [0, 0, 0]  (guard for silence)
 *
 * // Normalize a raw fibonacci sequence before mapping to pitch
 * const pitchRatios = range(200, 800, normalize(fibonacci(8)))
 * ```
 *
 * @see {@link range} — map the normalized output to any target range
 */
export const normalize = (pattern: readonly number[]): number[] => {
  const maxAbs = Math.max(...pattern.map(v => Math.abs(v)))
  if (maxAbs === 0) return pattern.map(() => 0)
  return pattern.map(v => v / maxAbs)
}

/**
 * Clamp each value in a pattern to the range [min, max].
 *
 * Prevents runaway values from exceeding safe parameter limits — useful
 * after summing or processing patterns where outputs may drift outside
 * a valid range (e.g. volume \> 1 or frequency \< 20 Hz).
 *
 * @param min - Lower bound. Values below this are raised to min.
 * @param max - Upper bound. Values above this are clamped to max.
 * @param pattern - Input values at any scale.
 * @returns New array with every value within [min, max].
 *
 * @example
 * ```ts
 * clip(0, 1, [-1, 0.5, 2])  // → [0, 0.5, 1]
 *
 * // Keep a drunk walk safely within audible filter range
 * const safeFreqs = clip(80, 16000, range(0, 20000, drunk(0.3, 16)))
 * ```
 *
 * @see {@link range} — to first map values to a target range
 */
export const clip = (min: number, max: number, pattern: readonly number[]): number[] =>
  pattern.map(v => Math.max(min, Math.min(max, v)))

/**
 * Smooth a pattern by averaging each value over a sliding window.
 *
 * Reduces sudden jumps in a sequence — turning choppy automation into
 * a gentle glide. Larger window sizes produce more gradual curves;
 * `n=2` is a gentle smoothing, `n=8` gives a slow wash effect.
 *
 * @param n - Window size. Each output value averages the current and
 *   the `n-1` preceding values. `1` = no smoothing (identity).
 * @param pattern - Input values to smooth.
 * @returns New array of the same length with running averages applied.
 *
 * @example
 * ```ts
 * smooth(2, [1, 3, 5])  // → [1, 2, 4]  (each value averaged with previous)
 *
 * // Smooth a random walk before routing to filter cutoff
 * const lfo = smooth(4, drunk(0.3, 32))
 * const filterFreqs = range(300, 3000, lfo)
 * ```
 *
 * @see {@link drunk} — generate organic wandering sequences to smooth
 * @see {@link quantize} — the opposite: snap values to discrete steps
 */
export const smooth = (n: number, pattern: readonly number[]): number[] =>
  pattern.map((_, i) => {
    const start = Math.max(0, i - n + 1)
    const window = pattern.slice(start, i + 1)
    return window.reduce((sum, v) => sum + v, 0) / window.length
  })

/**
 * Snap each value to the nearest of `steps` equal divisions in [0,1].
 *
 * Creates a stepped, quantized automation curve — like a sample-and-hold
 * effect on an LFO. Use to force a smooth sequence onto a musical scale
 * of values (e.g. 12 divisions for semitone mapping, 4 for quarter tones).
 *
 * @param steps - Number of equal divisions. `4` snaps to 0, 0.25, 0.5, 0.75, 1.
 *   `12` = chromatic-style quantization within the range.
 * @param pattern - Input values, expected in [0,1].
 * @returns New array with each value snapped to the nearest division.
 *
 * @example
 * ```ts
 * quantize(4, [0, 0.3, 0.7, 1])  // → [0, 0.25, 0.75, 1]
 *
 * // Force a drift sequence onto 8 pitches
 * const pitchSteps = quantize(8, drunk(0.2, 16))
 * const freqs = range(220, 880, pitchSteps)
 * ```
 *
 * @see {@link smooth} — the opposite: blend values into continuous curves
 */
export const quantize = (steps: number, pattern: readonly number[]): number[] =>
  pattern.map(v => Math.round(v * steps) / steps)

/**
 * Linearly interpolate two patterns element-wise at blend position t.
 *
 * Crossfade between two rhythmic or melodic sequences — `t=0` gives
 * pattern `a` unchanged, `t=1` gives pattern `b`, and `t=0.5` gives
 * the midpoint blend. Both arrays must be the same length.
 *
 * @param a - First pattern (returned when t=0).
 * @param b - Second pattern (returned when t=1).
 * @param t - Blend amount from 0 (fully a) to 1 (fully b).
 * @returns New array of the same length with interpolated values.
 *
 * @example
 * ```ts
 * interp([0, 0], [1, 1], 0.5)  // → [0.5, 0.5]
 * interp([0, 0], [1, 1], 0)    // → [0, 0]
 * interp([0, 0], [1, 1], 1)    // → [1, 1]
 *
 * // Fade between two filter automation curves across a section
 * const morphed = interp(verseFreqs, chorusFreqs, sectionProgress)
 * ```
 *
 * @see {@link range} — to map the interpolated output to a parameter range
 */
export const interp = (a: readonly number[], b: readonly number[], t: number): number[] =>
  a.map((v, i) => v * (1 - t) + (b[i] ?? 0) * t)
