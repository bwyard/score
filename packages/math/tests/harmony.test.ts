import { describe, it, expect } from 'vitest'
import { circleOfFifths } from '../src/harmony/circle.js'
import { just, pythagorean, meantone, edo19, edo31 } from '../src/harmony/tuning.js'

describe('circleOfFifths', () => {
  it('position 0 is C', () => {
    expect(circleOfFifths(0)).toBe('C')
  })

  it('position 1 is G', () => {
    expect(circleOfFifths(1)).toBe('G')
  })

  it('position 11 is F', () => {
    expect(circleOfFifths(11)).toBe('F')
  })

  it('position 12 wraps to C', () => {
    expect(circleOfFifths(12)).toBe('C')
  })

  it('position 13 wraps to G', () => {
    expect(circleOfFifths(13)).toBe('G')
  })

  it('position -1 wraps to F', () => {
    expect(circleOfFifths(-1)).toBe('F')
  })

  it('position 7 is C#', () => {
    expect(circleOfFifths(7)).toBe('C#')
  })
})

describe('just', () => {
  it('C ratio is exactly 1', () => {
    expect(just()['C']).toBe(1)
  })

  it('E ratio is exactly 1.25 (pure 5/4)', () => {
    expect(just()['E']).toBeCloseTo(1.25, 10)
  })

  it('G ratio is exactly 1.5 (pure 3/2)', () => {
    expect(just()['G']).toBeCloseTo(1.5, 10)
  })

  it('contains all 12 chromatic note names', () => {
    const t = just()
    const keys = Object.keys(t)
    expect(keys.length).toBe(12)
  })
})

describe('pythagorean', () => {
  it('C ratio is exactly 1', () => {
    expect(pythagorean()['C']).toBe(1)
  })

  it('G ratio is exactly 1.5 (pure fifth 3/2)', () => {
    expect(pythagorean()['G']).toBeCloseTo(1.5, 10)
  })

  it('D ratio is 9/8', () => {
    expect(pythagorean()['D']).toBeCloseTo(9 / 8, 10)
  })
})

describe('meantone', () => {
  it('C ratio is exactly 1', () => {
    expect(meantone()['C']).toBe(1)
  })

  it('E ratio is exactly 1.25 (pure major third 5/4)', () => {
    expect(meantone()['E']).toBeCloseTo(1.25, 10)
  })
})

describe('edo19', () => {
  it('contains exactly 19 entries', () => {
    expect(Object.keys(edo19()).length).toBe(19)
  })

  it('step 0 is ratio 1 (unison)', () => {
    expect(edo19()[0]).toBeCloseTo(1, 10)
  })

  it('12 steps approximates 2^(12/19)', () => {
    const expected = Math.pow(2, 12 / 19)
    expect(edo19()[12]).toBeCloseTo(expected, 5)
  })

  it('all ratios are greater than or equal to 1', () => {
    for (const v of Object.values(edo19())) {
      expect(v).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('edo31', () => {
  it('contains exactly 31 entries', () => {
    expect(Object.keys(edo31()).length).toBe(31)
  })

  it('has more entries than edo19', () => {
    expect(Object.keys(edo31()).length).toBeGreaterThan(Object.keys(edo19()).length)
  })

  it('step 0 is ratio 1 (unison)', () => {
    expect(edo31()[0]).toBeCloseTo(1, 10)
  })

  it('all ratios are greater than or equal to 1', () => {
    for (const v of Object.values(edo31())) {
      expect(v).toBeGreaterThanOrEqual(1)
    }
  })
})
