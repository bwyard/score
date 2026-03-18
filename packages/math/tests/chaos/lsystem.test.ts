import { describe, it, expect } from 'vitest'
import { lsystem, lsystemToPattern } from '../../src/chaos/lsystem.js'

describe('lsystem', () => {
  it('generations=0 returns the axiom unchanged', () => {
    expect(lsystem('A', { A: 'AB', B: 'A' }, 0)).toBe('A')
  })

  it('simple algae rewrite: 1 generation', () => {
    // A → AB
    expect(lsystem('A', { A: 'AB', B: 'A' }, 1)).toBe('AB')
  })

  it('simple algae rewrite: 2 generations', () => {
    // A → AB → ABA (A→AB, B→A)
    expect(lsystem('A', { A: 'AB', B: 'A' }, 2)).toBe('ABA')
  })

  it('multiple generations grow the string', () => {
    const result = lsystem('F', { F: 'F+F-F-F+F' }, 2)
    expect(result.length).toBeGreaterThan('F+F-F-F+F'.length)
  })

  it('characters without rules pass through unchanged', () => {
    // '+' has no rule so it stays; F → FF
    expect(lsystem('F+F', { F: 'FF' }, 1)).toBe('FF+FF')
  })

  it('throws ScoreError if generations < 0', () => {
    expect(() => lsystem('F', { F: 'FF' }, -1)).toThrow()
  })

  it('empty axiom returns empty string', () => {
    expect(lsystem('', { A: 'B' }, 3)).toBe('')
  })

  it('axiom with no matching rules is unchanged after multiple generations', () => {
    expect(lsystem('XYZ', { A: 'B' }, 3)).toBe('XYZ')
  })
})

describe('lsystemToPattern', () => {
  it('returns an array of 0s and 1s', () => {
    const pattern = lsystemToPattern('F', { F: 'F+F-F' }, 1, 'F')
    for (const v of pattern) {
      expect([0, 1]).toContain(v)
    }
  })

  it('length matches the L-system string length', () => {
    const str = lsystem('F', { F: 'F+F' }, 2)
    const pattern = lsystemToPattern('F', { F: 'F+F' }, 2, 'F')
    expect(pattern).toHaveLength(str.length)
  })

  it('alphabet chars map to 1', () => {
    // F → F+F: result is 'F+F', alphabet 'F' → [1,0,1]
    const pattern = lsystemToPattern('F', { F: 'F+F' }, 1, 'F')
    expect(pattern).toEqual([1, 0, 1])
  })

  it('non-alphabet chars map to 0', () => {
    // '+' is not in alphabet 'F', should be 0
    const pattern = lsystemToPattern('F', { F: 'F+F' }, 1, 'F')
    expect(pattern[1]).toBe(0)
  })

  it('all chars map to 1 when all are in alphabet', () => {
    const pattern = lsystemToPattern('A', { A: 'AB', B: 'A' }, 2, 'AB')
    expect(pattern.every(v => v === 1)).toBe(true)
  })

  it('throws ScoreError if generations < 0', () => {
    expect(() => lsystemToPattern('F', { F: 'FF' }, -1, 'F')).toThrow()
  })
})
