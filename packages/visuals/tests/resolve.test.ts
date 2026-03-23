// resolve.test.ts — Pure resolver chain tests

import { describe, it, expect } from 'vitest'
import { resolveComponentTheme, resolveTrackVisual, resolveTrackColor } from '../src/resolve.js'
import { darkPulseAppTheme, defaultInstrumentVisuals } from '../src/app-theme.js'

// ── resolveComponentTheme ─────────────────────────────────────────────────────

describe('resolveComponentTheme', () => {
  it('returns the base unchanged when no override', () => {
    const result = resolveComponentTheme(darkPulseAppTheme)
    expect(result).toBe(darkPulseAppTheme)
  })

  it('returns the base unchanged when override is undefined', () => {
    const result = resolveComponentTheme(darkPulseAppTheme, undefined)
    expect(result).toBe(darkPulseAppTheme)
  })

  it('merges override tokens into base', () => {
    const result = resolveComponentTheme(darkPulseAppTheme, { border: '#ff0000' })
    expect(result.border).toBe('#ff0000')
  })

  it('inherits unset keys from base', () => {
    const result = resolveComponentTheme(darkPulseAppTheme, { border: '#ff0000' })
    expect(result.background).toBe(darkPulseAppTheme.background)
    expect(result.text).toBe(darkPulseAppTheme.text)
  })

  it('does not mutate the base theme', () => {
    const originalBorder = darkPulseAppTheme.border
    resolveComponentTheme(darkPulseAppTheme, { border: '#ff0000' })
    expect(darkPulseAppTheme.border).toBe(originalBorder)
  })

  it('returns a new object when override is provided', () => {
    const result = resolveComponentTheme(darkPulseAppTheme, { border: '#ff0000' })
    expect(result).not.toBe(darkPulseAppTheme)
  })
})

// ── resolveTrackVisual ────────────────────────────────────────────────────────

describe('resolveTrackVisual', () => {
  it('returns empty descriptor when no config and no map', () => {
    const result = resolveTrackVisual('kick808', 'kick')
    expect(result).toEqual({})
  })

  it('returns instrument map default', () => {
    const result = resolveTrackVisual('kick808', 'kick', undefined, defaultInstrumentVisuals)
    expect(result).toEqual({ glyph: 'euclidean-ring' })
  })

  it('song.instruments override wins over instrument map default', () => {
    const songConfig = { instruments: { kick808: { glyph: 'step-dots' as const } } }
    const result = resolveTrackVisual('kick808', 'kick', songConfig, defaultInstrumentVisuals)
    expect(result.glyph).toBe('step-dots')
  })

  it('song.tracks override wins over song.instruments', () => {
    const songConfig = {
      instruments: { kick808: { glyph: 'step-dots' as const } },
      tracks:      { kick: { glyph: 'probability-arc' as const } },
    }
    const result = resolveTrackVisual('kick808', 'kick', songConfig, defaultInstrumentVisuals)
    expect(result.glyph).toBe('probability-arc')
  })

  it('song.tracks override wins over everything', () => {
    const songConfig = {
      instruments: { kick808: { color: '#ff0000' } },
      tracks:      { kick: { color: '#00ff00' } },
    }
    const result = resolveTrackVisual('kick808', 'kick', songConfig, defaultInstrumentVisuals)
    expect(result.color).toBe('#00ff00')
  })

  it('unmatched track name does not block instrument map lookup', () => {
    const songConfig = { tracks: { snare: { glyph: 'step-dots' as const } } }
    const result = resolveTrackVisual('kick808', 'kick', songConfig, defaultInstrumentVisuals)
    expect(result.glyph).toBe('euclidean-ring') // from instrument map
  })

  it('returns empty descriptor for unknown instrument type with no overrides', () => {
    const result = resolveTrackVisual('sample', 'loop', undefined, {})
    expect(result).toEqual({})
  })
})

// ── resolveTrackColor ─────────────────────────────────────────────────────────

describe('resolveTrackColor', () => {
  it('returns first track color for index 0', () => {
    expect(resolveTrackColor(darkPulseAppTheme, 0)).toBe(darkPulseAppTheme.tracks[0])
  })

  it('returns correct color for index within bounds', () => {
    expect(resolveTrackColor(darkPulseAppTheme, 3)).toBe(darkPulseAppTheme.tracks[3])
  })

  it('wraps modulo for out-of-bounds index', () => {
    const len = darkPulseAppTheme.tracks.length  // 8
    expect(resolveTrackColor(darkPulseAppTheme, len)).toBe(darkPulseAppTheme.tracks[0])
    expect(resolveTrackColor(darkPulseAppTheme, len + 1)).toBe(darkPulseAppTheme.tracks[1])
  })

  it('handles large index correctly via modulo', () => {
    const color = resolveTrackColor(darkPulseAppTheme, 100)
    expect(darkPulseAppTheme.tracks).toContain(color)
  })
})
