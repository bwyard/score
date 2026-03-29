// Lorenz attractor — chaotic 3D dynamical system
// Uses @prime/prime-dynamics lorenzStep (RK4) for numerical accuracy.
// Classic parameters: sigma=10, rho=28, beta=8/3 produce the iconic butterfly shape.

import { lorenzStep } from '@prime/prime-dynamics'

/**
 * State vector for the Lorenz attractor.
 */
export type LorenzState = { x: number; y: number; z: number }

/**
 * Parameters for the Lorenz system.
 *
 * - `sigma` controls the Prandtl number (fluid viscosity ratio)
 * - `rho` controls the Rayleigh number (temperature difference)
 * - `beta` is a geometric factor
 */
export type LorenzParams = {
  /** Prandtl number. Default `10`. */
  readonly sigma?: number
  /** Rayleigh number. Default `28`. */
  readonly rho?: number
  /** Geometric factor. Default `8/3`. */
  readonly beta?: number
}

/**
 * Create a Lorenz attractor simulation using RK4 integration from `@prime/prime-dynamics`.
 *
 * The Lorenz system is a set of three coupled ODEs:
 * - `dx/dt = sigma * (y - x)`
 * - `dy/dt = x * (rho - z) - y`
 * - `dz/dt = x * y - beta * z`
 *
 * With classic parameters (sigma=10, rho=28, beta=8/3) this system exhibits
 * chaotic behaviour — extreme sensitivity to initial conditions — making it
 * useful as a source of complex, non-repeating modulation signals.
 *
 * @param params - Optional system parameters. All have musical defaults.
 * @returns An object with `next(dt?)`, `reset()`, and a `state` getter.
 *
 * @example
 * ```ts
 * const lorenz = createLorenz()
 * const s0 = lorenz.state     // { x: 0.1, y: 0, z: 0 }
 * const s1 = lorenz.next()    // one RK4 step forward (dt=0.01)
 * const s2 = lorenz.next(0.005) // half-size step for finer detail
 * lorenz.reset()              // back to initial state
 * ```
 */
export const createLorenz = (params?: LorenzParams) => {
  const sigma = params?.sigma ?? 10
  const rho   = params?.rho   ?? 28
  const beta  = params?.beta  ?? 8 / 3

  const initial: LorenzState = { x: 0.1, y: 0, z: 0 }

  // HARDWARE BOUNDARY — stateful generator: const binding, property mutation only.
  // Named `sim` to avoid clash with the public `state` getter below.
  const sim: { current: LorenzState; t: number } = { current: { ...initial }, t: 0 }

  return {
    /**
     * Advance the simulation one RK4 step and return the new state.
     *
     * Delegates to `@prime/prime-dynamics` `lorenzStep` (pure function).
     * Object ↔ tuple conversion happens at this boundary only.
     *
     * @param dt - Time step size. Default `0.01`.
     * @returns New `LorenzState` after advancing by `dt`.
     */
    next(dt = 0.01): LorenzState {
      const [nx, ny, nz] = lorenzStep(
        [sim.current.x, sim.current.y, sim.current.z],
        sigma, rho, beta, dt,
      )
      sim.current = { x: nx, y: ny, z: nz }
      sim.t += dt
      return { ...sim.current }
    },

    /**
     * Reset the simulation to the initial state and time.
     */
    reset(): void {
      sim.current = { ...initial }
      sim.t = 0
    },

    /**
     * The current state of the Lorenz system.
     */
    get state(): LorenzState {
      return { ...sim.current }
    },
  }
}
