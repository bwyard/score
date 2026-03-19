import { describe, it, expect } from 'vitest'
import { euclidean } from '../src/euclidean.js'

describe('euclidean', () => {
  it('euclidean(3, 8) produces classic clave rhythm [1,0,0,1,0,0,1,0]', () => {
    expect(euclidean(3, 8)).toEqual([1, 0, 0, 1, 0, 0, 1, 0])
  })

  it('euclidean(4, 16) produces four-on-floor pattern', () => {
    expect(euclidean(4, 16)).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0])
  })

  it('euclidean(0, 8) returns all zeros', () => {
    expect(euclidean(0, 8)).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
  })

  it('euclidean(8, 8) returns all ones', () => {
    expect(euclidean(8, 8)).toEqual([1, 1, 1, 1, 1, 1, 1, 1])
  })

  it('output length always equals steps', () => {
    expect(euclidean(3, 8)).toHaveLength(8)
    expect(euclidean(5, 16)).toHaveLength(16)
    expect(euclidean(7, 12)).toHaveLength(12)
  })

  it('rotation shifts pattern correctly by 1', () => {
    const base = euclidean(3, 8, 0)
    const rotated = euclidean(3, 8, 1)
    // rotation=1 means slice from index 1
    expect(rotated).toEqual([...base.slice(1), ...base.slice(0, 1)])
  })

  it('rotation shifts pattern correctly by 2', () => {
    const base = euclidean(3, 8, 0)
    const rotated = euclidean(3, 8, 2)
    expect(rotated).toEqual([...base.slice(2), ...base.slice(0, 2)])
  })

  it('rotation wraps around correctly with negative-equivalent (full cycle)', () => {
    // rotation equal to steps should equal rotation 0
    const base = euclidean(3, 8, 0)
    const rotated = euclidean(3, 8, 8)
    expect(rotated).toEqual(base)
  })

  it('euclidean(4, 4) returns all ones', () => {
    expect(euclidean(4, 4)).toEqual([1, 1, 1, 1])
  })

  it('euclidean(1, 8) places single hit at start', () => {
    expect(euclidean(1, 8)).toEqual([1, 0, 0, 0, 0, 0, 0, 0])
  })
})
