import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createReturn } from '../src/return.js'
import type { AudioComponent, BackendNode } from '@score/core'

const h = useHarness()
afterAll(() => h.cleanup())

const createMockEffect = (): AudioComponent & { readonly input: BackendNode } => {
  const inputNode: BackendNode = { connect: () => {}, disconnect: () => {} }
  const effect: AudioComponent & { readonly input: BackendNode } = {
    id: 'mock-effect-1',
    type: 'mock-effect',
    input: inputNode,
    connect: (_d: unknown) => effect,
    disconnect: () => effect,
    dispose: () => {},
  }
  return effect
}

describe('createReturn', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const ret = createReturn(ctx, { effect: createMockEffect() })
    expect(typeof ret.connect).toBe('function')
    expect(typeof ret.disconnect).toBe('function')
    expect(typeof ret.dispose).toBe('function')
  })

  it('has id and type properties', () => {
    const ctx = h.mockContext()
    const ret = createReturn(ctx, { effect: createMockEffect() })
    expect(ret.id).toMatch(/^return-/)
    expect(ret.type).toBe('return')
  })

  it('has an input property (BackendNode)', () => {
    const ctx = h.mockContext()
    const ret = createReturn(ctx, { effect: createMockEffect() })
    expect(ret.input).toBeDefined()
    expect(typeof ret.input.connect).toBe('function')
  })

  it('creates gain nodes for routing', () => {
    const ctx = h.mockContext()
    createReturn(ctx, { effect: createMockEffect() })
    // inputGain, volumeGain, outputGain = 3 gains
    expect(ctx.createdGains.length).toBeGreaterThanOrEqual(3)
  })

  it('accepts custom name', () => {
    const ctx = h.mockContext()
    const ret = createReturn(ctx, { name: 'Reverb Bus', effect: createMockEffect() })
    expect(ret.name).toBe('Reverb Bus')
  })

  it('defaults name to Return', () => {
    const ctx = h.mockContext()
    const ret = createReturn(ctx, { effect: createMockEffect() })
    expect(ret.name).toBe('Return')
  })

  it('accepts custom volume', () => {
    const ctx = h.mockContext()
    const ret = createReturn(ctx, { effect: createMockEffect(), volume: 0.5 })
    expect(ret).toBeDefined()
  })

  it('setVolume does not throw', () => {
    const ctx = h.mockContext()
    const ret = createReturn(ctx, { effect: createMockEffect() })
    expect(() => { ret.setVolume(0.6) }).not.toThrow()
  })

  it('setVolume accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const ret = createReturn(ctx, { effect: createMockEffect() })
    expect(() => { ret.setVolume(0.6, 1.0) }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const ret = createReturn(ctx, { effect: createMockEffect() })
    expect(ret.connect(ctx.destination)).toBe(ret)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const ret = createReturn(ctx, { effect: createMockEffect() })
    ret.connect(ctx.destination)
    expect(ret.disconnect()).toBe(ret)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.mockContext()
    const ret = createReturn(ctx, { effect: createMockEffect() })
    ret.connect(ctx.destination)
    expect(() => { ret.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const ret = createReturn(ctx, { effect: createMockEffect() })
    expect(() => { ret.disconnect() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const ret = createReturn(ctx, { effect: createMockEffect() })
    expect(() => { ret.dispose() }).not.toThrow()
  })
})
