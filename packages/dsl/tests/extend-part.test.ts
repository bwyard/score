// extend-part.test.ts — extendPart() + defineInstrument() roundtrip tests
//
// Verifies that custom chain methods survive through all base chain calls.
// Tests observable behaviour only — not internal descriptor shape.

import { describe, it, expect } from 'vitest'
import { createPart, defineInstrument, extendPart } from '../src/chain.js'
import type { ChainablePart } from '../src/chain.js'

// ── defineInstrument roundtrip ────────────────────────────────────────────────

describe('defineInstrument', () => {
  it('returns a factory function with the same signature', () => {
    const MyKick = defineInstrument('my-kick', (pitch?: string) =>
      createPart({ instrumentType: 'my-kick', ...(pitch ? { _notes: [pitch] } : {}) }),
    )
    const k = MyKick('C2')
    expect(k._type).toBe('ChainablePart')
    expect(k.instrumentType).toBe('my-kick')
    expect(k._notes).toEqual(['C2'])
  })

  it('chain methods work on defineInstrument result', () => {
    const MyKick = defineInstrument('my-kick', () =>
      createPart({ instrumentType: 'my-kick' }),
    )
    const k = MyKick().volume(0.7).reverb(0.1)
    expect(k._volume).toBe(0.7)
    expect(k._effects).toHaveLength(1)
  })
})

// ── extendPart — basic shape ──────────────────────────────────────────────────

describe('extendPart — basic shape', () => {
  it('returns a factory function', () => {
    const MyKick = extendPart('kick', () => ({}))
    expect(typeof MyKick).toBe('function')
  })

  it('factory produces a ChainablePart', () => {
    const MyKick = extendPart('kick', () => ({}))
    const k = MyKick()
    expect(k._type).toBe('ChainablePart')
    expect(k.instrumentType).toBe('kick')
  })

  it('extensions are spread onto the part', () => {
    const MyKick = extendPart('kick', (part) => ({
      quiet: () => part.volume(0.2),
    }))
    const k = MyKick()
    expect(typeof k.quiet).toBe('function')
  })
})

// ── extendPart — extensions survive chain calls ───────────────────────────────

describe('extendPart — custom method preserved through chain calls', () => {
  it('custom method present after .volume()', () => {
    const MyKick = extendPart('kick', (part) => ({
      quiet: () => part.volume(0.2),
    }))
    const k = MyKick().volume(0.5)
    expect(typeof (k as unknown as { quiet?: unknown }).quiet).toBe('function')
  })

  it('custom method present after .reverb()', () => {
    const MyKick = extendPart('kick', (part) => ({
      loud: () => part.volume(0.95),
    }))
    const k = MyKick().reverb(0.1)
    expect(typeof (k as unknown as { loud?: unknown }).loud).toBe('function')
  })

  it('custom method present after multiple chain calls', () => {
    const MySynth = extendPart('synth', (part) => ({
      edm: () => part.volume(0.9).reverb(0.2).delay(0.125),
    }))
    const s = MySynth().volume(0.5).filter(800).swing(0.1)
    expect(typeof (s as unknown as { edm?: unknown }).edm).toBe('function')
  })

  it('multiple extensions all survive chain calls', () => {
    const MyKick = extendPart('kick', (part) => ({
      quiet:   () => part.volume(0.2),
      loud:    () => part.volume(0.95),
      pumped:  () => part.reverb(0.15),
    }))
    const k = MyKick().swing(0.1)
    const ext = k as unknown as { quiet?: unknown; loud?: unknown; pumped?: unknown }
    expect(typeof ext.quiet).toBe('function')
    expect(typeof ext.loud).toBe('function')
    expect(typeof ext.pumped).toBe('function')
  })
})

// ── extendPart — extension method behaviour ───────────────────────────────────

describe('extendPart — extension method produces correct descriptor', () => {
  it('quiet() sets volume to 0.2', () => {
    const MyKick = extendPart('kick', (part) => ({
      quiet: () => part.volume(0.2),
    }))
    const result = MyKick().quiet()
    expect(result._volume).toBe(0.2)
  })

  it('base chain methods still work on extended part', () => {
    const MyKick = extendPart('kick', (part) => ({
      quiet: () => part.volume(0.2),
    }))
    const k = MyKick().volume(0.8).swing(0.05)
    expect(k._volume).toBe(0.8)
    expect(k._swing).toBe(0.05)
  })
})

// ── extendPart — multiple independent factories ───────────────────────────────

describe('extendPart — independent factory instances', () => {
  it('two extended factories do not share state', () => {
    const KickA = extendPart('kick', (part) => ({ methodA: () => part.volume(0.1) }))
    const KickB = extendPart('kick', (part) => ({ methodB: () => part.volume(0.9) }))
    const a = KickA()
    const b = KickB()
    expect(typeof (a as unknown as { methodA?: unknown }).methodA).toBe('function')
    expect((a as unknown as { methodB?: unknown }).methodB).toBeUndefined()
    expect(typeof (b as unknown as { methodB?: unknown }).methodB).toBe('function')
    expect((b as unknown as { methodA?: unknown }).methodA).toBeUndefined()
  })

  it('each factory call produces a unique id', () => {
    const MyKick = extendPart('kick', () => ({}))
    const a = MyKick()
    const b = MyKick()
    expect(a.id).not.toBe(b.id)
  })
})

// ── createPart buildExtensions param — sub-type pattern ──────────────────────

describe('createPart buildExtensions param', () => {
  it('buildExtensions is re-applied after every chain call', () => {
    type Extra = { extra: string }
    const attachExtra = (base: ChainablePart): ChainablePart & Extra => ({
      ...base,
      extra: 'yes',
    })
    const part = attachExtra(createPart({ instrumentType: 'kick' }, attachExtra))
    const after = part.volume(0.5)
    expect((after as ChainablePart & Extra).extra).toBe('yes')
  })
})
