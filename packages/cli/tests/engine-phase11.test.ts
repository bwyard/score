// Tests for Phase 11 engine additions:
// - muteEnvelope(bar, arrangement, trackId) — pure function of time
// - ScoreEngine.patch() — surgical live parameter updates
// - ScoreEngine.bars — bar counter getter
// - ScoreEngine.update() — live song definition diffing
//
// All tests avoid real audio context by using mocked/minimal setups.

import { describe, it, expect } from 'vitest'
import { muteEnvelope } from '../src/engine.js'

// ── muteEnvelope — pure function of time ──────────────────────────────────────

const makeDescriptor = (id: string) => ({
  _type: 'InstrumentDescriptor' as const,
  instrumentType: 'kick' as const,
  props: {},
  id,
  type: 'instrument',
  connect: () => ({} as never),
  disconnect: () => ({} as never),
  dispose: () => {},
})

const makeSection = (sectionType: 'intro' | 'buildup' | 'drop' | 'breakdown' | 'outro', bars: number, ids: string[]) => ({
  _type: 'SectionDefinition' as const,
  sectionType,
  bars,
  tracks: ids.map(id => ({
    _type: 'TrackComponent' as const,
    volume: 1,
    component: makeDescriptor(id),
  })),
})

describe('muteEnvelope', () => {
  it('returns false for all tracks when arrangement is empty', () => {
    expect(muteEnvelope(0, [], 'kick-1')).toBe(false)
    expect(muteEnvelope(99, [], 'synth-2')).toBe(false)
  })

  it('returns false (active) when track is in the current section', () => {
    const arrangement = [makeSection('intro', 4, ['kick-1', 'snare-1'])]
    expect(muteEnvelope(0, arrangement, 'kick-1')).toBe(false)
    expect(muteEnvelope(3, arrangement, 'kick-1')).toBe(false)
  })

  it('returns true (muted) when track is not in the current section', () => {
    const arrangement = [makeSection('intro', 4, ['kick-1'])]
    expect(muteEnvelope(0, arrangement, 'snare-1')).toBe(true)
    expect(muteEnvelope(2, arrangement, 'synth-2')).toBe(true)
  })

  it('selects the correct section when arrangement has multiple sections', () => {
    const arrangement = [
      makeSection('intro', 4, ['kick-1']),          // bars 0–3
      makeSection('drop',  8, ['kick-1', 'snare-1']), // bars 4–11
    ]
    // In intro (bars 0-3): snare is muted
    expect(muteEnvelope(0, arrangement, 'snare-1')).toBe(true)
    expect(muteEnvelope(3, arrangement, 'snare-1')).toBe(true)
    // In drop (bars 4-11): snare is active
    expect(muteEnvelope(4, arrangement, 'snare-1')).toBe(false)
    expect(muteEnvelope(11, arrangement, 'snare-1')).toBe(false)
  })

  it('wraps bar modulo totalBars for looping arrangements', () => {
    const arrangement = [
      makeSection('intro', 4, ['kick-1']),          // bars 0–3 (total: 4)
    ]
    // Bar 4 wraps to bar 0 → intro → kick active
    expect(muteEnvelope(4, arrangement, 'kick-1')).toBe(false)
    // Bar 5 wraps to bar 1 → intro → snare muted
    expect(muteEnvelope(5, arrangement, 'snare-1')).toBe(true)
  })

  it('is deterministic — same inputs always give same result', () => {
    const arrangement = [
      makeSection('intro',    4, ['kick-1']),
      makeSection('drop',     8, ['kick-1', 'synth-1']),
      makeSection('breakdown', 4, ['synth-1']),
    ]
    // Run twice — result must be identical
    const results1 = [0, 4, 12, 15].map(bar => muteEnvelope(bar, arrangement, 'kick-1'))
    const results2 = [0, 4, 12, 15].map(bar => muteEnvelope(bar, arrangement, 'kick-1'))
    expect(results1).toEqual(results2)
  })

  it('handles a single-bar arrangement', () => {
    const arrangement = [makeSection('intro', 1, ['kick-1'])]
    expect(muteEnvelope(0, arrangement, 'kick-1')).toBe(false)
    expect(muteEnvelope(1, arrangement, 'kick-1')).toBe(false) // wraps back to bar 0
  })

  it('correctly handles tracks passed directly as InstrumentDescriptors (not wrapped in Track)', () => {
    // Section tracks can be InstrumentDescriptors (not TrackComponents)
    const section = {
      _type: 'SectionDefinition' as const,
      sectionType: 'drop' as const,
      bars: 4,
      tracks: [makeDescriptor('kick-1')] as never[], // InstrumentDescriptor, not TrackComponent
    }
    expect(muteEnvelope(0, [section], 'kick-1')).toBe(false)
    expect(muteEnvelope(0, [section], 'snare-1')).toBe(true)
  })
})
