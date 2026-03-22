import { describe, it, expect, vi, afterAll } from 'vitest'
import { useHarness, createMockAudioParam } from './utils/harness.js'
import { automation } from '../src/automation.js'
import { createLFO } from '../src/lfo.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('automation', () => {
  it('returns id starting with "automation-"', () => {
    const ctx   = h.mockContext()
    const lfo   = createLFO(ctx)
    const param = createMockAudioParam()
    const auto  = automation(lfo, param)
    expect(auto.id).toMatch(/^automation-/)
  })

  it('each handle gets a unique id', () => {
    const ctx    = h.mockContext()
    const param  = createMockAudioParam()
    const auto1  = automation(createLFO(ctx), param)
    const auto2  = automation(createLFO(ctx), param)
    expect(auto1.id).not.toBe(auto2.id)
  })

  it('connects the source to param immediately on creation', () => {
    const ctx   = h.mockContext()
    const lfo   = createLFO(ctx)
    const param = createMockAudioParam()
    expect(param.connectCount).toBe(0)
    automation(lfo, param)
    expect(param.connectCount).toBe(1)
  })

  it('has disconnect and dispose methods', () => {
    const ctx   = h.mockContext()
    const lfo   = createLFO(ctx)
    const param = createMockAudioParam()
    const auto  = automation(lfo, param)
    expect(typeof auto.disconnect).toBe('function')
    expect(typeof auto.dispose).toBe('function')
  })

  it('disconnect() does not throw', () => {
    const ctx   = h.mockContext()
    const lfo   = createLFO(ctx)
    const param = createMockAudioParam()
    const auto  = automation(lfo, param)
    expect(() => { auto.disconnect() }).not.toThrow()
  })

  it('dispose() does not throw', () => {
    const ctx   = h.mockContext()
    const lfo   = createLFO(ctx)
    const param = createMockAudioParam()
    const auto  = automation(lfo, param)
    expect(() => { auto.dispose() }).not.toThrow()
  })

  it('disconnect() calls source.disconnect', () => {
    const ctx   = h.mockContext()
    const lfo   = createLFO(ctx)
    const param = createMockAudioParam()
    const auto  = automation(lfo, param)
    const spy   = vi.spyOn(lfo, 'disconnect')
    auto.disconnect()
    expect(spy).toHaveBeenCalledOnce()
  })

  it('dispose() calls source.dispose', () => {
    const ctx   = h.mockContext()
    const lfo   = createLFO(ctx)
    const param = createMockAudioParam()
    const auto  = automation(lfo, param)
    const spy   = vi.spyOn(lfo, 'dispose')
    auto.dispose()
    expect(spy).toHaveBeenCalledOnce()
  })
})
