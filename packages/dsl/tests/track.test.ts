import { describe, it, expect } from 'vitest'
import { Track } from '../src/track.js'
import { createMockComponent } from './utils.js'

describe('Track', () => {
  it('wraps a component', () => {
    const comp = createMockComponent()
    const track = Track(comp)
    expect(track._type).toBe('TrackComponent')
    expect(track.component).toBe(comp)
  })

  it('applies optional props', () => {
    const track = Track(createMockComponent(), { volume: 0.8, pan: -0.5, mute: false, solo: true })
    expect(track.volume).toBe(0.8)
    expect(track.pan).toBe(-0.5)
    expect(track.mute).toBe(false)
    expect(track.solo).toBe(true)
  })

  it('leaves optional props undefined when not provided', () => {
    const track = Track(createMockComponent())
    expect(track.volume).toBeUndefined()
    expect(track.pan).toBeUndefined()
    expect(track.mute).toBeUndefined()
    expect(track.solo).toBeUndefined()
  })

  // Memory leak check: Track holds component reference — disposing component is caller's responsibility
  it('component can be disposed without corrupting track wrapper', () => {
    const comp = createMockComponent()
    const track = Track(comp)
    comp.dispose()
    expect(comp.disposed).toBe(true)
    expect(track._type).toBe('TrackComponent') // wrapper unaffected
  })
})
