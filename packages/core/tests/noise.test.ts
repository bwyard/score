import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createNoise } from '../src/noise.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createNoise', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const noise = createNoise(h.context())
    expect(typeof noise.connect).toBe('function')
    expect(typeof noise.disconnect).toBe('function')
    expect(typeof noise.dispose).toBe('function')
  })

  it('has start and stop methods', () => {
    const noise = createNoise(h.context())
    expect(typeof noise.start).toBe('function')
    expect(typeof noise.stop).toBe('function')
  })

  it('accepts pink noise type', () => {
    expect(() => createNoise(h.context(), { type: 'pink' })).not.toThrow()
  })

  it('accepts brown noise type', () => {
    expect(() => createNoise(h.context(), { type: 'brown' })).not.toThrow()
  })

  it('invalid type throws ScoreError', () => {
    expect(() => createNoise(h.context(), { type: 'invalid' as never })).toThrow('Invalid noise type')
  })

  it('start() does not throw', () => {
    expect(() => { createNoise(h.context()).start() }).not.toThrow()
  })

  it('stop() after start does not throw', () => {
    const noise = createNoise(h.context())
    noise.start()
    expect(() => { noise.stop() }).not.toThrow()
  })

  it('connect and disconnect work', () => {
    const ctx = h.context()
    const noise = createNoise(ctx)
    expect(() => { noise.connect(ctx.destination) }).not.toThrow()
    expect(() => { noise.disconnect() }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.context()
    const noise = createNoise(ctx)
    expect(noise.connect(ctx.destination)).toBe(noise)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.context()
    const noise = createNoise(ctx)
    noise.start()
    noise.connect(ctx.destination)
    expect(() => { noise.dispose() }).not.toThrow()
  })

  it('delegates to backend createNoise', () => {
    const mock = h.mockContext()
    createNoise(mock, { type: 'pink' })
    expect(mock.createdNoises.length).toBe(1)
  })
})
