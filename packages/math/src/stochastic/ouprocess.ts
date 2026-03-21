// Ornstein-Uhlenbeck process — mean-reverting stochastic process
// Models physical Brownian motion with a spring-like restoring force
// Unlike a pure random walk, OU always drifts back toward its long-term mean
// Musically: filter cutoff that wanders but always gravitates back to a home value

/**
 * Box-Muller transform — convert two uniform [0,1] samples to N(0,1).
 * Uses Math.random() internally; not seeded.
 */
const gaussian = (): number => {
  // Box-Muller: transform two uniform random variables into a standard normal
  const u1 = Math.random()
  const u2 = Math.random()
  // Avoid log(0) for u1=0 (astronomically rare but defensive)
  const safeU1 = u1 === 0 ? Number.EPSILON : u1
  return Math.sqrt(-2 * Math.log(safeU1)) * Math.cos(2 * Math.PI * u2)
}

/**
 * Create an Ornstein-Uhlenbeck (OU) stochastic process.
 *
 * The OU process models mean-reverting Brownian motion — it wanders randomly
 * but always drifts back toward a long-term mean `mu`. The update equation is:
 *
 * `dX = theta * (mu - X) * dt + sigma * sqrt(dt) * N(0,1)`
 *
 * This makes it ideal for slowly evolving musical parameters that should feel
 * organic without drifting away forever — a filter cutoff that breathes, a
 * pitch that floats around a center tone, or a reverb tail that undulates.
 *
 * @param theta - Mean reversion speed. Higher = faster return to `mu`. Default `0.5`.
 * @param mu - Long-term mean (the value the process gravitates toward). Default `0`.
 * @param sigma - Volatility (noise amplitude). Higher = wider wandering. Default `0.3`.
 * @returns An object with `next(dt?)`, `reset()`, and a `value` getter.
 *
 * @example
 * ```ts
 * const ou = createOUProcess(0.5, 0, 0.3)
 * const v0 = ou.value   // 0 (initial)
 * const v1 = ou.next()  // small random step (dt=0.01)
 * ou.reset()            // back to mu
 *
 * // Slowly wandering filter cutoff around 1000 Hz
 * const filter = createOUProcess(0.3, 1000, 200)
 * // on each frame: filterNode.frequency.value = filter.next(0.016)
 * ```
 */
export const createOUProcess = (theta = 0.5, mu = 0, sigma = 0.3) => {
  // Hardware-boundary exception: stateful generator — same class as LCG/Lorenz.
  // const binding enforces no external rebinding; only .x is mutated inside the closure.
  const state: { x: number } = { x: mu }

  return {
    /**
     * Advance the OU process one step and return the new value.
     *
     * @param dt - Time step size. Default `0.01`.
     * @returns New value after the stochastic update.
     */
    next(dt = 0.01): number {
      state.x = state.x + theta * (mu - state.x) * dt + sigma * Math.sqrt(dt) * gaussian()
      return state.x
    },

    /**
     * Reset the process value back to the long-term mean `mu`.
     */
    reset(): void {
      state.x = mu
    },

    /**
     * The current value of the process.
     */
    get value(): number {
      return state.x
    },
  }
}
