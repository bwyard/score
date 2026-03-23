import { describe, it, expect } from 'vitest'
import { useHarness } from '../utils/harness.js'
import { createHihat808 } from '../../src/drums/hihat808.js'

const h = useHarness()

describe('createHihat808', () => {
  it('has trigger, connect, disconnect, dispose', () => {
    const hat = createHihat808(h.mockContext())
    expect(typeof hat.trigger).toBe('function')
    expect(typeof hat.connect).toBe('function')
    expect(typeof hat.disconnect).toBe('function')
    expect(typeof hat.dispose).toBe('function')
  })

  it('id is prefixed hihat808', () => {
    const hat = createHihat808(h.mockContext())
    expect(hat.id).toMatch(/^hihat808/)
  })

  it('type is hihat808', () => {
    const hat = createHihat808(h.mockContext())
    expect(hat.type).toBe('hihat808')
  })

  it('creates one output gain at construction', () => {
    const ctx = h.mockContext()
    createHihat808(ctx)
    expect(ctx.createdGains.length).toBe(1)
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.7)
  })

  it('respects custom gain prop', () => {
    const ctx = h.mockContext()
    createHihat808(ctx, { gain: 0.4 })
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.4)
  })

  it('trigger creates 6 oscillators (one per hi-hat partial)', () => {
    const ctx = h.mockContext()
    const hat = createHihat808(ctx)
    hat.trigger(0)
    expect(ctx.createdOscillators.length).toBe(6)
  })

  it('all 6 oscillators are started with trigger time', () => {
    const ctx = h.mockContext()
    const hat = createHihat808(ctx)
    hat.trigger(1.0)
    for (const osc of ctx.createdOscillators) {
      expect(osc.startCalls[0]?.time).toBe(1.0)
    }
  })

  it('all 6 oscillators are scheduled to stop', () => {
    const ctx = h.mockContext()
    const hat = createHihat808(ctx)
    hat.trigger(0)
    for (const osc of ctx.createdOscillators) {
      expect(osc.stopCalls.length).toBe(1)
    }
  })

  it('open prop uses longer default decay than closed', () => {
    // We can't inspect decay directly, but we can check stop time via stopCalls
    // The stop time = t + decay + 0.05; open default decay 0.3 > closed 0.06
    const ctxClosed = h.mockContext()
    const ctxOpen = h.mockContext()
    const closed = createHihat808(ctxClosed)
    const open = createHihat808(ctxOpen, { open: true })
    closed.trigger(0)
    open.trigger(0)
    const closedStop = ctxClosed.createdOscillators[0]?.stopCalls[0]?.time ?? 0
    const openStop = ctxOpen.createdOscillators[0]?.stopCalls[0]?.time ?? 0
    expect(openStop).toBeGreaterThan(closedStop)
  })

  it('two triggers create 12 oscillators total', () => {
    const ctx = h.mockContext()
    const hat = createHihat808(ctx)
    hat.trigger(0)
    hat.trigger(0.25)
    expect(ctx.createdOscillators.length).toBe(12)
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const hat = createHihat808(ctx)
    expect(hat.connect(ctx.destination)).toBe(hat)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const hat = createHihat808(ctx)
    expect(hat.disconnect()).toBe(hat)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const hat = createHihat808(ctx)
    hat.trigger(0)
    expect(() => { hat.dispose() }).not.toThrow()
  })
})
