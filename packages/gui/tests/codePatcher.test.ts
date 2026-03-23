import { describe, it, expect } from 'vitest'
import {
  patchBpm,
  patchTrackPattern,
  patchTrackVolume,
  patchTrackNote,
} from '../src/renderer/lib/codePatcher.js'

// ── Base code ─────────────────────────────────────────────────────────────────

const BASE_CODE = `import { Song, Track, Kick, Snare, HiHat, Synth, Arp } from '@score/dsl'
import { Reverb, Delay } from '@score/effects'

export default Song({
  bpm: 128,
  tracks: [
    Track(Kick({  pattern: [1, 0, 0, 0, 1, 0, 0, 0], volume: 0.9 })),
    Track(Snare({ pattern: [0, 0, 1, 0, 0, 0, 1, 0], volume: 0.7 })),
    Track(HiHat({ pattern: [1, 1, 1, 1, 1, 1, 1, 1], volume: 0.4 })),
    Track(Synth({
      wave: 'sawtooth', frequency: 65.41,
      pattern: [1, 0, 1, 0, 0, 1, 0, 0],
      gain: 0.6,
    })),
    Track(Arp({
      notes: ['C3', 'E3', 'G3', 'B3'],
      mode: 'up', rate: 2, wave: 'triangle', gain: 0.4,
    })),
  ],
})`

// ── patchBpm ──────────────────────────────────────────────────────────────────

describe('patchBpm', () => {
  it('replaces bpm value', () => {
    const result = patchBpm(BASE_CODE, 140)
    expect(result).toContain('bpm: 140')
    expect(result).not.toContain('bpm: 128')
  })

  it('handles integer bpm', () => {
    const result = patchBpm('Song({ bpm: 90, tracks: [] })', 200)
    expect(result).toBe('Song({ bpm: 200, tracks: [] })')
  })

  it('returns original if no bpm: found', () => {
    const code = 'Song({ tracks: [] })'
    expect(patchBpm(code, 140)).toBe(code)
  })

  it('does not change other numbers', () => {
    const result = patchBpm(BASE_CODE, 140)
    expect(result).toContain('frequency: 65.41')
    expect(result).toContain('volume: 0.9')
  })
})

// ── patchTrackPattern ─────────────────────────────────────────────────────────

describe('patchTrackPattern', () => {
  it('toggles a step from 0 to 1', () => {
    const result = patchTrackPattern(BASE_CODE, 0, 1, 1)
    expect(result).toContain('pattern: [1, 1, 0, 0, 1, 0, 0, 0]')
  })

  it('toggles a step from 1 to 0', () => {
    const result = patchTrackPattern(BASE_CODE, 0, 0, 0)
    expect(result).toContain('pattern: [0, 0, 0, 0, 1, 0, 0, 0]')
  })

  it('targets correct track by index', () => {
    // Track 1 = Snare: pattern: [0, 0, 1, 0, 0, 0, 1, 0]
    const result = patchTrackPattern(BASE_CODE, 1, 0, 1)
    expect(result).toContain('pattern: [1, 0, 1, 0, 0, 0, 1, 0]')
    // Track 0 (Kick) should be unchanged
    expect(result).toContain('pattern: [1, 0, 0, 0, 1, 0, 0, 0]')
  })

  it('returns original if trackIndex out of range', () => {
    expect(patchTrackPattern(BASE_CODE, 99, 0, 1)).toBe(BASE_CODE)
  })

  it('returns original if stepIndex out of range', () => {
    expect(patchTrackPattern(BASE_CODE, 0, 99, 1)).toBe(BASE_CODE)
  })

  it('returns original if no pattern found in track', () => {
    // Track 4 = Arp: has notes[] but no pattern key
    expect(patchTrackPattern(BASE_CODE, 4, 0, 1)).toBe(BASE_CODE)
  })
})

// ── patchTrackVolume ──────────────────────────────────────────────────────────

