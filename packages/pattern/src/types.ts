/**
 * A static array of pattern values — resolved once, same values every bar.
 * The simplest form of a pattern: just a plain JavaScript array.
 *
 * @example
 * ```ts
 * const kick: PatternArray<number> = [1, 0, 0, 0]
 * const melody: PatternArray<string> = ['C4', '', 'E4', '']
 * ```
 */
export type PatternArray<T> = T[]

/**
 * A step function that computes a pattern value per step and bar.
 * Called once per step during playback; can vary across bars for dynamic patterns.
 *
 * @example
 * ```ts
 * // Alternates between hit and rest every bar
 * const fn: PatternFn<number> = (step, bar) => bar % 2 === 0 ? 1 : 0
 * ```
 */
export type PatternFn<T> = (step: number, bar: number) => T

/**
 * A pattern expressed as either a static array or a step function.
 * All Score pattern transforms accept `PatternInput` — pass an array for fixed rhythms,
 * or a function for bar-varying patterns.
 *
 * - Array form `T[]` — resolved once, same values every bar.
 * - Function form `(step, bar) => T` — computed per step, can vary by bar.
 *
 * @example
 * ```ts
 * const static: PatternInput = [1, 0, 0, 0]
 * const dynamic: PatternInput = (step, bar) => bar % 2 === 0 ? 1 : 0
 * ```
 */
export type PatternInput<T = number> = PatternArray<T> | PatternFn<T>

/**
 * Resolve any `PatternInput` to a concrete array of `length` steps at bar `bar`.
 * If `input` is already an array, it is returned as-is (no copy).
 * If `input` is a function, it is called for each step index `0..length-1`.
 *
 * @param input - The pattern to resolve — either an array or a step function.
 * @param length - Number of steps to generate when resolving a function.
 * @param bar - Current bar number, passed to function patterns. Defaults to `0`.
 * @returns An array of `length` values — the resolved pattern at the given bar.
 *
 * @example
 * ```ts
 * resolvePattern([1, 0, 1, 0], 4)          // → [1, 0, 1, 0]  (same reference)
 * resolvePattern((step) => step % 2, 4)    // → [0, 1, 0, 1]
 * resolvePattern((s, b) => b + s, 3, 2)   // → [2, 3, 4]
 * ```
 */
export const resolvePattern = <T>(input: PatternInput<T>, length: number, bar = 0): T[] => {
  if (Array.isArray(input)) return input
  return Array.from({ length }, (_, step) => input(step, bar))
}
