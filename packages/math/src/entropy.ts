// Shannon entropy of binary patterns
// Measures how unpredictable/complex a pattern is
// Most musical patterns land in the 0.6–0.95 range
// 0 = totally predictable (all 0s or all 1s)
// 1 = maximum entropy (perfectly alternating or random)

/**
 * Measure the rhythmic complexity of a binary pattern using Shannon entropy.
 *
 * Entropy quantifies unpredictability: `0` means the pattern is completely
 * repetitive (all hits or all rests), `1` means perfectly alternating.
 * Most compelling musical patterns sit in the sweet spot of 0.6–0.95 —
 * complex enough to hold attention, structured enough to feel intentional.
 *
 * @param pattern - Binary array of hits (`1`) and rests (`0`).
 *   Any non-zero value counts as a hit.
 * @returns Normalized Shannon entropy in [0, 1].
 *   `0` = all identical values (no entropy), `1` = perfectly split 50/50.
 *
 * @example
 * ```ts
 * entropy([1, 0, 1, 0, 1, 0, 1, 0])  // → 1.0  (maximum: perfectly alternating)
 * entropy([1, 1, 1, 1])               // → 0    (no entropy: all hits)
 * entropy([1, 0, 0, 0, 1, 0, 0, 0])  // → ~0.81 (musical sweet spot)
 *
 * // Filter out patterns that are too predictable or too chaotic
 * const candidates = [pattern1, pattern2, pattern3].filter(isMusical)
 * ```
 *
 * @see {@link isMusical} — convenience check for the 0.6–0.95 musical range
 * @see {@link density} — the simpler fraction-of-hits measure
 */
export const entropy = (pattern: number[]): number => {
  if (pattern.length === 0) return 0
  const ones = pattern.filter(v => v > 0).length
  const zeros = pattern.length - ones
  const p1 = ones / pattern.length
  const p0 = zeros / pattern.length
  if (p1 === 0 || p0 === 0) return 0
  return -(p1 * Math.log2(p1) + p0 * Math.log2(p0))
}

/**
 * Check whether a pattern falls in the musically useful entropy range.
 *
 * Patterns with entropy in [0.6, 0.95] are neither boring (too repetitive)
 * nor chaotic (too random). This range corresponds roughly to patterns
 * where 20–80% of steps are hits — the zone where most compelling
 * electronic music grooves live.
 *
 * @param pattern - Binary array of hits (`1`) and rests (`0`).
 * @returns `true` if the pattern's entropy is ≥ 0.6 and ≤ 0.95.
 *
 * @example
 * ```ts
 * isMusical([1, 0, 0, 0, 1, 0, 0, 0])  // → true   (sparse but coherent)
 * isMusical([1, 1, 1, 1, 1, 1, 1, 1])  // → false  (all hits, zero entropy)
 * isMusical([1, 0, 1, 0, 1, 0, 1, 0])  // → false  (entropy = 1.0, too regular)
 *
 * // Validate a generated euclidean pattern before using it
 * const pat = euclidean(5, 16)
 * if (isMusical(pat)) usePattern(pat)
 * ```
 *
 * @see {@link entropy} — the underlying measure
 * @see {@link density} — check hit fraction independently
 */
export const isMusical = (pattern: number[]): boolean => {
  const e = entropy(pattern)
  return e >= 0.6 && e <= 0.95
}

/**
 * Measure the density of a binary pattern — the fraction of steps that are hits.
 *
 * Density is the simplest measure of how "busy" a pattern is.
 * `0.25` = one hit per four steps (sparse, like a typical kick),
 * `0.5` = half the steps are hits (medium, like a 2-and-4 snare),
 * `0.75` = three quarters are hits (dense, driving hi-hat feel).
 *
 * @param pattern - Binary array of hits (`1`) and rests (`0`).
 *   Any non-zero value counts as a hit.
 * @returns Fraction of hits in [0, 1]. Returns `0` for empty arrays.
 *
 * @example
 * ```ts
 * density([1, 0, 0, 0, 1, 0, 0, 0])  // → 0.25  (one hit per 4 steps)
 * density([1, 1, 0, 0])               // → 0.5   (half hits)
 * density([1, 1, 1, 0])               // → 0.75  (dense)
 *
 * // Check if a pattern is in the sparse range before using as kick
 * const kick = euclidean(4, 16)
 * console.log(density(kick))  // → 0.25
 * ```
 *
 * @see {@link entropy} — complexity measure (density alone doesn't capture it)
 * @see {@link isMusical} — combined test for musical usefulness
 */
export const density = (pattern: number[]): number => {
  if (pattern.length === 0) return 0
  return pattern.filter(v => v > 0).length / pattern.length
}
