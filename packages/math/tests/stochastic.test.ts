import { describe, it, expect } from 'vitest'
import { drunk, markov } from '../src/stochastic.js'

describe('drunk', () => {
  it('returns an array of the requested length', () => {
    expect(drunk(1, 8)).toHaveLength(8)
  })

  it('returns length 16 when requested', () => {
    expect(drunk(0.1, 16)).toHaveLength(16)
  })

  it('all values are in [0, 1] regardless of stepSize', () => {
    const result = drunk(0.1, 16)
    for (const v of result) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('all values are 0.5 when stepSize is 0 (no movement)', () => {
    const result = drunk(0, 16)
    for (const v of result) {
      expect(v).toBeCloseTo(0.5, 10)
    }
  })

  it('same seed produces the same sequence', () => {
    const a = drunk(0.1, 16, 42)
    const b = drunk(0.1, 16, 42)
    expect(a).toEqual(b)
  })

  it('different seeds produce different sequences', () => {
    const a = drunk(0.1, 16, 42)
    const b = drunk(0.1, 16, 99)
    expect(a).not.toEqual(b)
  })

  it('values with large stepSize still stay in [0, 1]', () => {
    const result = drunk(1, 32)
    for (const v of result) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('starts at 0.5', () => {
    const result = drunk(0.1, 4, 42)
    expect(result[0]).toBeCloseTo(0.5, 10)
  })
})

describe('markov', () => {
  it('returns an array of the requested length', () => {
    const result = markov([[0.5, 0.5], [0.5, 0.5]], 8)
    expect(result).toHaveLength(8)
  })

  it('all states stay at 0 with a stay-in-state-0 matrix', () => {
    const stay = [[1, 0], [0, 1]]
    const result = markov(stay, 8)
    expect(result.every(v => v === 0)).toBe(true)
  })

  it('alternates 0,1,0,1 with a pure-alternation matrix', () => {
    const alternate = [[0, 1], [1, 0]]
    const result = markov(alternate, 4)
    expect(result).toEqual([0, 1, 0, 1])
  })

  it('same seed produces the same sequence', () => {
    const matrix = [
      [0.7, 0.2, 0.1],
      [0.3, 0.4, 0.3],
      [0.1, 0.1, 0.8],
    ]
    const a = markov(matrix, 16, 42)
    const b = markov(matrix, 16, 42)
    expect(a).toEqual(b)
  })

  it('different seeds produce different sequences', () => {
    const matrix = [
      [0.5, 0.5],
      [0.5, 0.5],
    ]
    const a = markov(matrix, 16, 42)
    const b = markov(matrix, 16, 99)
    expect(a).not.toEqual(b)
  })

  it('all output values are valid state indices', () => {
    const matrix = [
      [0.5, 0.3, 0.2],
      [0.4, 0.4, 0.2],
      [0.2, 0.3, 0.5],
    ]
    const result = markov(matrix, 32, 42)
    for (const v of result) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(3)
    }
  })

  it('always starts at state 0', () => {
    const result = markov([[0.5, 0.5], [0.5, 0.5]], 4, 1)
    expect(result[0]).toBe(0)
  })
})
