// Polyrhythm and boolean pattern operations

/**
 * Compute the lowest common multiple of two integers.
 *
 * The LCM gives the shortest cycle length that can contain both rhythms
 * without cutting either short. For example, a 3-beat and 4-beat pattern
 * together produce a 12-beat polyrhythm before the cycle repeats.
 *
 * @param a - First integer.
 * @param b - Second integer.
 * @returns The lowest common multiple of `a` and `b`.
 *
 * @example
 * ```ts
 * lcm(3, 4)  // → 12  (classic 3-against-4 polyrhythm)
 * lcm(4, 6)  // → 12  (triplet-feel patterns over 4/4)
 *
 * // Find how many steps before two patterns align again
 * const cycle = lcm(kick.length, hihat.length)
 * ```
 *
 * @see {@link polyrhythm} — combines two patterns over their LCM length
 */
export const lcm = (a: number, b: number): number => {
  const gcd = (x: number, y: number): number => y === 0 ? x : gcd(y, x % y)
  return Math.abs(a * b) / gcd(a, b)
}

/**
 * Combine two rhythms into a polyrhythm over their LCM length.
 *
 * Tiles both patterns to the LCM of their lengths, then returns `1` wherever
 * either pattern has a hit. The classic way to layer two independent rhythms —
 * a 3-beat pattern against a 4-beat pattern creates a 12-step cycle with
 * the characteristic push-pull feel of African and Latin music.
 *
 * @param rhythmA - First binary pattern.
 * @param rhythmB - Second binary pattern (can be a different length).
 * @returns Combined binary array of length `lcm(rhythmA.length, rhythmB.length)`.
 *   `1` wherever either input has a hit.
 *
 * @example
 * ```ts
 * // 3-against-4 polyrhythm
 * polyrhythm([1,0,0], [1,0,0,0])
 * // → 12 steps with hits at the tiled union of both patterns
 *
 * // Layer a tresillo (3 in 8) against a kick (4 in 8)
 * const groove = polyrhythm(euclidean(3, 8), [1,0,0,0, 1,0,0,0])
 * ```
 *
 * @see {@link lcm} — the cycle length calculation
 * @see {@link patternOr} — same-length union without tiling
 * @see {@link tile} — manually tile a pattern to any length
 */
export const polyrhythm = (rhythmA: number[], rhythmB: number[]): number[] => {
  const length = lcm(rhythmA.length, rhythmB.length)
  return Array.from({ length }, (_, i) => {
    const a = rhythmA[i % rhythmA.length] ?? 0
    const b = rhythmB[i % rhythmB.length] ?? 0
    return a > 0 || b > 0 ? 1 : 0
  })
}

/**
 * Combine two patterns by union — `1` wherever either has a hit.
 *
 * The boolean OR of two patterns: the result has a hit at every position
 * where at least one input has a hit. Shorter arrays are padded with `0`.
 * Use to layer percussion tracks, add accents, or merge fills into a groove.
 *
 * @param a - First binary pattern.
 * @param b - Second binary pattern (can be a different length).
 * @returns Binary array of length `max(a.length, b.length)` — `1` where
 *   either pattern has a hit.
 *
 * @example
 * ```ts
 * patternOr([1,0,0,0], [0,0,1,0])  // → [1,0,1,0]
 *
 * // Add ghost notes from a second pattern to a kick drum
 * const kickWithGhosts = patternOr(kick, ghostNotes)
 *
 * // Merge a euclidean clave with a four-on-the-floor kick
 * const groove = patternOr(euclidean(3,8), [1,0,0,0, 1,0,0,0])
 * ```
 *
 * @see {@link patternAnd} — intersection: hits only where both have hits
 * @see {@link patternXor} — exclusive-or: hits where exactly one has a hit
 * @see {@link polyrhythm} — OR with LCM-length tiling for different-length patterns
 */
export const patternOr = (a: number[], b: number[]): number[] => {
  const length = Math.max(a.length, b.length)
  return Array.from({ length }, (_, i) => ((a[i] ?? 0) > 0 || (b[i] ?? 0) > 0) ? 1 : 0)
}

/**
 * Combine two patterns by intersection — `1` only where both have hits.
 *
 * The boolean AND of two patterns: the result only has a hit where both
 * inputs have a hit simultaneously. Shorter arrays are padded with `0`.
 * Use to find the "agreement" between two patterns — the beats they share.
 *
 * @param a - First binary pattern.
 * @param b - Second binary pattern (can be a different length).
 * @returns Binary array of length `max(a.length, b.length)` — `1` only
 *   where both patterns have hits.
 *
 * @example
 * ```ts
 * patternAnd([1,0,1,0], [1,0,0,0])  // → [1,0,0,0]
 *
 * // Find where kick and snare coincide (accent those hits)
 * const accents = patternAnd(kick, snare)
 * ```
 *
 * @see {@link patternOr} — union: hits where either has a hit
 * @see {@link patternXor} — exclusive-or: hits where exactly one has a hit
 */
