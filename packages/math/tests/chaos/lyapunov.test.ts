import { describe, it, expect } from 'vitest'
import { lyapunovExponent } from '../../src/chaos/lyapunov.js'

describe('lyapunovExponent', () => {
  it('returns a number', () => {
    expect(lyapunovExponent(3.9)).toBeTypeOf('number')
  })

  it('r=4 gives a positive exponent (maximally chaotic)', () => {
    // x0=0.1 gives a non-degenerate orbit; theoretical value ≈ ln(2) ≈ 0.693
    const exp = lyapunovExponent(4, 0.1, 2000)
    expect(exp).toBeGreaterThan(0)
    expect(exp).toBeCloseTo(Math.log(2), 1)
  })

  it('r=2 gives a negative exponent (stable fixed point)', () => {
    // x0=0.1 converges to fixed point 0.5; derivative→0 → large negative
    const exp = lyapunovExponent(2, 0.1, 1000)
    expect(exp).toBeLessThan(0)
  })

  it('r=3.9 gives a positive exponent (chaos)', () => {
    const exp = lyapunovExponent(3.9, 0.1, 1000)
    expect(exp).toBeGreaterThan(0)
  })

  it('throws ScoreError if r <= 0', () => {
    expect(() => lyapunovExponent(0)).toThrow()
    expect(() => lyapunovExponent(-1)).toThrow()
  })

  it('throws ScoreError if r > 4', () => {
    expect(() => lyapunovExponent(4.1)).toThrow()
  })
})
