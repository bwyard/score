import { describe, it, expect } from 'vitest'
import { SOUND_VOCAB, SPACE_VOCAB, VOLUME_VOCAB, PATTERN_VOCAB, ALL_VOCAB } from '../src/vocabulary.js'

describe('vocabulary tables', () => {
  it('SOUND_VOCAB is a non-empty array', () => {
    expect(Array.isArray(SOUND_VOCAB)).toBe(true)
    expect(SOUND_VOCAB.length).toBeGreaterThan(0)
  })

  it('each SOUND_VOCAB entry has keywords array and descriptor object', () => {
    for (const entry of SOUND_VOCAB) {
      expect(Array.isArray(entry.keywords)).toBe(true)
      expect(entry.keywords.length).toBeGreaterThan(0)
      expect(typeof entry.descriptor).toBe('object')
    }
  })

  it('SPACE_VOCAB contains reverb-related entries', () => {
    const hasReverb = SPACE_VOCAB.some(e => e.descriptor.reverb !== undefined)
    expect(hasReverb).toBe(true)
  })

  it('VOLUME_VOCAB values are in 0–1 range', () => {
    for (const entry of VOLUME_VOCAB) {
      if (entry.descriptor.volume !== undefined) {
        expect(entry.descriptor.volume).toBeGreaterThanOrEqual(0)
        expect(entry.descriptor.volume).toBeLessThanOrEqual(1)
      }
    }
  })

  it('PATTERN_VOCAB patterns are 16-step arrays of 0s and 1s', () => {
    for (const entry of PATTERN_VOCAB) {
      if (entry.descriptor.pattern) {
        expect(entry.descriptor.pattern).toHaveLength(16)
        for (const step of entry.descriptor.pattern) {
          expect([0, 1]).toContain(step)
        }
      }
    }
  })

  it('ALL_VOCAB includes entries from all sub-tables', () => {
    expect(ALL_VOCAB.length).toBeGreaterThanOrEqual(
      SOUND_VOCAB.length + SPACE_VOCAB.length + VOLUME_VOCAB.length + PATTERN_VOCAB.length
    )
  })

  it('kick entry has four-on-the-floor pattern', () => {
    const kick = SOUND_VOCAB.find(e => e.keywords.includes('kick'))
    expect(kick).toBeDefined()
    expect(kick?.descriptor.pattern).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0])
  })

  it('bass entry has lowpass filter', () => {
    const bass = SOUND_VOCAB.find(e => e.keywords.includes('bass'))
    expect(bass?.descriptor.filterType).toBe('lowpass')
    expect(bass?.descriptor.filterFrequency).toBeGreaterThan(0)
  })
})
