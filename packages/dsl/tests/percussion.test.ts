// percussion.test.ts — ChainablePart percussion factory tests
// Follows Kent C. Dodds: test observable behavior, not internal implementation.

import { describe, it, expect } from 'vitest'
import { Kick, Snare, HiHat, Kick808, Kick909, Hihat808, Snare909 } from '../src/percussion.js'

// ── Shared contract checks ────────────────────────────────────────────────────

const isChainablePart = (part: unknown): boolean => {
  if (!part || typeof part !== 'object') return false
  const p = part as Record<string, unknown>
  return (
    p._type === 'ChainablePart' &&
    p._version === 1 &&
    typeof p.id === 'string' &&
    typeof p.instrumentType === 'string' &&
    typeof p.volume === 'function' &&
    typeof p.pattern === 'undefined' // _pattern, not pattern
  )
}

// ── Kick ──────────────────────────────────────────────────────────────────────

describe('Kick', () => {
  it('returns a ChainablePart', () => {
    expect(isChainablePart(Kick())).toBe(true)
  })

  it('has instrumentType kick', () => {
    expect(Kick().instrumentType).toBe('kick')
  })

  it('has _type ChainablePart', () => {
    expect(Kick()._type).toBe('ChainablePart')
  })

  it('has no _pattern when no hits given', () => {
    expect(Kick()._pattern).toBeUndefined()
  })

  it('sets euclidean _pattern when hits given', () => {
    const part = Kick(4)
    expect(Array.isArray(part._pattern)).toBe(true)
    expect((part._pattern as number[]).length).toBe(16)
  })

  it('euclidean pattern has correct hit count', () => {
    const part = Kick(4)
    const hits = (part._pattern as number[]).filter(v => v === 1).length
    expect(hits).toBe(4)
  })

  it('produces unique id per call', () => {
    expect(Kick().id).not.toBe(Kick().id)
  })

  it('supports volume chain', () => {
    expect(Kick().volume(0.9)._volume).toBe(0.9)
  })

  it('supports reverb chain', () => {
    const part = Kick().reverb(0.1)
    expect(part._effects).toHaveLength(1)
    expect(part._effects![0]!.effectType).toBe('reverb')
  })

  it('supports swing chain', () => {
    expect(Kick().swing(0.1)._swing).toBe(0.1)
  })

  it('no-op connect/disconnect/dispose', () => {
    const part = Kick()
    expect(() => part.connect({} as never)).not.toThrow()
    expect(() => part.disconnect()).not.toThrow()
    expect(() => { part.dispose(); }).not.toThrow()
  })
})

// ── Snare ─────────────────────────────────────────────────────────────────────

describe('Snare', () => {
  it('returns a ChainablePart', () => {
    expect(isChainablePart(Snare())).toBe(true)
  })

  it('has instrumentType snare', () => {
    expect(Snare().instrumentType).toBe('snare')
  })

  it('has no _pattern when no hits given', () => {
    expect(Snare()._pattern).toBeUndefined()
  })

  it('sets euclidean _pattern when hits given', () => {
    const part = Snare(3)
    expect(Array.isArray(part._pattern)).toBe(true)
    const hits = (part._pattern as number[]).filter(v => v === 1).length
    expect(hits).toBe(3)
  })

  it('supports degrade chain', () => {
    expect(Snare().degrade(0.3)._degrade).toBe(0.3)
  })

  it('produces unique id per call', () => {
    expect(Snare().id).not.toBe(Snare().id)
  })
})

// ── HiHat ─────────────────────────────────────────────────────────────────────

describe('HiHat', () => {
  it('returns a ChainablePart', () => {
    expect(isChainablePart(HiHat())).toBe(true)
  })

  it('has instrumentType hihat', () => {
    expect(HiHat().instrumentType).toBe('hihat')
  })

  it('has no _pattern when no hits given', () => {
    expect(HiHat()._pattern).toBeUndefined()
  })

  it('sets euclidean _pattern when hits given', () => {
    const part = HiHat(8)
    expect(Array.isArray(part._pattern)).toBe(true)
    const hits = (part._pattern as number[]).filter(v => v === 1).length
    expect(hits).toBe(8)
  })

  it('supports humanize chain', () => {
    expect(HiHat().humanize(0.01)._humanize).toBe(0.01)
  })

  it('supports chokeGroup chain', () => {
    expect(HiHat().chokeGroup('hat')._chokeGroup).toBe('hat')
  })
})

