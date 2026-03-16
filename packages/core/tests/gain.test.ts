import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createGain } from '../src/gain.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createGain', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const g = createGain(h.context())
    expect(typeof g.connect).toBe('function')
    expect(typeof g.disconnect).toBe('function')
    expect(typeof g.dispose).toBe('function')
  })

  it('default gain is 1.0', () => {
    expect(createGain(h.context()).gain).toBeCloseTo(1.0)
  })

  it('respects custom gain prop', () => {
    expect(createGain(h.context(), { gain: 0.5 }).gain).toBeCloseTo(0.5)
  })

  it('setGain does not throw', () => {
    expect(() => { createGain(h.context()).setGain(0.75) }).not.toThrow()
  })

  it('connect and disconnect work', () => {
    const ctx = h.context()
    const g = createGain(ctx)
    expect(() => { g.connect(ctx.destination) }).not.toThrow()
    expect(() => { g.disconnect() }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.context()
    const g = createGain(ctx)
    expect(g.connect(ctx.destination)).toBe(g)
  })

  it('dispose cleans up without throwing', () => {
    const ctx = h.context()
    const g = createGain(ctx)
    g.connect(ctx.destination)
    expect(() => { g.dispose() }).not.toThrow()
  })

  it('gain property is a readable number', () => {
    expect(typeof createGain(h.context()).gain).toBe('number')
  })

  it('disconnect when not connected does not throw', () => {
    expect(() => { createGain(h.context()).disconnect() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    expect(() => { createGain(h.context()).dispose() }).not.toThrow()
  })

  it('delegates to backend createGain', () => {
    const mock = h.mockContext()
    createGain(mock, { gain: 0.7 })
    expect(mock.createdGains.length).toBe(1)
  })
})