export const patternAnd = (a: number[], b: number[]): number[] => {
  const length = Math.max(a.length, b.length)
  return Array.from({ length }, (_, i) => ((a[i] ?? 0) > 0 && (b[i] ?? 0) > 0) ? 1 : 0)
}

/**
 * Combine two patterns by exclusive-or — `1` where exactly one has a hit.
 *
 * The boolean XOR of two patterns: the result has a hit wherever the inputs
 * differ (one has a hit, the other doesn't). Cancels out shared hits and
 * highlights unique ones — a creative way to subtract a pattern from another.
 *
 * @param a - First binary pattern.
 * @param b - Second binary pattern (can be a different length).
 * @returns Binary array of length `max(a.length, b.length)` — `1` where
 *   exactly one pattern has a hit.
 *
 * @example
 * ```ts
 * patternXor([1,0,1,0], [1,0,0,0])  // → [0,0,1,0]
 *
 * // Remove kick hits from a denser hi-hat pattern (leave only non-overlapping)
 * const hiHatOnly = patternXor(hiHatDense, kick)
 * ```
 *
 * @see {@link patternOr} — union: hits where either has a hit
 * @see {@link patternAnd} — intersection: hits where both have hits
 * @see {@link patternNot} — complement: flip all hits and rests
 */
export const patternXor = (a: number[], b: number[]): number[] => {
  const length = Math.max(a.length, b.length)
  return Array.from({ length }, (_, i) => {
    const av = (a[i] ?? 0) > 0
    const bv = (b[i] ?? 0) > 0
    return av !== bv ? 1 : 0
  })
}

/**
 * Invert a pattern — flip all hits to rests and rests to hits.
 *
 * The boolean NOT of a pattern. Produces the "negative space" of a rhythm —
 * where the original was silent, the complement hits. Classic technique for
 * creating interlocking patterns: if A and NOT(A) are played together they
 * produce a solid wall of sound.
 *
 * @param pattern - Binary array of hits (`1`) and rests (`0`).
 * @returns New array the same length — `0` where input was non-zero, `1` where
 *   input was zero.
 *
 * @example
 * ```ts
 * patternNot([1,0,0,0])  // → [0,1,1,1]
 *
 * // Create a complementary hi-hat for a kick pattern
 * const kick = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
 * const hiHat = patternNot(kick)  // hits on all non-kick steps
 *
 * // Interlocking claves: pattern + complement = full coverage
 * const clave = euclidean(3, 8)
 * const fill  = patternNot(clave)
 * patternOr(clave, fill)  // → [1,1,1,1,1,1,1,1]
 * ```
 *
 * @see {@link patternXor} — for selective inversion between two patterns
 * @see {@link patternOr} — combine the result with the original
 */
export const patternNot = (pattern: number[]): number[] =>
  pattern.map(v => v > 0 ? 0 : 1)

/**
 * Repeat a pattern to fill exactly `length` steps.
 *
 * Tiles a short pattern by cycling it — the same way a drummer repeats a
 * short fill phrase to fill a longer section. Useful for extending a 3-step
 * or 5-step motif across a 16-step bar, creating a cross-rhythmic feel.
 *
 * @param pattern - Source pattern to repeat. Must be non-empty.
 * @param length - Total number of steps in the output.
 * @returns New array of exactly `length` values, cycling through `pattern`.
 *
 * @example
 * ```ts
 * tile([1, 0], 6)        // → [1,0,1,0,1,0]
 * tile([1,0,0], 8)       // → [1,0,0,1,0,0,1,0]
 *
 * // Tile a 3-step motif across a 16-step bar (creates rhythmic tension)
 * const motif = [1, 0, 0]
 * const bar = tile(motif, 16)  // 5 full cycles + partial
 *
 * // Extend a short melodic fragment across a longer phrase
 * const melody = tile([0.2, 0.5, 0.8, 0.3], 16)
 * ```
 *
 * @see {@link polyrhythm} — tiles two patterns to their LCM length and combines them
 */
export const tile = (pattern: number[], length: number): number[] =>
  Array.from({ length }, (_, i) => pattern[i % pattern.length] ?? 0)
