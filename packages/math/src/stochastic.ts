// Stochastic pattern generators — deterministic, seeded pseudo-random sequences
// All functions are pure: same seed always produces the same output

// Internal seeded PRNG — deterministic, not crypto
// Linear congruential generator: fast, sufficient for musical variation
const lcg = (seed: number): () => number => {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

/**
 * Generate a random walk (drunk walk) from a starting point of 0.5.
 *
 * Each step randomly moves ±stepSize from the previous value, clamped to [0,1].
 * Creates organic, wandering sequences that feel natural and alive — like
 * a filter slowly drifting, a pitch subtly detuning, or a volume breathing.
 *
 * @param stepSize - Maximum change per step (0–1). `0.05` = very subtle drift,
 *   `0.1` = gentle wander, `0.3` = wide movement, `0.5` = chaotic jump.
 * @param length - Number of values to generate.
 * @param seed - Random seed for reproducibility. Same seed always produces the
 *   same sequence. Default `42`.
 * @returns Array of `length` values in [0,1].
 *
 * @example
 * ```ts
 * drunk(0.1, 16, 42)  // → 16 slowly drifting values in [0,1]
 *
 * // Organic filter sweep over 16 steps
 * const lfo = drunk(0.1, 16)
 * const filterFreqs = range(200, 4000, lfo)
 *
 * // Breathable volume automation
 * const volume = range(0.6, 1.0, smooth(3, drunk(0.05, 32)))
 * ```
 *
 * @see {@link range} — map the output to any parameter range
 * @see {@link smooth} — smooth the walk for gentler curves
 * @see {@link markov} — structured randomness with state transitions
 */
export const drunk = (stepSize: number, length: number, seed = 42): number[] => {
  const rand = lcg(seed)
  type WalkAcc = { readonly values: number[]; readonly cursor: number }
  return (Array.from({ length })).reduce<WalkAcc>(
    ({ values, cursor }) => ({
      values: [...values, cursor],
      cursor: Math.max(0, Math.min(1, cursor + (rand() * 2 - 1) * stepSize)),
    }),
    { values: [], cursor: 0.5 },
  ).values
}

/**
 * Generate a sequence using a first-order Markov chain.
 *
 * The transition matrix defines how likely the chain is to move from
 * one state to another at each step. Produces musically coherent sequences
 * with controlled randomness — useful for chord progressions, melodic contour,
 * or articulation patterns that follow musical logic.
 *
 * @param matrix - Square transition matrix where `matrix[i][j]` is the
 *   probability of moving from state `i` to state `j`. Each row must sum to 1.
 *   A 3×3 matrix produces states 0, 1, 2.
 * @param length - Number of steps to generate.
 * @param seed - Random seed for reproducibility. Default `42`.
 * @returns Array of state indices (integers 0 to `matrix.length - 1`) of
 *   length `length`. Always starts at state 0.
 *
 * @example
 * ```ts
 * // 3-state chain: state 0 mostly stays, state 1 alternates, state 2 resolves
 * const chain = markov([
 *   [0.7, 0.2, 0.1],
 *   [0.3, 0.4, 0.3],
 *   [0.1, 0.1, 0.8],
 * ], 16)
 *
 * // Map states to notes for a melodic sequence
 * const notes = chain.map(i => ['A3', 'C4', 'E4'][i])
 *
 * // Map states to density levels for evolving rhythm
 * const densities = chain.map(i => [0.25, 0.5, 0.75][i])
 * ```
 *
 * @see {@link drunk} — continuous wandering without discrete states
 */
export const markov = (matrix: readonly (readonly number[])[], length: number, seed = 42): number[] => {
  const rand = lcg(seed)

  // Pick the next state by walking the probability row — freeze once cumulative sum >= r
  const pickNext = (currentState: number): number => {
    const row = matrix[currentState] ?? []
     
    return row.reduce<{ readonly next: number; readonly remaining: number }>(
      ({ next, remaining }, prob, j) =>
        remaining > 0 ? { next: j, remaining: remaining - prob } : { next, remaining },
      { next: 0, remaining: rand() },
    ).next
  }

  type MarkovAcc = { readonly values: number[]; readonly state: number }
  return (Array.from({ length })).reduce<MarkovAcc>(
    ({ values, state }) => ({ values: [...values, state], state: pickNext(state) }),
    { values: [], state: 0 },
  ).values
}
