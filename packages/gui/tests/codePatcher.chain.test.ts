import { describe, it, expect } from 'vitest'
import {
  patchChainMethod,
  patchAddInstrument,
} from '../src/renderer/lib/codePatcher.js'

// ── Base code — chain API style ───────────────────────────────────────────────

const BASE_CHAIN = `import { Song, Kick808, Bass303, Pad } from '@score/dsl'

const kick = Kick808().pattern([1, 0, 0, 0, 1, 0, 0, 0]).volume(0.9)
const bass = Bass303('C2').cutoff(600).resonance(0.4).volume(0.8)
const pad  = Pad('Am').reverb(0.5).volume(0.6)

export default Song({
  bpm: 128,
  tracks: [kick, bass, pad],
})`

// ── patchChainMethod — replace existing ───────────────────────────────────────

describe('patchChainMethod — replace existing', () => {
  it('replaces volume on track 0 (kick)', () => {
    const result = patchChainMethod(BASE_CHAIN, 0, 'volume', 0.5)
    expect(result).toContain('Kick808().pattern([1, 0, 0, 0, 1, 0, 0, 0]).volume(0.5)')
    expect(result).not.toContain('.volume(0.9)')
  })

  it('replaces cutoff on track 1 (bass)', () => {
    const result = patchChainMethod(BASE_CHAIN, 1, 'cutoff', 800)
    expect(result).toContain('.cutoff(800)')
    expect(result).not.toContain('.cutoff(600)')
  })

  it('replaces reverb on track 2 (pad)', () => {
    const result = patchChainMethod(BASE_CHAIN, 2, 'reverb', 0.2)
    expect(result).toContain('.reverb(0.2)')
    expect(result).not.toContain('.reverb(0.5)')
  })

  it('does not affect other tracks when replacing', () => {
    const result = patchChainMethod(BASE_CHAIN, 0, 'volume', 0.3)
    expect(result).toContain('.volume(0.8)')   // bass unchanged
    expect(result).toContain('.volume(0.6)')   // pad unchanged
  })

  it('formats numbers to at most 3 decimal places', () => {
    const result = patchChainMethod(BASE_CHAIN, 0, 'volume', 0.333)
    expect(result).toContain('.volume(0.333)')
  })

  it('wraps string values in single quotes', () => {
    const result = patchChainMethod(BASE_CHAIN, 1, 'waveform', 'sawtooth')
    expect(result).toContain(".waveform('sawtooth')")
  })
})

// ── patchChainMethod — append new method ─────────────────────────────────────

describe('patchChainMethod — append new method', () => {
  it('appends a new method when not present', () => {
    const result = patchChainMethod(BASE_CHAIN, 0, 'delay', 0.3)
    expect(result).toContain('.delay(0.3)')
  })

  it('appends to the correct track only', () => {
    const result = patchChainMethod(BASE_CHAIN, 1, 'chorus', 0.4)
    const bassLine = result.split('\n').find(l => l.includes('const bass'))
    expect(bassLine).toContain('.chorus(0.4)')
    // kick line must not gain chorus
    const kickLine = result.split('\n').find(l => l.includes('const kick'))
    expect(kickLine).not.toContain('.chorus')
  })

  it('returns original if trackIndex out of range', () => {
    expect(patchChainMethod(BASE_CHAIN, 99, 'volume', 0.5)).toBe(BASE_CHAIN)
  })
})

// ── patchChainMethod — PascalCase instruments ─────────────────────────────────

describe('patchChainMethod — widened instrument regex', () => {
  const CODE_FM = `const fm = FMSynth('E2').ratio(2).volume(0.7)
export default Song({ bpm: 140, tracks: [fm] })`

  it('handles FMSynth (non-ASCII digit in name)', () => {
    const result = patchChainMethod(CODE_FM, 0, 'volume', 0.5)
    expect(result).toContain('.volume(0.5)')
    expect(result).not.toContain('.volume(0.7)')
  })

  const CODE_KARPLUS = `const k = KarplusSynth('C3').decay(0.9).volume(0.6)
export default Song({ bpm: 130, tracks: [k] })`

  it('handles KarplusSynth', () => {
    const result = patchChainMethod(CODE_KARPLUS, 0, 'decay', 0.5)
    expect(result).toContain('.decay(0.5)')
  })
})

// ── patchAddInstrument ────────────────────────────────────────────────────────

const BASE_FLAT_TRACKS = `import { Song, Kick808, Bass303 } from '@score/dsl'

const kick = Kick808().pattern([1, 0, 0, 0]).volume(0.9)
const bass = Bass303('C2').volume(0.8)

export default Song({ bpm: 128, tracks: [kick, bass] })`

const BASE_MULTILINE_TRACKS = `import { Song, Kick808, Bass303 } from '@score/dsl'

const kick = Kick808().pattern([1, 0, 0, 0]).volume(0.9)
const bass = Bass303('C2').volume(0.8)

export default Song({
  bpm: 128,
  tracks: [
    kick,
    bass,
  ],
})`

describe('patchAddInstrument', () => {
  it('inserts const declaration before export default', () => {
    const result = patchAddInstrument(BASE_FLAT_TRACKS, 'pad', "Pad('Am').reverb(0.3).volume(0.6)")
    const exportIdx = result.indexOf('export default Song(')
    const padIdx    = result.indexOf("const pad = Pad('Am')")
    expect(padIdx).toBeGreaterThanOrEqual(0)
    expect(padIdx).toBeLessThan(exportIdx)
  })

  it('appends variable name to flat tracks array', () => {
    const result = patchAddInstrument(BASE_FLAT_TRACKS, 'pad', "Pad('Am').volume(0.5)")
    expect(result).toContain('tracks: [kick, bass, pad]')
  })

  it('appends variable name to multiline tracks array preserving indentation', () => {
    const result = patchAddInstrument(BASE_MULTILINE_TRACKS, 'pad', "Pad('Am').volume(0.5)")
    expect(result).toContain('pad,')
    // pad entry should appear after bass in the array block
    const bassIdx = result.indexOf('    bass,')
    const padIdx  = result.indexOf('    pad')
    expect(padIdx).toBeGreaterThan(bassIdx)
  })

  it('does not duplicate const if called once', () => {
    const result = patchAddInstrument(BASE_FLAT_TRACKS, 'pad', "Pad('Am').volume(0.5)")
    const count = (result.match(/const pad/g) ?? []).length
    expect(count).toBe(1)
  })

  it('returns original if export default Song( not found', () => {
    const code = 'const x = Kick808()'
    expect(patchAddInstrument(code, 'pad', "Pad('Am')" )).toBe(code)
  })

  it('generated const uses exact instrumentLine string', () => {
    const line = "KarplusSynth('D3').decay(0.8).volume(0.5)"
    const result = patchAddInstrument(BASE_FLAT_TRACKS, 'karplus', line)
    expect(result).toContain(`const karplus = ${line}`)
  })
})
