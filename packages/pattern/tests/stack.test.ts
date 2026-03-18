import { describe, it, expect } from 'vitest'
import { stack } from '../src/transforms.js'

describe('stack', () => {
  it('stack of two binary patterns — OR logic at each step', () => {
    const fn = stack([1, 0, 0, 0], [0, 0, 1, 0])
    expect([0, 1, 2, 3].map(s => fn(s, 0))).toEqual([1, 0, 1, 0])
  })

  it('stack where neither has a hit returns 0', () => {
    const fn = stack([0, 0], [0, 0])
    expect(fn(0, 0)).toBe(0)
    expect(fn(1, 0)).toBe(0)
  })

  it('stack with three patterns', () => {
    const fn = stack([1,0,0,0], [0,1,0,0], [0,0,1,0])
    expect([0,1,2,3].map(s => fn(s, 0))).toEqual([1, 1, 1, 0])
  })

  it('stack with single pattern returns that pattern', () => {
    const fn = stack([1, 0, 1, 0])
    expect([0,1,2,3].map(s => fn(s, 0))).toEqual([1, 0, 1, 0])
  })

  it('stack with different length patterns', () => {
    // [1,0] repeats, [0,0,0,1] repeats — step 0: 1, step 1: 0, step 2: 1, step 3: 1
    const fn = stack([1, 0], [0, 0, 0, 1])
    expect([0,1,2,3].map(s => fn(s, 0))).toEqual([1, 0, 1, 1])
  })

  it('stack with function patterns', () => {
    const fn = stack(
      (step: number) => step === 0 ? 1 : 0,
      (step: number) => step === 2 ? 1 : 0
    )
    expect([0,1,2,3].map(s => fn(s, 0))).toEqual([1, 0, 1, 0])
  })

  it('stack preserves hit value (not just 1)', () => {
    const fn = stack([0, 0.5, 0], [0.8, 0, 0])
    expect(fn(0, 0)).toBe(0.8)
    expect(fn(1, 0)).toBe(0.5)
  })

  it('stack with string patterns returns first non-empty', () => {
    const fn = stack<string>(['A3', '', ''], ['', 'C4', ''])
    expect(fn(0, 0)).toBe('A3')
    expect(fn(1, 0)).toBe('C4')
    expect(fn(2, 0)).toBe(0 as unknown as string)  // both empty
  })
})
