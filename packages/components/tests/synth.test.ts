import { describe, it, expect } from 'vitest'
import { useHarness } from './utils/harness.js'
import { Synth } from '../src/synth.js'

const h = useHarness()

describe('Synth', () => {
  it('creates an oscillator and gain node from context', () => {
    const ctx = h.mockContext()
    Synth(ctx)
    expect(ctx.createdOscillators.length).toBe(1)
    expect(ctx.createdGains.length).toBe(1)
  })

  it('uses default props: sine, 440, 0, 1.0', () => {
    const ctx = h.mockContext()
    Synth(ctx)
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(1.0)
  })

  it('accepts custom wave, frequency, detune, gain', () => {
    const ctx = h.mockContext()
    Synth(ctx, { wave: 'sawtooth', frequency: 220, detune: 5, gain: 0.7 })
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.7)
  })

  it('wires oscillator -> gain (osc connects to gain node)', () => {
    const ctx = h.mockContext()
    Synth(ctx)
    const osc = ctx.createdOscillators[0]
    expect(osc?.connectCalls.length).toBe(1)
  })

  it('has start, stop, setFrequency, setDetune, setGain methods', () => {
    const synth = Synth(h.mockContext())
    expect(typeof synth.start).toBe('function')
    expect(typeof synth.stop).toBe('function')
    expect(typeof synth.setFrequency).toBe('function')
    expect(typeof synth.setDetune).toBe('function')
    expect(typeof synth.setGain).toBe('function')
  })

  it('has connect, disconnect, dispose methods', () => {
    const synth = Synth(h.mockContext())
    expect(typeof synth.connect).toBe('function')
    expect(typeof synth.disconnect).toBe('function')
    expect(typeof synth.dispose).toBe('function')
  })

  it('start delegates to oscillator', () => {
    const ctx = h.mockContext()
    const synth = Synth(ctx)
    synth.start(1.5)
    expect(ctx.createdOscillators[0]?.startCalls).toEqual([{ time: 1.5 }])
  })

  it('stop delegates to oscillator', () => {
    const ctx = h.mockContext()
    const synth = Synth(ctx)
    synth.start()
    synth.stop(2.0)
    expect(ctx.createdOscillators[0]?.stopCalls).toEqual([{ time: 2.0 }])
  })

  it('setGain delegates to gain node', () => {
    const ctx = h.mockContext()
    const synth = Synth(ctx)
    synth.setGain(0.5, 1.0)
    expect(ctx.createdGains[0]?.gain).toBeCloseTo(0.5)
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const synth = Synth(ctx)
    expect(synth.connect(ctx.destination)).toBe(synth)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const synth = Synth(ctx)
    synth.connect(ctx.destination)
    expect(synth.disconnect()).toBe(synth)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const synth = Synth(ctx)
    synth.start()
    synth.connect(ctx.destination)
    expect(() => { synth.dispose() }).not.toThrow()
  })

  it('dispose when never started does not throw', () => {
    expect(() => { Synth(h.mockContext()).dispose() }).not.toThrow()
  })

  it('connect routes through gain node (not oscillator)', () => {
    const ctx = h.mockContext()
    const synth = Synth(ctx)
    synth.connect(ctx.destination)
    const gainNode = ctx.createdGains[0]
    expect(gainNode?.connectCalls.length).toBe(1)
    expect(gainNode?.connectCalls[0]?.destination).toBe(ctx.destination)
  })

  it('setFrequency delegates to oscillator', () => {
    const ctx = h.mockContext()
    const synth = Synth(ctx)
    synth.setFrequency(880, 0.5)
    // Should not throw — osc setFrequency called
    expect(ctx.createdOscillators.length).toBe(1)
  })

  it('setDetune delegates to oscillator', () => {
    const ctx = h.mockContext()
    const synth = Synth(ctx)
    synth.setDetune(10, 1.0)
    expect(ctx.createdOscillators.length).toBe(1)
  })

  it('disconnect swallows error when gainNode.disconnect throws', () => {
    const ctx = h.mockContext()
    const synth = Synth(ctx)
    synth.connect(ctx.destination)
    const gainNode = ctx.createdGains[0]!
    ;(gainNode as unknown as Record<string, unknown>).disconnect = () => { throw new Error('already disconnected') }
    expect(() => { synth.disconnect() }).not.toThrow()
  })

  it('dispose swallows error when oscNode.stop throws', () => {
    const ctx = h.mockContext()
    const synth = Synth(ctx)
    const osc = ctx.createdOscillators[0]!
    ;(osc as unknown as Record<string, unknown>).stop = () => { throw new Error('already stopped') }
    expect(() => { synth.dispose() }).not.toThrow()
  })

  it('dispose swallows error when oscNode.disconnect throws', () => {
    const ctx = h.mockContext()
    const synth = Synth(ctx)
    const osc = ctx.createdOscillators[0]!
    ;(osc as unknown as Record<string, unknown>).disconnect = () => { throw new Error('already disconnected') }
    expect(() => { synth.dispose() }).not.toThrow()
  })

  it('dispose swallows error when gainNode.disconnect throws', () => {
    const ctx = h.mockContext()
    const synth = Synth(ctx)
    const gainNode = ctx.createdGains[0]!
    ;(gainNode as unknown as Record<string, unknown>).disconnect = () => { throw new Error('already disconnected') }
    expect(() => { synth.dispose() }).not.toThrow()
  })

  it('dispose swallows all errors when all teardown methods throw', () => {
    const ctx = h.mockContext()
    const synth = Synth(ctx)
    const osc = ctx.createdOscillators[0]!
    const gainNode = ctx.createdGains[0]!
    ;(osc as unknown as Record<string, unknown>).stop = () => { throw new Error('already stopped') }
    ;(osc as unknown as Record<string, unknown>).disconnect = () => { throw new Error('already disconnected') }
    ;(gainNode as unknown as Record<string, unknown>).disconnect = () => { throw new Error('already disconnected') }
    expect(() => { synth.dispose() }).not.toThrow()
  })
})
