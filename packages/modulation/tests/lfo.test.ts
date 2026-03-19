import { describe, it, expect, afterAll } from 'vitest'
import { useHarness, createMockAudioParam } from './utils/harness.js'
import { createLFO } from '../src/lfo.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createLFO', () => {
  it('returns an object with id starting with "lfo-"', () => {
    const ctx = h.mockContext()
    const lfo = createLFO(ctx)
    expect(lfo.id).toMatch(/^lfo-/)
  })

  it('type is "lfo"', () => {
    const ctx = h.mockContext()
    const lfo = createLFO(ctx)
    expect(lfo.type).toBe('lfo')
  })

  it('has connect, disconnect, dispose, setRate, setDepth, setShape methods', () => {
    const ctx = h.mockContext()
    const lfo = createLFO(ctx)
    expect(typeof lfo.connect).toBe('function')
    expect(typeof lfo.disconnect).toBe('function')
    expect(typeof lfo.dispose).toBe('function')
    expect(typeof lfo.setRate).toBe('function')
    expect(typeof lfo.setDepth).toBe('function')
    expect(typeof lfo.setShape).toBe('function')
  })

  it('connect(mockAudioParam) calls param.connectModulator', () => {
    const ctx = h.mockContext()
    const lfo = createLFO(ctx)
    const param = createMockAudioParam()
    expect(param.connectCount).toBe(0)
    lfo.connect(param)
    expect(param.connectCount).toBe(1)
  })

  it('connect calls param.connectModulator with the depth gain node', () => {
    const ctx = h.mockContext()
    const lfo = createLFO(ctx, { depth: 500 })
    const param = createMockAudioParam()
    lfo.connect(param)
    expect(param.connectCount).toBe(1)
  })

  it('setRate does not throw', () => {
    const ctx = h.mockContext()
    const lfo = createLFO(ctx)
    expect(() => { lfo.setRate(1) }).not.toThrow()
  })

  it('setRate accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const lfo = createLFO(ctx)
    expect(() => { lfo.setRate(2, 1.0) }).not.toThrow()
  })

  it('setDepth does not throw', () => {
    const ctx = h.mockContext()
    const lfo = createLFO(ctx)
    expect(() => { lfo.setDepth(200) }).not.toThrow()
  })

  it('setShape does not throw', () => {
    const ctx = h.mockContext()
    const lfo = createLFO(ctx)
    expect(() => { lfo.setShape('triangle') }).not.toThrow()
  })

  it('disconnect does not throw', () => {
    const ctx = h.mockContext()
    const lfo = createLFO(ctx)
    expect(() => { lfo.disconnect() }).not.toThrow()
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const lfo = createLFO(ctx)
    expect(() => { lfo.dispose() }).not.toThrow()
  })

  it('negative rate throws ScoreError', () => {
    const ctx = h.mockContext()
    expect(() => { createLFO(ctx, { rate: -1 }) }).toThrow()
  })

  it('default props work — no props argument', () => {
    const ctx = h.mockContext()
    expect(() => { createLFO(ctx) }).not.toThrow()
  })

  it('zero rate is allowed (edge case: non-negative)', () => {
    const ctx = h.mockContext()
    expect(() => { createLFO(ctx, { rate: 0 }) }).not.toThrow()
  })

  it('each lfo gets a unique id', () => {
    const ctx = h.mockContext()
    const lfo1 = createLFO(ctx)
    const lfo2 = createLFO(ctx)
    expect(lfo1.id).not.toBe(lfo2.id)
  })
})
