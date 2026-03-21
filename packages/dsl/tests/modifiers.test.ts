import { describe, it, expect } from 'vitest'
import { drift, keepFor } from '../src/modifiers.js'

describe('keepFor', () => {
  it('returns the same value for all bars within a block', () => {
    // degrade-like fn that varies by bar — keepFor(4) should freeze it
    const varying = (step: number, bar: number): number => bar % 2 === 0 ? 1 : 0
    const frozen = keepFor(4, varying)
    // bars 0-3 all map to frozenBar=0 → varying(0, 0) = 1
    expect(frozen(0, 0)).toBe(1)
    expect(frozen(0, 1)).toBe(1)
    expect(frozen(0, 2)).toBe(1)
    expect(frozen(0, 3)).toBe(1)
    // bars 4-7 map to frozenBar=4 → varying(0, 4) = 1
    expect(frozen(0, 4)).toBe(1)
    // bars 4-7 with frozenBar=4 → varying(0, 4) = 1 (4 % 2 === 0)
    expect(frozen(0, 6)).toBe(1)
  })

  it('advances to next frozen block after N bars', () => {
    const varying = (step: number, bar: number): number => bar % 4 === 0 ? 1 : 2
    const frozen = keepFor(2, varying)
    // frozenBar for bar=0 is 0 → varying(0,0)=1
    expect(frozen(0, 0)).toBe(1)
    // frozenBar for bar=1 is 0 → varying(0,0)=1
    expect(frozen(0, 1)).toBe(1)
    // frozenBar for bar=2 is 2 → varying(0,2)=2
    expect(frozen(0, 2)).toBe(2)
    expect(frozen(0, 3)).toBe(2)
  })

  it('works with array patterns — same array value for all bars in block', () => {
    const fn = keepFor(4, [1, 0, 1, 0])
    expect(fn(0, 0)).toBe(1)
    expect(fn(0, 2)).toBe(1)  // still bar 0 block
    expect(fn(1, 0)).toBe(0)
    expect(fn(1, 3)).toBe(0)  // still bar 0 block
  })

  it('wraps step index correctly', () => {
    const fn = keepFor(4, [1, 2, 3, 4])
    expect(fn(4, 0)).toBe(1)  // step 4 → index 0
    expect(fn(5, 0)).toBe(2)  // step 5 → index 1
  })

  it('blocks of 1 bar behave like no freeze', () => {
    const varying = (_step: number, bar: number): number => bar
    const fn = keepFor(1, varying)
    expect(fn(0, 0)).toBe(0)
    expect(fn(0, 1)).toBe(1)
    expect(fn(0, 2)).toBe(2)
  })
})

describe('drift', () => {
  it('returns a function', () => {
    const fn = drift('A4')
    expect(typeof fn).toBe('function')
  })

  it('returns a string note on each call', () => {
    const fn = drift('A4')
    const val = fn(0, 0)
    expect(typeof val).toBe('string')
    expect(val).toMatch(/^[A-G]#?-?\d+$/)
  })

  it('sigma=0 always returns center note (no drift)', () => {
    const fn = drift('A4', 0, 0.3)
    // With sigma=0 the OU process never moves from 0, so offset rounds to 0
    expect(fn(0, 0)).toBe('A4')
    expect(fn(0, 1)).toBe('A4')
    expect(fn(0, 5)).toBe('A4')
  })

  it('returns the same value for all steps in the same bar', () => {
    const fn = drift('C4', 3, 0.5)
    const bar0val = fn(0, 0)
    expect(fn(1, 0)).toBe(bar0val)
    expect(fn(7, 0)).toBe(bar0val)
    expect(fn(15, 0)).toBe(bar0val)
  })

  it('can produce different values across bars with non-zero sigma', () => {
    const fn = drift('A4', 5, 0.8)
    const vals = Array.from({ length: 20 }, (_, b) => fn(0, b))
    const unique = new Set(vals)
    // With sigma=5 over 20 bars, very likely to drift at least once
    expect(unique.size).toBeGreaterThan(1)
  })

  it('different instances are independent', () => {
    const a = drift('C4', 2, 0.5)
    const b = drift('C4', 2, 0.5)
    // Both start from same center but are separate OU processes
    // (they may produce same or different values — just check they run)
    expect(typeof a(0, 0)).toBe('string')
    expect(typeof b(0, 0)).toBe('string')
  })
})
