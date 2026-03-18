import { describe, it, expect } from 'vitest'
import { entropy, isMusical, density } from '../src/entropy.js'

describe('entropy', () => {
  it('returns 0 for empty pattern', () => {
    expect(entropy([])).toBe(0)
  })

  it('returns 0 for all-hits pattern (no entropy)', () => {
    expect(entropy([1, 1, 1, 1])).toBe(0)
  })

  it('returns 0 for all-silence pattern (no entropy)', () => {
    expect(entropy([0, 0, 0, 0])).toBe(0)
  })

  it('returns 1 for perfectly alternating pattern (maximum entropy)', () => {
    expect(entropy([1, 0, 1, 0, 1, 0, 1, 0])).toBeCloseTo(1, 10)
  })
})

describe('isMusical', () => {
  it('returns true for a sparse musical pattern', () => {
    expect(isMusical([1, 0, 0, 0, 1, 0, 0, 0])).toBe(true)
  })

  it('returns false for all-hits pattern (entropy is 0)', () => {
    expect(isMusical([1, 1, 1, 1, 1, 1, 1, 1])).toBe(false)
  })
})

describe('density', () => {
  it('returns 0.25 for one hit per 4 steps', () => {
    expect(density([1, 0, 0, 0, 1, 0, 0, 0])).toBe(0.25)
  })

  it('returns 0.5 for half hits', () => {
    expect(density([1, 1, 0, 0])).toBe(0.5)
  })
})