// ── Kick808 ───────────────────────────────────────────────────────────────────

describe('Kick808', () => {
  it('returns a ChainablePart', () => {
    expect(isChainablePart(Kick808())).toBe(true)
  })

  it('has instrumentType kick', () => {
    expect(Kick808().instrumentType).toBe('kick')
  })

  it('has _model 808', () => {
    expect(Kick808()._model).toBe('808')
  })

  it('has no _pattern when no hits given', () => {
    expect(Kick808()._pattern).toBeUndefined()
  })

  it('sets euclidean _pattern when hits given', () => {
    const part = Kick808(5)
    expect(Array.isArray(part._pattern)).toBe(true)
    const hits = (part._pattern as number[]).filter(v => v === 1).length
    expect(hits).toBe(5)
  })

  it('preserves _model after chain methods', () => {
    expect(Kick808().volume(0.9)._model).toBe('808')
  })

  it('supports full chain — volume + reverb + swing', () => {
    const part = Kick808().volume(0.9).reverb(0.1).swing(0.05)
    expect(part._model).toBe('808')
    expect(part._volume).toBe(0.9)
    expect(part._swing).toBe(0.05)
  })
})

// ── Kick909 ───────────────────────────────────────────────────────────────────

describe('Kick909', () => {
  it('returns a ChainablePart', () => {
    expect(isChainablePart(Kick909())).toBe(true)
  })

  it('has instrumentType kick', () => {
    expect(Kick909().instrumentType).toBe('kick')
  })

  it('has _model 909', () => {
    expect(Kick909()._model).toBe('909')
  })

  it('has no _pattern when no hits given', () => {
    expect(Kick909()._pattern).toBeUndefined()
  })

  it('sets euclidean _pattern when hits given', () => {
    const part = Kick909(4)
    expect((part._pattern as number[]).filter(v => v === 1).length).toBe(4)
  })

  it('preserves _model after chain methods', () => {
    expect(Kick909().volume(0.85)._model).toBe('909')
  })
})

// ── Hihat808 ──────────────────────────────────────────────────────────────────

describe('Hihat808', () => {
  it('returns a ChainablePart', () => {
    expect(isChainablePart(Hihat808())).toBe(true)
  })

  it('has instrumentType hihat', () => {
    expect(Hihat808().instrumentType).toBe('hihat')
  })

  it('has _model 808', () => {
    expect(Hihat808()._model).toBe('808')
  })

  it('sets euclidean _pattern when hits given', () => {
    const part = Hihat808(8)
    expect((part._pattern as number[]).filter(v => v === 1).length).toBe(8)
  })

  it('preserves _model after chain methods', () => {
    expect(Hihat808().volume(0.5).chokeGroup('hat')._model).toBe('808')
  })
})

// ── Snare909 ──────────────────────────────────────────────────────────────────

describe('Snare909', () => {
  it('returns a ChainablePart', () => {
    expect(isChainablePart(Snare909())).toBe(true)
  })

  it('has instrumentType snare', () => {
    expect(Snare909().instrumentType).toBe('snare')
  })

  it('has _model 909', () => {
    expect(Snare909()._model).toBe('909')
  })

  it('sets euclidean _pattern when hits given', () => {
    const part = Snare909(3)
    expect((part._pattern as number[]).filter(v => v === 1).length).toBe(3)
  })

  it('preserves _model after chain methods', () => {
    expect(Snare909().volume(0.75)._model).toBe('909')
  })
})

// ── Cross-factory ─────────────────────────────────────────────────────────────

describe('percussion factory cross-checks', () => {
  it('Kick808 and Kick909 produce different _model tags', () => {
    expect(Kick808()._model).not.toBe(Kick909()._model)
  })

  it('all factories produce distinct ids per call', () => {
    const ids = [Kick(), Snare(), HiHat(), Kick808(), Kick909(), Hihat808(), Snare909()].map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('chaining .model() on Kick overrides _model', () => {
    // Escape hatch: authors can set arbitrary models
    expect(Kick().model('hard')._model).toBe('hard')
  })

  it('hits=0 produces a pattern of all zeros', () => {
    const part = Kick(0)
    const pattern = part._pattern as number[]
    expect(pattern.every(v => v === 0)).toBe(true)
  })
})
