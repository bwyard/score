import { describe, it, expect } from 'vitest'
import { rk4 } from '../src/rk4.js'

describe('rk4', () => {
  it('integrates dy/dt = y (exponential growth) one step', () => {
    // y(t) = e^t, so y(0.1) ≈ 1.10517
    const deriv = (y: number, _t: number) => y
    const add = (a: number, b: number) => a + b
    const scale = (a: number, k: number) => a * k
    const result = rk4(1, 0, 0.1, deriv, add, scale)
    expect(result).toBeCloseTo(Math.exp(0.1), 5)
  })

  it('integrates dy/dt = y with a smaller step — closer to exact', () => {
    const deriv = (y: number, _t: number) => y
    const add = (a: number, b: number) => a + b
    const scale = (a: number, k: number) => a * k
    const result = rk4(1, 0, 0.001, deriv, add, scale)
    expect(result).toBeCloseTo(Math.exp(0.001), 9)
  })

  it('integrates dy/dt = 0 — state is unchanged', () => {
    const deriv = (_y: number, _t: number) => 0
    const add = (a: number, b: number) => a + b
    const scale = (a: number, k: number) => a * k
    const result = rk4(5, 0, 0.1, deriv, add, scale)
    expect(result).toBeCloseTo(5, 10)
  })

  it('does not mutate the input state (number — primitive, immutable by nature)', () => {
    const deriv = (y: number, _t: number) => y
    const add = (a: number, b: number) => a + b
    const scale = (a: number, k: number) => a * k
    const initial = 1
    const _ = rk4(initial, 0, 0.1, deriv, add, scale)
    expect(initial).toBe(1)
  })

  it('works with object state — Lorenz-like 2D system', () => {
    type State = { x: number; y: number }
    // dx/dt = y, dy/dt = -x → simple harmonic oscillator
    const deriv = (s: State, _t: number): State => ({ x: s.y, y: -s.x })
    const add = (a: State, b: State): State => ({ x: a.x + b.x, y: a.y + b.y })
    const scale = (a: State, k: number): State => ({ x: a.x * k, y: a.y * k })
    const s0: State = { x: 1, y: 0 }
    const s1 = rk4(s0, 0, 0.01, deriv, add, scale)
    // x(t) = cos(t), y(t) = -sin(t)
    expect(s1.x).toBeCloseTo(Math.cos(0.01), 6)
    expect(s1.y).toBeCloseTo(-Math.sin(0.01), 6)
  })

  it('does not mutate the input object state', () => {
    type State = { x: number; y: number }
    const deriv = (s: State, _t: number): State => ({ x: s.y, y: -s.x })
    const add = (a: State, b: State): State => ({ x: a.x + b.x, y: a.y + b.y })
    const scale = (a: State, k: number): State => ({ x: a.x * k, y: a.y * k })
    const s0: State = { x: 1, y: 0 }
    const _ = rk4(s0, 0, 0.1, deriv, add, scale)
    expect(s0.x).toBe(1)
    expect(s0.y).toBe(0)
  })
})
