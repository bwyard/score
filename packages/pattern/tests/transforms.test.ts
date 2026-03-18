import { describe, it, expect } from 'vitest'
import { slow, rev, every, degrade, shift } from '../src/transforms.js'
import { resolvePattern } from '../src/types.js'

describe('resolvePattern', () => {
  it('resolvePattern with array returns same array', () => {
    const arr = [1, 0, 1, 0]
    expect(resolvePattern(arr, 4)).toBe(arr)
  })

  it('resolvePattern with function calls it with correct step and bar', () => {
    const calls: Array<[number, number]> = []
    const fn = (step: number, bar: number): number => {
      calls.push([step, bar])
      return step + bar
    }
    const result = resolvePattern(fn, 3, 2)
    expect(calls).toEqual([[0, 2], [1, 2], [2, 2]])
    expect(result).toEqual([2, 3, 4])
  })

  it('resolvePattern with function returns array of correct length', () => {
    const fn = (step: number): number => step
    expect(resolvePattern(fn, 8)).toHaveLength(8)
  })
})

describe('rev', () => {
  it('rev([1,0,0,0]) → [0,0,0,1]', () => {
    const revFn = rev([1, 0, 0, 0])
    expect([0, 1, 2, 3].map(s => revFn(s, 0))).toEqual([0, 0, 0, 1])
  })

  it('rev reverses an even pattern', () => {
    const revFn = rev([1, 2, 3, 4])
    expect([0, 1, 2, 3].map(s => revFn(s, 0))).toEqual([4, 3, 2, 1])
  })
})

describe('degrade', () => {
  it('degrade(0, pat) never drops hits', () => {
    const pat = [1, 1, 1, 1, 1, 1, 1, 1]
    const degradeFn = degrade(0, pat)
    const result = Array.from({ length: 8 }, (_, s) => degradeFn(s, 0))
    expect(result).toEqual([1, 1, 1, 1, 1, 1, 1, 1])
  })

  it('degrade(1, pat) drops all hits', () => {
    const pat = [1, 1, 1, 1, 1, 1, 1, 1]
    const degradeFn = degrade(1, pat)
    const result = Array.from({ length: 8 }, (_, s) => degradeFn(s, 0))
    expect(result).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
  })

  it('degrade preserves zeros regardless of probability', () => {
    const pat = [0, 1, 0, 1]
    const degradeFn = degrade(0, pat)
    // Zeros always stay zero
    expect(degradeFn(0, 0)).toBe(0)
    expect(degradeFn(2, 0)).toBe(0)
  })
})

describe('shift', () => {
  it('shift(1, [1,0,0,0]) → [0,1,0,0]', () => {
    const shiftFn = shift(1, [1, 0, 0, 0])
    expect([0, 1, 2, 3].map(s => shiftFn(s, 0))).toEqual([0, 1, 0, 0])
  })

  it('shift(2, [1,0,1,0]) rotates correctly', () => {
    const shiftFn = shift(2, [1, 0, 1, 0])
    expect([0, 1, 2, 3].map(s => shiftFn(s, 0))).toEqual([1, 0, 1, 0])
  })

  it('shift(0, pattern) returns same values', () => {
    const pat = [1, 0, 0, 1]
    const shiftFn = shift(0, pat)
    expect([0, 1, 2, 3].map(s => shiftFn(s, 0))).toEqual([1, 0, 0, 1])
  })
})

describe('slow', () => {
  it('slow(2) halves the playback speed', () => {
    const pat = [1, 0, 1, 0]
    const slowFn = slow(2, pat)
    // Each pattern value repeats twice
    expect([0, 1, 2, 3].map(s => slowFn(s, 0))).toEqual([1, 1, 0, 0])
  })
})

describe('every', () => {
  it('every(2, rev, pat) applies rev on even bars', () => {
    const pat = [1, 0, 0, 0]
    const everyFn = every(2, rev, pat)
    // bar=0 (even) → rev applied → [0,0,0,1]
    expect([0, 1, 2, 3].map(s => everyFn(s, 0))).toEqual([0, 0, 0, 1])
    // bar=1 (odd) → original → [1,0,0,0]
    expect([0, 1, 2, 3].map(s => everyFn(s, 1))).toEqual([1, 0, 0, 0])
  })
})
