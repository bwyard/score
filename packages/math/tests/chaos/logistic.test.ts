import { describe, it, expect } from 'vitest'
import { logisticMap, logisticSequence } from '../../src/chaos/logistic.js'

describe('logisticMap', () => {
  it('returns an array of n values', () => {
    expect(logisticMap(3.9, 0.5, 16)).toHaveLength(16)
  })

  it('all values are in [0, 1]', () => {
    const vals = logisticMap(3.9, 0.5, 32)
    for (const v of vals) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('different r produces different results', () => {
    const a = logisticMap(3.5, 0.5, 16)
    const b = logisticMap(3.9, 0.5, 16)
    expect(a).not.toEqual(b)
  })

  it('r=4 produces chaotic (non-repeating) sequence', () => {
    const vals = logisticMap(4, 0.5, 16)
    const unique = new Set(vals.map(v => v.toFixed(10)))
    // Not all the same — chaotic
    expect(unique.size).toBeGreaterThan(1)
  })

  it('throws ScoreError if r < 0', () => {
    expect(() => logisticMap(-1, 0.5, 16)).toThrow()
  })

  it('throws ScoreError if r > 4', () => {
    expect(() => logisticMap(4.1, 0.5, 16)).toThrow()
  })

  it('throws ScoreError if x0 < 0', () => {
    expect(() => logisticMap(3.9, -0.1, 16)).toThrow()
  })

  it('throws ScoreError if x0 > 1', () => {
    expect(() => logisticMap(3.9, 1.1, 16)).toThrow()
  })

  it('throws ScoreError if n < 1', () => {
    expect(() => logisticMap(3.9, 0.5, 0)).toThrow()
  })
})

describe('logisticSequence', () => {
  it('returns a function', () => {
    const seq = logisticSequence(3.9)
    expect(seq).toBeTypeOf('function')
  })

  it('produces a sequence of values in [0, 1]', () => {
    const seq = logisticSequence(3.9)
    for (let i = 0; i < 32; i++) {
      const v = seq()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('successive calls return different values (at r=3.9)', () => {
    const seq = logisticSequence(3.9)
    const v1 = seq()
    const v2 = seq()
    expect(v1).not.toBeCloseTo(v2, 5)
  })

  it('starts at x0 (first call returns x0)', () => {
    const seq = logisticSequence(3.9, 0.3)
    expect(seq()).toBeCloseTo(0.3, 10)
  })

  it('throws ScoreError if r < 0', () => {
    expect(() => logisticSequence(-0.5)).toThrow()
  })

  it('throws ScoreError if x0 > 1', () => {
    expect(() => logisticSequence(3.9, 1.5)).toThrow()
  })
})
