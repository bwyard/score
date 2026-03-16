import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createEffectsChain } from '../src/chain.js'
import { createDelay } from '../src/delay.js'
import { createFilter } from '../src/filter.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createEffectsChain', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const chain = createEffectsChain(ctx, [])
    expect(typeof chain.connect).toBe('function')
    expect(typeof chain.disconnect).toBe('function')
    expect(typeof chain.dispose).toBe('function')
  })

  it('has input property', () => {
    const ctx = h.mockContext()
    const chain = createEffectsChain(ctx, [])
    expect(chain.input).toBeDefined()
    expect(typeof chain.input.connect).toBe('function')
  })

  it('works with empty effects array', () => {
    const ctx = h.mockContext()
    const chain = createEffectsChain(ctx, [])
    expect(chain).toBeDefined()
  })

  it('wires single effect in chain', () => {
    const ctx = h.mockContext()
    const delay = createDelay(ctx)
    const chain = createEffectsChain(ctx, [delay])
    expect(chain).toBeDefined()
  })

  it('wires multiple effects in chain', () => {
    const ctx = h.mockContext()
    const delay = createDelay(ctx)
    const filter = createFilter(ctx)
    const chain = createEffectsChain(ctx, [delay, filter])
    expect(chain).toBeDefined()
  })

  it('getEffect returns effect at index', () => {
    const ctx = h.mockContext()
    const delay = createDelay(ctx)
    const filter = createFilter(ctx)
    const chain = createEffectsChain(ctx, [delay, filter])
    expect(chain.getEffect(0)).toBe(delay)
    expect(chain.getEffect(1)).toBe(filter)
  })

  it('getEffect returns undefined for out-of-range index', () => {
    const ctx = h.mockContext()
    const chain = createEffectsChain(ctx, [])
    expect(chain.getEffect(0)).toBeUndefined()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const chain = createEffectsChain(ctx, [])
    expect(chain.connect(ctx.destination)).toBe(chain)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const chain = createEffectsChain(ctx, [])
    chain.connect(ctx.destination)
    expect(chain.disconnect()).toBe(chain)
  })

  it('dispose cleans up all effects and nodes', () => {
    const ctx = h.mockContext()
    const delay = createDelay(ctx)
    const chain = createEffectsChain(ctx, [delay])
    chain.connect(ctx.destination)
    expect(() => { chain.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const chain = createEffectsChain(ctx, [])
    expect(() => { chain.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const chain = createEffectsChain(ctx, [])
    expect(() => { chain.disconnect() }).not.toThrow()
  })
})
