import { describe, it, expect } from 'vitest'
import {
  patchBpm,
  patchTrackPattern,
  patchTrackVolume,
  patchTrackNote,
  parseTrackChainParams,
  patchAddInstrument,
  patchMute,
  parseMuteState,
  patchInstrumentModel,
  uniqueVarName,
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

// ── patchTrackVolume — chain API style (.volume(n)) ───────────────────────────

const CHAIN_VOLUME_CODE = `import { Song, Kick808, Bass303, Pad } from '@score/dsl'

const kick = Kick808().pattern([1, 0, 0, 0]).volume(0.9)
const bass = Bass303('C2').cutoff(600).volume(0.8)
const pad  = Pad('Am').reverb(0.5).volume(0.6)

export default Song({ bpm: 128, tracks: [kick, bass, pad] })`

describe('patchTrackVolume — chain API style', () => {
  it('updates .volume() on track 0 (kick)', () => {
    const result = patchTrackVolume(CHAIN_VOLUME_CODE, 0, 0.5)
    expect(result).toContain('.volume(0.5)')
    expect(result).not.toContain('.volume(0.9)')
  })

  it('updates .volume() on track 1 (bass) without touching track 0', () => {
    const result = patchTrackVolume(CHAIN_VOLUME_CODE, 1, 0.3)
    expect(result).toContain('.volume(0.3)')
    expect(result).toContain('.volume(0.9)')  // kick unchanged
    expect(result).not.toContain('.volume(0.8)')
  })

  it('updates .volume() on track 2 (pad)', () => {
    const result = patchTrackVolume(CHAIN_VOLUME_CODE, 2, 1.0)
    expect(result).toContain('.volume(1)')
    expect(result).not.toContain('.volume(0.6)')
  })

  it('does not mutate other chain methods on the same track', () => {
    const result = patchTrackVolume(CHAIN_VOLUME_CODE, 1, 0.4)
    expect(result).toContain('.cutoff(600)')  // bass cutoff unchanged
  })

  it('handles volume with more than 2 decimal places by rounding', () => {
    const result = patchTrackVolume(CHAIN_VOLUME_CODE, 0, 0.333)
    // rounds to 2dp: 0.33
    expect(result).toContain('.volume(0.33)')
  })

  it('returns original if trackIndex out of range', () => {
    expect(patchTrackVolume(CHAIN_VOLUME_CODE, 99, 0.5)).toBe(CHAIN_VOLUME_CODE)
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

describe('parseTrackChainParams', () => {
  const PARAMS_CODE = `const kick = Kick808(4).volume(0.8).decay(0.6).reverb(0.1)
const snare = Snare909(2).volume(0.55).sustain(0.4)
export default Song({ bpm: 128, tracks: [kick, snare] })`

  it('parses all chain method values for track 0', () => {
    const params = parseTrackChainParams(PARAMS_CODE, 0)
    expect(params['volume']).toBe(0.8)
    expect(params['decay']).toBe(0.6)
    expect(params['reverb']).toBe(0.1)
  })

  it('parses chain method values for track 1', () => {
    const params = parseTrackChainParams(PARAMS_CODE, 1)
    expect(params['volume']).toBe(0.55)
    expect(params['sustain']).toBe(0.4)
  })

  it('does not cross into adjacent track region', () => {
    const params = parseTrackChainParams(PARAMS_CODE, 0)
    expect(params['sustain']).toBeUndefined()
  })

  it('returns {} for out-of-range track index', () => {
    expect(parseTrackChainParams(PARAMS_CODE, 5)).toEqual({})
  })
})

// ── uniqueVarName ─────────────────────────────────────────────────────────────

describe('uniqueVarName', () => {
  it('returns base when not already declared', () => {
    expect(uniqueVarName('const snare = Snare()', 'kick')).toBe('kick')
  })

  it('returns base2 when base is taken', () => {
    expect(uniqueVarName('const kick = Kick()', 'kick')).toBe('kick2')
  })

  it('returns base3 when base and base2 are both taken', () => {
    const code = 'const kick = Kick()\nconst kick2 = Kick()'
    expect(uniqueVarName(code, 'kick')).toBe('kick3')
  })

  it('does not false-match partial names (kick vs kicker)', () => {
    expect(uniqueVarName('const kicker = Kick()', 'kick')).toBe('kick')
  })
})

// ── patchAddInstrument ────────────────────────────────────────────────────────

const ADD_BASE = `import { Song, Kick, Snare } from '@score/dsl'

const kick  = Kick().pattern([1, 0, 0, 0]).volume(0.9)
const snare = Snare().pattern([0, 0, 1, 0]).volume(0.7)

export default Song({ bpm: 128, tracks: [kick, snare] })`

describe('patchAddInstrument', () => {
  it('inserts const declaration before export default', () => {
    const result = patchAddInstrument(ADD_BASE, 'pad', "Pad('Am').reverb(0.3)")
    expect(result).toContain("const pad = Pad('Am').reverb(0.3)")
    expect(result.indexOf('const pad')).toBeLessThan(result.indexOf('export default'))
  })

  it('appends varName to tracks array', () => {
    const result = patchAddInstrument(ADD_BASE, 'pad', "Pad('Am').reverb(0.3)")
    expect(result).toMatch(/tracks\s*:\s*\[kick,\s*snare,\s*pad\]/)
  })

  it('returns original if export default Song( not found', () => {
    const code = 'const kick = Kick()'
    expect(patchAddInstrument(code, 'pad', "Pad('Am')"  )).toBe(code)
  })

  it('preserves existing track declarations unchanged', () => {
    const result = patchAddInstrument(ADD_BASE, 'hihat', 'HiHat().volume(0.5)')
    expect(result).toContain('const kick  = Kick()')
    expect(result).toContain('const snare = Snare()')
  })

  it('works with multiline tracks array', () => {
    const multiline = `const kick = Kick()
const snare = Snare()
export default Song({ bpm: 128, tracks: [
  kick,
  snare,
] })`
    const result = patchAddInstrument(multiline, 'pad', "Pad('Am')")
    expect(result).toContain('const pad')
    expect(result).toContain('pad')
  })
})

// ── parseMuteState ────────────────────────────────────────────────────────────

const MUTE_CODE = `const kick  = Kick().pattern([1, 0, 0, 0]).mute()
const snare = Snare().pattern([0, 0, 1, 0]).volume(0.7)
export default Song({ bpm: 128, tracks: [kick, snare] })`

describe('parseMuteState', () => {
  it('returns true for a muted track', () => {
    expect(parseMuteState(MUTE_CODE, 0)).toBe(true)
  })

  it('returns false for an unmuted track', () => {
    expect(parseMuteState(MUTE_CODE, 1)).toBe(false)
  })

  it('returns false for out-of-range track index', () => {
    expect(parseMuteState(MUTE_CODE, 99)).toBe(false)
  })
})

// ── patchMute ─────────────────────────────────────────────────────────────────

const UNMUTED_CODE = `const kick  = Kick().pattern([1, 0, 0, 0]).volume(0.9)
const snare = Snare().pattern([0, 0, 1, 0]).volume(0.7)
export default Song({ bpm: 128, tracks: [kick, snare] })`

describe('patchMute', () => {
  it('appends .mute() when muted = true', () => {
    const result = patchMute(UNMUTED_CODE, 0, true)
    expect(result).toContain('Kick().pattern([1, 0, 0, 0]).volume(0.9).mute()')
  })

  it('is a no-op when track already has .mute() and muted = true', () => {
    const already = patchMute(UNMUTED_CODE, 0, true)
    expect(patchMute(already, 0, true)).toBe(already)
  })

  it('removes .mute() when muted = false', () => {
    const muted = patchMute(UNMUTED_CODE, 0, true)
    const result = patchMute(muted, 0, false)
    expect(result).not.toContain('.mute()')
    expect(result).toContain('.volume(0.9)')
  })

  it('does not affect an unmuted track when muted = false', () => {
    expect(patchMute(UNMUTED_CODE, 0, false)).toBe(UNMUTED_CODE)
  })

  it('does not affect adjacent tracks', () => {
    const result = patchMute(UNMUTED_CODE, 0, true)
    expect(result).toContain('Snare().pattern([0, 0, 1, 0]).volume(0.7)')
  })

  it('returns original for out-of-range track index', () => {
    expect(patchMute(UNMUTED_CODE, 99, true)).toBe(UNMUTED_CODE)
  })
})

// ── patchInstrumentModel ──────────────────────────────────────────────────────

const MODEL_CODE = `const kick  = Kick808().pattern([1, 0, 0, 0]).volume(0.9)
const snare = Snare909().pattern([0, 0, 1, 0]).volume(0.7)
export default Song({ bpm: 128, tracks: [kick, snare] })`

describe('patchInstrumentModel', () => {
  it('replaces instrument model name at track 0', () => {
    const result = patchInstrumentModel(MODEL_CODE, 0, 'Kick909')
    expect(result).toContain('Kick909()')
    expect(result).not.toContain('Kick808()')
  })

  it('replaces instrument model name at track 1', () => {
    const result = patchInstrumentModel(MODEL_CODE, 1, 'Snare')
    expect(result).toContain('Snare()')
    expect(result).not.toContain('Snare909()')
  })

  it('does not affect adjacent tracks', () => {
    const result = patchInstrumentModel(MODEL_CODE, 0, 'Kick909')
    expect(result).toContain('Snare909()')
  })

  it('returns original for out-of-range track index', () => {
    expect(patchInstrumentModel(MODEL_CODE, 99, 'Kick909')).toBe(MODEL_CODE)
  })

  it('preserves all chain methods after the model name', () => {
    const result = patchInstrumentModel(MODEL_CODE, 0, 'Kick909')
    expect(result).toContain('.pattern([1, 0, 0, 0]).volume(0.9)')
  })
})