describe('patchTrackVolume', () => {
  it('updates volume for track 0', () => {
    const result = patchTrackVolume(BASE_CODE, 0, 0.5)
    expect(result).toContain('volume: 0.5')
  })

  it('updates volume for track 1', () => {
    const result = patchTrackVolume(BASE_CODE, 1, 0.3)
    // Snare volume should become 0.3
    expect(result).toContain('volume: 0.3')
    // Kick volume should be unchanged
    expect(result).toContain('volume: 0.9')
  })

  it('handles volume = 1 (no trailing zero issues)', () => {
    const result = patchTrackVolume(BASE_CODE, 0, 1)
    expect(result).toContain('volume: 1')
  })

  it('handles volume = 0.75', () => {
    const result = patchTrackVolume(BASE_CODE, 0, 0.75)
    expect(result).toContain('volume: 0.75')
  })

  it('returns original if trackIndex out of range', () => {
    expect(patchTrackVolume(BASE_CODE, 99, 0.5)).toBe(BASE_CODE)
  })

  it('returns original if no volume found in track (Synth track uses gain: not volume:)', () => {
    // Track 3 = Synth: has gain: 0.6, not volume:
    expect(patchTrackVolume(BASE_CODE, 3, 0.5)).toBe(BASE_CODE)
  })
})

// ── patchTrackNote ────────────────────────────────────────────────────────────

describe('patchTrackNote', () => {
  it('replaces first note in Arp', () => {
    const result = patchTrackNote(BASE_CODE, 4, 0, 'D3')
    expect(result).toContain("notes: ['D3', 'E3', 'G3', 'B3']")
  })

  it('replaces last note in Arp', () => {
    const result = patchTrackNote(BASE_CODE, 4, 3, 'A3')
    expect(result).toContain("notes: ['C3', 'E3', 'G3', 'A3']")
  })

  it('returns original if noteIndex out of range', () => {
    expect(patchTrackNote(BASE_CODE, 4, 99, 'D3')).toBe(BASE_CODE)
  })

  it('returns original if no notes array found', () => {
    // Track 0 = Kick: has pattern[], not notes[]
    expect(patchTrackNote(BASE_CODE, 0, 0, 'D3')).toBe(BASE_CODE)
  })
})

// ── patchTrackPattern — chain API style (.pattern([...])) ──────────────────

const CHAIN_CODE = `import { Song, Kick808, Snare } from '@score/dsl'

const kick  = Kick808().pattern([1, 0, 0, 0, 1, 0, 0, 0]).volume(0.6)
const snare = Snare().pattern([0, 0, 1, 0, 0, 0, 1, 0]).volume(0.55)

export default Song({ bpm: 120, tracks: [kick, snare] })`

describe('patchTrackPattern — chain API style', () => {
  it('toggles a step from 1 to 0 in .pattern([...]) method style', () => {
    const result = patchTrackPattern(CHAIN_CODE, 0, 0, 0)
    expect(result).toContain('.pattern([0, 0, 0, 0, 1, 0, 0, 0])')
  })

  it('toggles a step from 0 to 1 in .pattern([...]) method style', () => {
    const result = patchTrackPattern(CHAIN_CODE, 0, 1, 1)
    expect(result).toContain('.pattern([1, 1, 0, 0, 1, 0, 0, 0])')
  })

  it('targets correct track in chain API code', () => {
    const result = patchTrackPattern(CHAIN_CODE, 1, 0, 1)
    expect(result).toContain('.pattern([1, 0, 1, 0, 0, 0, 1, 0])')
    expect(result).toContain('.pattern([1, 0, 0, 0, 1, 0, 0, 0])')  // kick unchanged
  })

  it('does not affect other chain methods on the same line', () => {
    const result = patchTrackPattern(CHAIN_CODE, 0, 0, 0)
    expect(result).toContain('.volume(0.6)')   // volume unchanged
  })

  it('returns original if no pattern found in chain API track (no .pattern call)', () => {
    const noPattern = `const bass = Bass303('C2').volume(0.8)
export default Song({ bpm: 120, tracks: [bass] })`
    expect(patchTrackPattern(noPattern, 0, 0, 1)).toBe(noPattern)
  })
})
