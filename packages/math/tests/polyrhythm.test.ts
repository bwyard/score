import { describe, it, expect } from 'vitest'
import { lcm, polyrhythm, patternOr, patternAnd, patternXor, patternNot, tile } from '../src/polyrhythm.js'

describe('lcm', () => {
  it('returns 12 for lcm(3, 4)', () => {
    expect(lcm(3, 4)).toBe(12)
  })

  it('returns 12 for lcm(4, 6)', () => {
    expect(lcm(4, 6)).toBe(12)
  })
})

describe('polyrhythm', () => {
  it('returns length 12 for patterns of length 3 and 4', () => {
    const result = polyrhythm([1, 0, 0], [1, 0, 0, 0])
    expect(result).toHaveLength(12)
  })
})

describe('patternOr', () => {
  it('returns union of two patterns', () => {
    expect(patternOr([1, 0, 0, 0], [0, 0, 1, 0])).toEqual([1, 0, 1, 0])
  })
})

describe('patternAnd', () => {
  it('returns intersection of two patterns', () => {
    expect(patternAnd([1, 0, 1, 0], [1, 0, 0, 0])).toEqual([1, 0, 0, 0])
  })
})

describe('patternXor', () => {
  it('returns exclusive-or of two patterns', () => {
    expect(patternXor([1, 0, 1, 0], [1, 0, 0, 0])).toEqual([0, 0, 1, 0])
  })
})

describe('patternNot', () => {
  it('returns complement of a pattern', () => {
    expect(patternNot([1, 0, 0, 0])).toEqual([0, 1, 1, 1])
  })
})

describe('tile', () => {
  it('tiles a pattern to exactly length steps', () => {
    expect(tile([1, 0], 6)).toEqual([1, 0, 1, 0, 1, 0])
  })
})
