import { describe, it, expect } from 'vitest'
import { createTempoMap } from '../src/tempoMap.js'

describe('createTempoMap', () => {
  it('returns correct shape', () => {
    const map = createTempoMap()
    expect(typeof map.getBPMAtBar).toBe('function')
    expect(typeof map.getSwingOffset).toBe('function')
    expect(typeof map.addChange).toBe('function')
    expect(typeof map.removeChange).toBe('function')
    expect(typeof map.setSwing).toBe('function')
    expect(typeof map.swing).toBe('number')
    expect(typeof map.initialBPM).toBe('number')
    expect(Array.isArray(map.changes)).toBe(true)
    expect(typeof map.dispose).toBe('function')
  })

  it('default BPM is 120', () => {
    const map = createTempoMap()
    expect(map.initialBPM).toBe(120)
  })

  it('getBPMAtBar returns initialBPM when no changes', () => {
    const map = createTempoMap({ initialBPM: 140 })
    expect(map.getBPMAtBar(0)).toBe(140)
    expect(map.getBPMAtBar(10)).toBe(140)
  })

  it('getBPMAtBar returns correct BPM after a change', () => {
    const map = createTempoMap({
      initialBPM: 120,
      changes: [{ bar: 4, bpm: 140 }],
    })
    expect(map.getBPMAtBar(0)).toBe(120)
    expect(map.getBPMAtBar(3)).toBe(120)
    expect(map.getBPMAtBar(4)).toBe(140)
    expect(map.getBPMAtBar(8)).toBe(140)
  })

  it('getBPMAtBar with multiple changes returns the last applicable one', () => {
    const map = createTempoMap({
      initialBPM: 100,
      changes: [
        { bar: 4, bpm: 120 },
        { bar: 8, bpm: 140 },
        { bar: 16, bpm: 160 },
      ],
    })
    expect(map.getBPMAtBar(0)).toBe(100)
    expect(map.getBPMAtBar(4)).toBe(120)
    expect(map.getBPMAtBar(7)).toBe(120)
    expect(map.getBPMAtBar(8)).toBe(140)
    expect(map.getBPMAtBar(15)).toBe(140)
    expect(map.getBPMAtBar(16)).toBe(160)
    expect(map.getBPMAtBar(100)).toBe(160)
  })

  it('addChange does not throw', () => {
    const map = createTempoMap()
    expect(() => { map.addChange(4, 140) }).not.toThrow()
  })

  it('removeChange does not throw', () => {
    const map = createTempoMap()
    expect(() => { map.removeChange(4) }).not.toThrow()
  })

  it('getSwingOffset returns 0 for even ticks when swing is 0', () => {
    const map = createTempoMap({ swing: 0 })
    expect(map.getSwingOffset(0, 0.125)).toBe(0)
    expect(map.getSwingOffset(2, 0.125)).toBe(0)
    expect(map.getSwingOffset(4, 0.125)).toBe(0)
  })

  it('getSwingOffset returns offset for odd ticks when swing > 0', () => {
    const map = createTempoMap({ swing: 0.5 })
    const tickDuration = 0.125
    const expected = 0.5 * tickDuration * 0.5 // swing * tickDuration * 0.5
    expect(map.getSwingOffset(1, tickDuration)).toBeCloseTo(expected)
    expect(map.getSwingOffset(3, tickDuration)).toBeCloseTo(expected)
    // Even ticks are still 0
    expect(map.getSwingOffset(0, tickDuration)).toBe(0)
    expect(map.getSwingOffset(2, tickDuration)).toBe(0)
  })

  it('setSwing clamps to [0, 1]', () => {
    const map = createTempoMap()
    map.setSwing(1.5)
    expect(map.swing).toBe(1)
    map.setSwing(-0.5)
    expect(map.swing).toBe(0)
    map.setSwing(0.7)
    expect(map.swing).toBeCloseTo(0.7)
  })

  it('dispose does not throw', () => {
    const map = createTempoMap()
    expect(() => { map.dispose() }).not.toThrow()
  })

  it('custom initialBPM is accepted', () => {
    const map = createTempoMap({ initialBPM: 160 })
    expect(map.initialBPM).toBe(160)
  })
})
