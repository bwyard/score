// Lyapunov exponent estimation for the logistic map
// Positive exponent = chaos (trajectories diverge)
// Negative exponent = stability (trajectories converge)
// Zero = bifurcation boundary

import { ScoreError } from '@score/core'

/**
 * Estimate the Lyapunov exponent of the logistic map at growth rate `r`.
 *
 * The Lyapunov exponent measures the average rate of divergence between
 * nearby trajectories. A **positive** value indicates chaos — nearby initial
 * conditions diverge exponentially. A **negative** value indicates stability —
 * trajectories converge to a fixed point or limit cycle.
 *
 * The logistic map transitions from stable (r < 3) to period-doubling
 * (3 < r < 3.57) to fully chaotic (r ≈ 3.57–4) behaviour.
 *
 * Computed as: `λ = (1/N) * Σ ln|r * (1 - 2x_n)|`
 *
 * @param r - Growth rate in (0, 4]. Use `r=4` for maximum chaos.
 * @param x0 - Initial value in [0, 1]. Default `0.5`.
 * @param iterations - Number of iterations to average over. Default `1000`.
 * @returns Estimated Lyapunov exponent. Positive = chaotic, negative = stable.
 * @throws {ScoreError} if `r ≤ 0` or `r > 4`.
 *
 * @example
 * ```ts
 * lyapunovExponent(4)    // → ≈ 0.693 (ln 2) — maximally chaotic
 * lyapunovExponent(2)    // → negative — stable fixed point
 * lyapunovExponent(3.57) // → ≈ 0 — edge of chaos
 *
 * // Only drive modulation from chaotic regimes
 * if (lyapunovExponent(r) > 0) useLogisticMap(r)
 * ```
 */
export const lyapunovExponent = (r: number, x0 = 0.5, iterations = 1000): number => {
  if (r <= 0 || r > 4) {
    throw ScoreError('lyapunovExponent: r must be in (0, 4]', {
      received: r,
      fix: 'Pass r in (0, 4]. Use r=4 for maximum chaos.',
      docs: 'https://en.wikipedia.org/wiki/Lyapunov_exponent',
      code: 'LYAPUNOV_INVALID_R',
    })
  }

  let x = x0
  let sum = 0
  for (let i = 0; i < iterations; i++) {
    const derivative = Math.abs(r * (1 - 2 * x))
    // Clamp to small epsilon so stable fixed points produce large-negative (not -Infinity)
    sum += Math.log(Math.max(derivative, 1e-15))
    x = r * x * (1 - x)
  }
  return sum / iterations
}
