import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createADSR } from '../src/adsr.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createADSR', () => {
  it('returns an object with id starting with "adsr-"', () => {
    const ctx = h.mockContext()
    const adsr = createADSR(ctx)
    expect(adsr.id).toMatch(/^adsr-/)
  })

  it('type is "adsr"', () => {
    const ctx = h.mockContext()
    const adsr = createADSR(ctx)
    expect(adsr.type).toBe('adsr')
  })

  it('has trigger and dispose methods', () => {
    const ctx = h.mockContext()
    const adsr = createADSR(ctx)
    expect(typeof adsr.trigger).toBe('function')
    expect(typeof adsr.dispose).toBe('function')
  })

  it('trigger(mockGainNode, 0) does not throw', () => {
    const ctx = h.mockContext()
    const adsr = createADSR(ctx)
    const gain = ctx.createGain()
    expect(() => { adsr.trigger(gain, 0) }).not.toThrow()
  })

  it('trigger with explicit duration does not throw', () => {
    const ctx = h.mockContext()
    const adsr = createADSR(ctx)
    const gain = ctx.createGain()
    expect(() => { adsr.trigger(gain, 0, 0.5) }).not.toThrow()
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const adsr = createADSR(ctx)
    expect(() => { adsr.dispose() }).not.toThrow()
  })

  it('default props work — no props argument', () => {
    const ctx = h.mockContext()
    expect(() => { createADSR(ctx) }).not.toThrow()
  })

  it('custom attack/decay/sustain/release props accepted', () => {
    const ctx = h.mockContext()
    expect(() => {
      createADSR(ctx, { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.4 })
    }).not.toThrow()
  })

  it('custom peak prop accepted', () => {
    const ctx = h.mockContext()
    expect(() => {
      createADSR(ctx, { peak: 0.8 })
    }).not.toThrow()
  })

  it('trigger calls scheduleEnvelope on the gain node', () => {
    const ctx = h.mockContext()
    const adsr = createADSR(ctx, { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2, peak: 1.0 })
    const gain = ctx.createGain()
    adsr.trigger(gain, 0)
    // scheduleEnvelope in mock sets currentGain to peak
    expect(gain.gain).toBe(1.0)
  })

  it('each adsr gets a unique id', () => {
    const ctx = h.mockContext()
    const adsr1 = createADSR(ctx)
    const adsr2 = createADSR(ctx)
    expect(adsr1.id).not.toBe(adsr2.id)
  })
})
