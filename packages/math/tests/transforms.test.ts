import { describe, it, expect } from 'vitest'
import { range, normalize, clip, smooth, quantize, interp } from '../src/transforms.js'

describe('range', () => {
  it('maps [0, 0.5, 1] to [0, 5, 10] for range(0, 10)', () => {
    expect(range(0, 10, [0, 0.5, 1])).toEqual([0, 5, 10])
  })

  it('maps [0, 1] to [200, 2000] for range(200, 2000)', () => {
    expect(range(200, 2000, [0, 1])).toEqual([200, 2000])
  })

  it('maps 0.5 to the midpoint', () => {
    const result = range(100, 200, [0.5])
    expect(result[0]).toBeCloseTo(150, 5)
  })

  it('does not mutate the input array', () => {
    const input = [0, 0.5, 1]
    range(0, 10, input)
    expect(input).toEqual([0, 0.5, 1])
  })
})

describe('normalize', () => {
  it('rescales [0, 2, 4] to [0, 0.5, 1]', () => {
    const result = normalize([0, 2, 4])
    expect(result[0]).toBeCloseTo(0, 5)
    expect(result[1]).toBeCloseTo(0.5, 5)
    expect(result[2]).toBeCloseTo(1, 5)
  })

  it('returns all zeros for an all-zero input', () => {
    expect(normalize([0, 0, 0])).toEqual([0, 0, 0])
  })

  it('does not mutate the input array', () => {
    const input = [0, 2, 4]
    normalize(input)
    expect(input).toEqual([0, 2, 4])
  })
})

describe('clip', () => {
  it('clamps [-1, 0.5, 2] to [0, 0.5, 1] with clip(0, 1)', () => {
    const result = clip(0, 1, [-1, 0.5, 2])
    expect(result[0]).toBeCloseTo(0, 5)
    expect(result[1]).toBeCloseTo(0.5, 5)
    expect(result[2]).toBeCloseTo(1, 5)
  })

  it('leaves values already within range unchanged', () => {
    expect(clip(0, 10, [2, 5, 8])).toEqual([2, 5, 8])
  })

  it('does not mutate the input array', () => {
    const input = [-1, 0.5, 2]
    clip(0, 1, input)
    expect(input).toEqual([-1, 0.5, 2])
  })
})

describe('smooth', () => {
  it('window of 1 returns the original values unchanged', () => {
    const result = smooth(1, [1, 3, 5])
    expect(result[0]).toBeCloseTo(1, 5)
    expect(result[1]).toBeCloseTo(3, 5)
    expect(result[2]).toBeCloseTo(5, 5)
  })

  it('window of 2 averages each value with the previous', () => {
    const result = smooth(2, [1, 3, 5])
    // i=0: avg([1]) = 1
    // i=1: avg([1,3]) = 2
    // i=2: avg([3,5]) = 4
    expect(result[0]).toBeCloseTo(1, 5)
    expect(result[1]).toBeCloseTo(2, 5)
    expect(result[2]).toBeCloseTo(4, 5)
  })

  it('produces an array of the same length as the input', () => {
    expect(smooth(3, [1, 2, 3, 4, 5])).toHaveLength(5)
  })

  it('does not mutate the input array', () => {
    const input = [1, 3, 5]
    smooth(2, input)
    expect(input).toEqual([1, 3, 5])
  })
})

describe('quantize', () => {
  it('snaps [0, 0.3, 0.7, 1] to 4 steps → [0, 0.25, 0.75, 1]', () => {
    const result = quantize(4, [0, 0.3, 0.7, 1])
    expect(result[0]).toBeCloseTo(0, 5)
    expect(result[1]).toBeCloseTo(0.25, 5)
    expect(result[2]).toBeCloseTo(0.75, 5)
    expect(result[3]).toBeCloseTo(1, 5)
  })

  it('snaps 0.5 exactly to the midpoint for any even number of steps', () => {
    const result = quantize(4, [0.5])
    expect(result[0]).toBeCloseTo(0.5, 5)
  })

  it('does not mutate the input array', () => {
    const input = [0, 0.3, 0.7, 1]
    quantize(4, input)
    expect(input).toEqual([0, 0.3, 0.7, 1])
  })
})

describe('interp', () => {
  it('returns a fully at t=0', () => {
    expect(interp([0, 0], [1, 1], 0)).toEqual([0, 0])
  })

  it('returns b fully at t=1', () => {
    expect(interp([0, 0], [1, 1], 1)).toEqual([1, 1])
  })

  it('returns midpoint at t=0.5', () => {
    const result = interp([0, 0], [1, 1], 0.5)
    expect(result[0]).toBeCloseTo(0.5, 5)
    expect(result[1]).toBeCloseTo(0.5, 5)
  })

  it('interpolates correctly at t=0.25', () => {
    const result = interp([0, 0], [4, 8], 0.25)
    expect(result[0]).toBeCloseTo(1, 5)
    expect(result[1]).toBeCloseTo(2, 5)
  })

  it('does not mutate either input array', () => {
    const a = [0, 0]
    const b = [1, 1]
    interp(a, b, 0.5)
    expect(a).toEqual([0, 0])
    expect(b).toEqual([1, 1])
  })
})
