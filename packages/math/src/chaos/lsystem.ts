// L-system (Lindenmayer system) string rewriting
// Generates self-similar, fractal-like strings by iteratively applying rewrite rules
// Commonly used for plant growth models, fractal curves, and rhythmic patterns

import { ScoreError } from '@score/core'

/**
 * Rewrite rules for an L-system: maps each symbol to its replacement string.
 *
 * Symbols not present in the rules are left unchanged (identity rule).
 *
 * @example
 * ```ts
 * // Koch curve rules
 * const kochRules: LRule = { F: 'F+F-F-F+F' }
 * ```
 */
export type LRule = Record<string, string>

/**
 * Apply L-system rewrite rules to an axiom for `generations` steps.
 *
 * At each generation, every character in the current string is replaced by
 * its corresponding rule string, or left unchanged if no rule applies.
 * The string length grows exponentially, so keep `generations` small (\< 10)
 * for long rule expansions.
 *
 * @param axiom - Starting string (generation 0).
 * @param rules - Rewrite rules mapping each symbol to its expansion.
 * @param generations - Number of rewriting steps. `0` returns the axiom unchanged.
 * @returns The L-system string after `generations` rewrites.
 * @throws `ScoreError` if `generations < 0`.
 *
 * @example
 * ```ts
 * // Algae growth: A → AB, B → A
 * lsystem('A', { A: 'AB', B: 'A' }, 4)
 * // → 'ABAABABAABAAB'
 *
 * // Koch curve after 2 generations
 * lsystem('F', { F: 'F+F-F-F+F' }, 2)
 * ```
 */
export const lsystem = (axiom: string, rules: LRule, generations: number): string => {
  if (generations < 0) {
    throw ScoreError('lsystem: generations must be ≥ 0', {
      received: generations,
      fix: 'Pass generations ≥ 0. Use 0 to return the axiom unchanged.',
      docs: 'https://en.wikipedia.org/wiki/L-system',
      code: 'LSYSTEM_INVALID_GENERATIONS',
    })
  }

  // Each generation rewrites every character via the rules; unmatched symbols pass through unchanged
  return (Array.from({ length: generations })).reduce<string>(
    (current) => Array.from(current).reduce((acc, ch) => acc + (rules[ch] ?? ch), ''),
    axiom,
  )
}

/**
 * Convert an L-system string to a binary pattern using an alphabet filter.
 *
 * Generates the L-system string (see {@link lsystem}), then maps each
 * character to `1` if it appears in `alphabet`, or `0` otherwise.
 * This translates fractal geometry into a rhythm or modulation pattern.
 *
 * @param axiom - Starting string for the L-system.
 * @param rules - Rewrite rules for the L-system.
 * @param generations - Number of rewriting steps.
 * @param alphabet - String of characters that map to `1`. All others map to `0`.
 * @returns Binary array — `1` for characters in `alphabet`, `0` for all others.
 * @throws `ScoreError` if `generations < 0`.
 *
 * @example
 * ```ts
 * // Extract 'F' moves from a Koch curve as a rhythm
 * lsystemToPattern('F', { F: 'F+F-F-F+F' }, 1, 'F')
 * // → [1, 0, 1, 0, 1, 0, 1, 0, 1]  (F=1, +=0, -=0)
 *
 * // Algae pattern with both A and B as hits
 * lsystemToPattern('A', { A: 'AB', B: 'A' }, 3, 'AB')
 * // → all 1s (every char is A or B)
 * ```
 */
export const lsystemToPattern = (
  axiom: string,
  rules: LRule,
  generations: number,
  alphabet: string,
): number[] => {
  const str = lsystem(axiom, rules, generations)
  const set = new Set(alphabet)
  return Array.from(str).map(ch => (set.has(ch) ? 1 : 0))
}
