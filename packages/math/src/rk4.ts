// Generic 4th-order Runge-Kutta integrator
// Reusable for any system of ODEs — lorenz, pendulum, etc.

/**
 * A function that computes the derivative of state T at time t.
 *
 * @template T - The state type (e.g. `{ x: number; y: number; z: number }`)
 */
export type DerivFn<T> = (state: T, t: number) => T

/**
 * A function that adds two states of type T component-wise.
 *
 * @template T - The state type
 */
export type AddFn<T> = (a: T, b: T) => T

/**
 * A function that scales a state of type T by a scalar k.
 *
 * @template T - The state type
 */
export type ScaleFn<T> = (a: T, k: number) => T

/**
 * Advance a system of ODEs by one step using 4th-order Runge-Kutta (RK4).
 *
 * RK4 is a standard numerical integration method that estimates the next
 * state by computing four derivative samples per step and combining them
 * with weights 1/6, 1/3, 1/3, 1/6. It is far more accurate than Euler's
 * method and suitable for smooth dynamical systems like the Lorenz attractor.
 *
 * @param state - Current state of the system.
 * @param t - Current time.
 * @param dt - Time step size. Smaller = more accurate; typical values 0.001–0.01.
 * @param deriv - Derivative function: `(state, t) => dState/dt`.
 * @param add - Component-wise addition of two states.
 * @param scale - Scalar multiplication of a state.
 * @returns New state after advancing time by `dt`. Input state is not mutated.
 *
 * @example
 * ```ts
 * // Solve dy/dt = y (exponential growth) starting at y=1
 * const deriv = (y: number, _t: number) => y
 * const add = (a: number, b: number) => a + b
 * const scale = (a: number, k: number) => a * k
 * const y1 = rk4(1, 0, 0.1, deriv, add, scale) // ≈ 1.10517 (e^0.1)
 * ```
 */
export const rk4 = <T>(
  state: T,
  t: number,
  dt: number,
  deriv: DerivFn<T>,
  add: AddFn<T>,
  scale: ScaleFn<T>,
): T => {
  const k1 = deriv(state, t)
  const k2 = deriv(add(state, scale(k1, dt / 2)), t + dt / 2)
  const k3 = deriv(add(state, scale(k2, dt / 2)), t + dt / 2)
  const k4 = deriv(add(state, scale(k3, dt)), t + dt)

  return add(
    state,
    scale(
      add(add(add(k1, scale(k2, 2)), scale(k3, 2)), k4),
      dt / 6,
    ),
  )
}
