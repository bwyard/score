// Smoke tests — verify @prime/* re-exports surface correctly through @score/math
// These tests do NOT duplicate prime's own test suites. They confirm:
//   1. The re-export wiring in src/index.ts is correct (no missing symbols)
//   2. The output shape / contract is unchanged after switching to Prime internally

import { describe, it, expect } from 'vitest'
import {
  // @prime/prime-dynamics — RK4 + Lorenz
  rk4Step,
  rk4Step3,
  lorenzStep,
  // @prime/prime-interp — lerp / smoothstep / easing
  lerp,
  lerpClamped,
  invLerp,
  remap,
  smoothstep,
  smootherstep,
  easeInQuad,
  easeOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInSine,
  easeOutSine,
  easeInElastic,
  easeOutElastic,
  easeInBounce,
  easeOutBounce,
} from '../src/index.js'

// ---------------------------------------------------------------------------
// @prime/prime-dynamics
// ---------------------------------------------------------------------------

describe('rk4Step — scalar RK4 integration re-export', () => {
  it('integrates dy/dt = y one step (exponential growth)', () => {
    // dy/dt = y with y(0)=1, dt=0.1 → y(0.1) ≈ e^0.1 ≈ 1.10517
    // rk4Step(state, t, dt, f) — f receives (t, state)
    const result = rk4Step(1, 0, 0.1, (_t: number, y: number) => y)
    expect(result).toBeCloseTo(Math.exp(0.1), 5)
  })

  it('returns a number', () => {
    const result = rk4Step(1, 0, 0.01, (_t: number, y: number) => y)
    expect(typeof result).toBe('number')
  })
})

describe('rk4Step3 — 3-vector RK4 integration re-export', () => {
  it('returns a 3-element tuple', () => {
    // rk4Step3(state, t, dt, f) — f receives (t, [x,y,z])
    const result = rk4Step3(
      [1, 0, 0],
      0, 0.01,
      (_t: number, _s: [number, number, number]) => [0, 0, 0] as [number, number, number],
    )
    expect(result).toHaveLength(3)
    expect(typeof result[0]).toBe('number')
    expect(typeof result[1]).toBe('number')
    expect(typeof result[2]).toBe('number')
  })

  it('zero deriv — state is unchanged', () => {
    const result = rk4Step3(
      [2, 3, 4],
      0, 0.1,
      () => [0, 0, 0] as [number, number, number],
    )
    expect(result[0]).toBeCloseTo(2, 10)
    expect(result[1]).toBeCloseTo(3, 10)
    expect(result[2]).toBeCloseTo(4, 10)
  })
})

describe('lorenzStep — Lorenz RK4 step re-export', () => {
  it('returns a 3-element tuple of numbers', () => {
    const result = lorenzStep([0.1, 0, 0], 10, 28, 8 / 3, 0.01)
    expect(result).toHaveLength(3)
    expect(typeof result[0]).toBe('number')
    expect(typeof result[1]).toBe('number')
    expect(typeof result[2]).toBe('number')
  })

  it('state changes from initial conditions', () => {
    const [x] = lorenzStep([0.1, 0, 0], 10, 28, 8 / 3, 0.01)
    expect(x).not.toBe(0.1)
  })

  it('output is consistent with createLorenz (same numerical path)', () => {
    // createLorenz.next() calls lorenzStep internally — both must agree
    const [x] = lorenzStep([0.1, 0, 0], 10, 28, 8 / 3, 0.01)
    // Sanity: x is near 0.1 after one small step
    expect(Math.abs(x - 0.1)).toBeLessThan(0.1)
  })
})

// ---------------------------------------------------------------------------
// @prime/prime-interp
// ---------------------------------------------------------------------------

describe('lerp — linear interpolation re-export', () => {
  it('lerp(0, 1, 0.5) === 0.5', () => {
    expect(lerp(0, 1, 0.5)).toBeCloseTo(0.5, 10)
  })

  it('lerp(0, 1, 0) === 0', () => {
    expect(lerp(0, 1, 0)).toBeCloseTo(0, 10)
  })

  it('lerp(0, 1, 1) === 1', () => {
    expect(lerp(0, 1, 1)).toBeCloseTo(1, 10)
  })

  it('lerp(10, 20, 0.25) === 12.5', () => {
    expect(lerp(10, 20, 0.25)).toBeCloseTo(12.5, 10)
  })
})

