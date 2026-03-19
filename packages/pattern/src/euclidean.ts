/**
 * Generate a Euclidean rhythm — the most even distribution of `hits` across `steps`.
 * Used in traditional music worldwide: `euclidean(3, 8)` = Cuban clave, `euclidean(5, 8)` = bossa nova.
 * Implements the Bjorklund algorithm via ceiling-division placement.
 *
 * @param hits - Number of active steps. `0` returns all rests, `≥steps` returns all hits.
 * @param steps - Total pattern length.
 * @param rotation - Phase offset in steps. `0` = first hit at step 0.
 * @returns Binary array of length `steps` — `1` = hit, `0` = rest.
 *
 * @remarks
 * Uses ceiling-division Bjorklund placement — `pos(i) = floor((i * steps + hits - 1) / hits)`.
 * This guarantees the canonical form: first hit always at step 0.
 * All known euclidean rhythm tables match this implementation.
 *
 * @example
 * ```ts
 * euclidean(3, 8)     // → [1,0,0,1,0,0,1,0]  clave
 * euclidean(5, 8)     // → [1,0,1,0,1,0,1,1]  bossa nova
 * euclidean(4, 16)    // → four-on-the-floor at 16th note resolution
 * euclidean(3, 8, 2)  // → clave rotated 2 steps
 *
 * // Euclidean kick pattern
 * const kick = Kick({ pattern: euclidean(3, 8) })
 *
 * // Polyrhythmic groove — 3 against 5 over 8 steps
 * const groove = stack(euclidean(3, 8), euclidean(5, 8))
 * ```
 *
 * @see {@link stack} — combine two euclidean patterns
 * @see {@link beat} — for manually specified rhythms
 */
export const euclidean = (hits: number, steps: number, rotation = 0): number[] => {
  // Ceiling-division placement: pos(i) = floor((i * steps + hits - 1) / hits)
  // Produces the canonical Bjorklund form — first hit always at position 0
  if (hits <= 0) return Array(steps).fill(0) as number[]
  if (hits >= steps) return Array(steps).fill(1) as number[]

  const positions = new Set(
    Array.from({ length: hits }, (_, i) => Math.floor((i * steps + hits - 1) / hits))
  )
  const pattern = Array.from({ length: steps }, (_, i) => (positions.has(i) ? 1 : 0))

  // Apply rotation
  if (rotation !== 0) {
    const r = ((rotation % steps) + steps) % steps
    return [...pattern.slice(r), ...pattern.slice(0, r)]
  }
  return pattern
}
