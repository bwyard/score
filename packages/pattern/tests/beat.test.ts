import { describe, it, expect } from 'vitest'
import { beat } from '../src/transforms.js'

describe('beat', () => {
  it('beat returns an array', () => {
    expect(Array.isArray(beat(1, 0, 0, 0))).toBe(true)
  })

  it('beat(1,0,0,0) → [1,0,0,0]', () => {
    expect(beat(1, 0, 0, 0)).toEqual([1, 0, 0, 0])
  })

  it('beat with 16 steps', () => {
    const p = beat(1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0)
    expect(p).toHaveLength(16)
    expect(p[0]).toBe(1)
    expect(p[4]).toBe(1)
  })

  it('beat with strings', () => {
    expect(beat('A3', '', 'C4', '')).toEqual(['A3', '', 'C4', ''])
  })

  it('beat with no args returns empty array', () => {
    expect(beat()).toEqual([])
  })
})