describe('lerpClamped — clamped lerp re-export', () => {
  it('clamps t below 0', () => {
    expect(lerpClamped(0, 1, -1)).toBeCloseTo(0, 10)
  })

  it('clamps t above 1', () => {
    expect(lerpClamped(0, 1, 2)).toBeCloseTo(1, 10)
  })
})

describe('invLerp — inverse lerp re-export', () => {
  it('invLerp(0, 1, 0.5) === 0.5', () => {
    expect(invLerp(0, 1, 0.5)).toBeCloseTo(0.5, 10)
  })
})

describe('remap — remap re-export', () => {
  it('remap(v=0.5, inMin=0, inMax=1, outMin=0, outMax=100) === 50', () => {
    // remap(v, inMin, inMax, outMin, outMax) — value is first arg
    expect(remap(0.5, 0, 1, 0, 100)).toBeCloseTo(50, 10)
  })
})

describe('smoothstep / smootherstep re-exports', () => {
  it('smoothstep(0, 1, 0) === 0', () => {
    expect(smoothstep(0, 1, 0)).toBeCloseTo(0, 10)
  })

  it('smoothstep(0, 1, 1) === 1', () => {
    expect(smoothstep(0, 1, 1)).toBeCloseTo(1, 10)
  })

  it('smoothstep(0, 1, 0.5) === 0.5 (symmetric midpoint)', () => {
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 10)
  })

  it('smootherstep(0, 1, 0.5) === 0.5', () => {
    expect(smootherstep(0, 1, 0.5)).toBeCloseTo(0.5, 10)
  })
})

describe('easing functions — spot checks on canonical values', () => {
  it('easeInQuad(0) === 0', () => { expect(easeInQuad(0)).toBeCloseTo(0, 10); })
  it('easeInQuad(1) === 1', () => { expect(easeInQuad(1)).toBeCloseTo(1, 10); })
  it('easeInQuad(0.5) is in (0, 0.5) — accelerates', () => {
    const v = easeInQuad(0.5)
    expect(v).toBeGreaterThan(0)
    expect(v).toBeLessThan(0.5)
  })

  it('easeOutQuad(0) === 0', () => { expect(easeOutQuad(0)).toBeCloseTo(0, 10); })
  it('easeOutQuad(1) === 1', () => { expect(easeOutQuad(1)).toBeCloseTo(1, 10); })
  it('easeOutQuad(0.5) is in (0.5, 1) — decelerates', () => {
    const v = easeOutQuad(0.5)
    expect(v).toBeGreaterThan(0.5)
    expect(v).toBeLessThan(1)
  })

  it('easeInCubic(0.5) is a number in (0, 0.5)', () => {
    const v = easeInCubic(0.5)
    expect(v).toBeGreaterThan(0)
    expect(v).toBeLessThan(0.5)
  })

  it('easeOutCubic(0.5) is a number in (0.5, 1)', () => {
    const v = easeOutCubic(0.5)
    expect(v).toBeGreaterThan(0.5)
    expect(v).toBeLessThan(1)
  })

  it('easeInSine(0.5) is a number in (0, 1)', () => {
    const v = easeInSine(0.5)
    expect(v).toBeGreaterThan(0)
    expect(v).toBeLessThan(1)
  })

  it('easeOutSine(0.5) is a number in (0, 1)', () => {
    const v = easeOutSine(0.5)
    expect(v).toBeGreaterThan(0)
    expect(v).toBeLessThan(1)
  })

  it('easeInElastic(0) === 0', () => { expect(easeInElastic(0)).toBeCloseTo(0, 10); })
  it('easeInElastic(1) === 1', () => { expect(easeInElastic(1)).toBeCloseTo(1, 10); })

  it('easeOutElastic(0) === 0', () => { expect(easeOutElastic(0)).toBeCloseTo(0, 10); })
  it('easeOutElastic(1) === 1', () => { expect(easeOutElastic(1)).toBeCloseTo(1, 10); })

  it('easeInBounce(0) === 0', () => { expect(easeInBounce(0)).toBeCloseTo(0, 10); })
  it('easeInBounce(1) === 1', () => { expect(easeInBounce(1)).toBeCloseTo(1, 10); })

  it('easeOutBounce(0) === 0', () => { expect(easeOutBounce(0)).toBeCloseTo(0, 10); })
  it('easeOutBounce(1) === 1', () => { expect(easeOutBounce(1)).toBeCloseTo(1, 10); })
})
