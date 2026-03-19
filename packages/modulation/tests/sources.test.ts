import { describe, it, expect } from 'vitest'
import { ramp, sine, cosine } from '../src/sources.js'

describe('ramp', () => {
  it('ramp(0, 1, 8)(0, 0) → 0 (start value at bar 0)', () => {
    expect(ramp(0, 1, 8)(0, 0)).toBe(0)
  })

  it('ramp(0, 1, 8)(0, 8) → 1 (end value at bar 8)', () => {
    expect(ramp(0, 1, 8)(0, 8)).toBe(1)
  })

  it('ramp(0, 1, 8)(0, 4) → 0.5 (midpoint)', () => {
    expect(ramp(0, 1, 8)(0, 4)).toBe(0.5)
  })

  it('ramp(0, 100, 4)(0, 2) → 50', () => {
    expect(ramp(0, 100, 4)(0, 2)).toBe(50)
  })

  it('ramp(10, 20, 10)(0, 15) → 20 (clamped after bars elapsed)', () => {
    expect(ramp(10, 20, 10)(0, 15)).toBe(20)
  })

  it('ramp clamps at to value beyond bar count', () => {
    expect(ramp(0, 1, 4)(0, 100)).toBe(1)
  })

  it('step argument is ignored (bar drives the value)', () => {
    expect(ramp(0, 1, 8)(99, 4)).toBe(0.5)
  })

  it('ramp with negative from to positive to works', () => {
    expect(ramp(-1, 1, 2)(0, 1)).toBe(0)
  })

  it('default bars=8 works', () => {
    expect(ramp(0, 8)(0, 4)).toBe(4)
  })
})

describe('sine', () => {
  it('sine(4, 1, 0)(0, 0) → 0 (sin(0) = 0)', () => {
    expect(sine(4, 1, 0)(0, 0)).toBeCloseTo(0)
  })

  it('sine(4, 1, 0)(0, 1) → sin(π/2) ≈ 1', () => {
    expect(sine(4, 1, 0)(0, 1)).toBeCloseTo(Math.sin(Math.PI / 2))
  })

  it('sine(4, 1, 5)(0, 0) → 5 (center=5, sin(0)=0)', () => {
    expect(sine(4, 1, 5)(0, 0)).toBeCloseTo(5)
  })

  it('sine oscillates between center-depth and center+depth', () => {
    const s = sine(4, 200, 1000)
    // bar 1 = quarter cycle = peak
    expect(s(0, 1)).toBeCloseTo(1200)
    // bar 3 = three-quarter cycle = trough
    expect(s(0, 3)).toBeCloseTo(800)
  })

  it('step argument is ignored', () => {
    expect(sine(4, 1, 0)(99, 0)).toBeCloseTo(0)
  })

  it('default depth=1 and center=0', () => {
    expect(sine(4)(0, 1)).toBeCloseTo(1)
  })
})

describe('cosine', () => {
  it('cosine(4, 1, 0)(0, 0) → 1 (cos(0) = 1)', () => {
    expect(cosine(4, 1, 0)(0, 0)).toBeCloseTo(1)
  })

  it('cosine(4, 1, 0)(0, 2) → -1 (cos(π) = -1)', () => {
    expect(cosine(4, 1, 0)(0, 2)).toBeCloseTo(-1)
  })

  it('cosine(4, 1, 5)(0, 0) → 6 (center=5, cos(0)=1, depth=1)', () => {
    expect(cosine(4, 1, 5)(0, 0)).toBeCloseTo(6)
  })

  it('step argument is ignored', () => {
    expect(cosine(4, 1, 0)(99, 0)).toBeCloseTo(1)
  })

  it('default depth=1 and center=0', () => {
    expect(cosine(4)(0, 0)).toBeCloseTo(1)
  })
})
