// Lorenz attractor — chaotic 3D dynamical system
// Uses RK4 integration for numerical accuracy
// Classic parameters: sigma=10, rho=28, beta=8/3 produce the iconic butterfly shape

import { rk4 } from '../rk4.js'

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

const lorenzDeriv = (sigma: number, rho: number, beta: number) =>
  (state: LorenzState, _t: number): LorenzState => ({
    x: sigma * (state.y - state.x),
    y: state.x * (rho - state.z) - state.y,
    z: state.x * state.y - beta * state.z,
  })

const lorenzAdd = (a: LorenzState, b: LorenzState): LorenzState => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
})

const lorenzScale = (a: LorenzState, k: number): LorenzState => ({
  x: a.x * k,
  y: a.y * k,
  z: a.z * k,
})

/**
 * Create a Lorenz attractor simulation using RK4 integration.
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
  const rho = params?.rho ?? 28
  const beta = params?.beta ?? 8 / 3

  const initial: LorenzState = { x: 0.1, y: 0, z: 0 }
  const deriv = lorenzDeriv(sigma, rho, beta)

  let current: LorenzState = { ...initial }
  let t = 0

  return {
    /**
     * Advance the simulation one RK4 step and return the new state.
     *
     * @param dt - Time step size. Default `0.01`.
     * @returns New `LorenzState` after advancing by `dt`.
     */
    next(dt = 0.01): LorenzState {
      current = rk4(current, t, dt, deriv, lorenzAdd, lorenzScale)
      t += dt
      return { ...current }
    },

    /**
     * Reset the simulation to the initial state and time.
     */
    reset(): void {
      current = { ...initial }
      t = 0
    },

    /**
     * The current state of the Lorenz system.
     */
    get state(): LorenzState {
      return { ...current }
    },
  }
}
