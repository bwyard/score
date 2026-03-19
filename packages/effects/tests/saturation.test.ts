import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createSaturation } from '../src/saturation.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createSaturation', () => {
  it('returns an AudioComponent (has connect, disconnect, dispose)', () => {
    const ctx = h.mockContext()
    const sat = createSaturation(ctx)
    expect(typeof sat.connect).toBe('function')
    expect(typeof sat.disconnect).toBe('function')
    expect(typeof sat.dispose).toBe('function')
  })

  it('id starts with "saturation-"', () => {
    const ctx = h.mockContext()
    const sat = createSaturation(ctx)
    expect(sat.id).toMatch(/^saturation-/)
  })

  it('type is "saturation"', () => {
    const ctx = h.mockContext()
    const sat = createSaturation(ctx)
    expect(sat.type).toBe('saturation')
  })

  it('creates one WaveShaperNode', () => {
    const ctx = h.mockContext()
    createSaturation(ctx)
    expect(ctx.createdWaveShapers.length).toBe(1)
  })

  it('creates gain nodes for input, output, dry, wet', () => {
    const ctx = h.mockContext()
    createSaturation(ctx)
    // inputGain, outputGain, dryGain, wetGain = 4
    expect(ctx.createdGains.length).toBe(4)
  })

  it('setDrive(0) does not throw', () => {
    const ctx = h.mockContext()
    const sat = createSaturation(ctx)
    expect(() => { sat.setDrive(0) }).not.toThrow()
  })

  it('setDrive(1) does not throw', () => {
    const ctx = h.mockContext()
    const sat = createSaturation(ctx)
    expect(() => { sat.setDrive(1) }).not.toThrow()
  })

  it('setDrive with time parameter does not throw', () => {
    const ctx = h.mockContext()
    const sat = createSaturation(ctx)
    expect(() => { sat.setDrive(0.5, 1.0) }).not.toThrow()
  })

  it('setMix(0.5) does not throw', () => {
    const ctx = h.mockContext()
    const sat = createSaturation(ctx)
    expect(() => { sat.setMix(0.5) }).not.toThrow()
  })

  it('setMix accepts optional time parameter', () => {
    const ctx = h.mockContext()
    const sat = createSaturation(ctx)
    expect(() => { sat.setMix(0.3, 1.0) }).not.toThrow()
  })

  it('setDrive and setMix can be called in sequence', () => {
    const ctx = h.mockContext()
    const sat = createSaturation(ctx)
    expect(() => {
      sat.setDrive(0.2)
      sat.setMix(0.6)
      sat.setDrive(0.8)
      sat.setMix(0.9)
    }).not.toThrow()
  })

  it('connect returns self for chaining', () => {
    const ctx = h.mockContext()
    const sat = createSaturation(ctx)
    expect(sat.connect(ctx.destination)).toBe(sat)
  })

  it('disconnect returns self for chaining', () => {
    const ctx = h.mockContext()
    const sat = createSaturation(ctx)
    sat.connect(ctx.destination)
    expect(sat.disconnect()).toBe(sat)
  })

  it('dispose does not throw', () => {
    const ctx = h.mockContext()
    const sat = createSaturation(ctx)
    sat.connect(ctx.destination)
    expect(() => { sat.dispose() }).not.toThrow()
  })

  it('dispose when not connected does not throw', () => {
    const ctx = h.mockContext()
    const sat = createSaturation(ctx)
    expect(() => { sat.dispose() }).not.toThrow()
  })

  it('dispose swallows errors when nodes already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const sat = createSaturation(ctx)
    expect(() => { sat.dispose() }).not.toThrow()
  })

  it('disconnect swallows error when already disconnected', () => {
    const ctx = h.mockThrowingContext()
    const sat = createSaturation(ctx)
    expect(() => { sat.disconnect() }).not.toThrow()
  })

  it('default props produce a valid component', () => {
    const ctx = h.mockContext()
    const sat = createSaturation(ctx)
    expect(sat.id).toBeDefined()
    expect(sat.type).toBeDefined()
    expect(typeof sat.setDrive).toBe('function')
    expect(typeof sat.setMix).toBe('function')
  })

  it('accepts custom drive and mix props', () => {
    const ctx = h.mockContext()
    expect(() => {
      createSaturation(ctx, { drive: 0.7, mix: 0.8 })
    }).not.toThrow()
  })
})
