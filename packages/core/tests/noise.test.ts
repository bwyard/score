import { describe, it, expect, afterAll } from 'vitest'
import { createAudioContext } from '../src/context.js'
import { createNoise } from '../src/noise.js'
import type { BackendContext } from '../src/backend/types.js'
import { createMockBackendContext } from './utils/audioTestUtils.js'

describe('createNoise', () => {
  const contexts: BackendContext[] = []

  afterAll(async () => {
    await Promise.all(contexts.map((ctx) => ctx.close().catch(() => {})))
  })

  const makeContext = () => {
    const ctx = createAudioContext({ offline: { length: 44100 } })
    contexts.push(ctx)
    return ctx
  }

  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = makeContext()
    const noise = createNoise(ctx)
    expect(noise).toHaveProperty('connect')
    expect(noise).toHaveProperty('disconnect')
    expect(noise).toHaveProperty('dispose')
    expect(typeof noise.connect).toBe('function')
    expect(typeof noise.disconnect).toBe('function')
    expect(typeof noise.dispose).toBe('function')
  })

  it('default type is white (has start and stop)', () => {
    const ctx = makeContext()
    const noise = createNoise(ctx)
    expect(noise).toHaveProperty('start')
    expect(noise).toHaveProperty('stop')
  })

  it('accepts pink noise type without error', () => {
    const ctx = makeContext()
    expect(() => createNoise(ctx, { type: 'pink' })).not.toThrow()
  })

  it('accepts brown noise type without error', () => {
    const ctx = makeContext()
    expect(() => createNoise(ctx, { type: 'brown' })).not.toThrow()
  })

  it('invalid type throws ScoreError', () => {
    const ctx = makeContext()
    expect(() => createNoise(ctx, { type: 'invalid' as never })).toThrow('Invalid noise type')
  })

  it('start() does not throw', () => {
    const ctx = makeContext()
    const noise = createNoise(ctx)
    expect(() => { noise.start(); }).not.toThrow()
  })

  it('stop() after start does not throw', () => {
    const ctx = makeContext()
    const noise = createNoise(ctx)
    noise.start()
    expect(() => { noise.stop(); }).not.toThrow()
  })

  it('connect and disconnect work without throwing', () => {
    const ctx = makeContext()
    const noise = createNoise(ctx)
    expect(() => noise.connect(ctx.destination)).not.toThrow()
    expect(() => noise.disconnect()).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = makeContext()
    const noise = createNoise(ctx)
    const result = noise.connect(ctx.destination)
    expect(result).toBe(noise)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = makeContext()
    const noise = createNoise(ctx)
    noise.start()
    noise.connect(ctx.destination)
    expect(() => { noise.dispose(); }).not.toThrow()
  })

  it('delegates to backend createNoise', () => {
    const mockCtx = createMockBackendContext()
    createNoise(mockCtx, { type: 'pink' })
    expect(mockCtx.createdNoises.length).toBe(1)
  })
})
