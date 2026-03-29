import { describe, it, expect } from 'vitest'
import { render }               from '@testing-library/react'
import {
  CodeHighlight,
  getActiveLines,
  getTrackLines,
  getStepBadges,
  getBlockBounds,
} from '../src/renderer/components/shared/CodeHighlight.js'

// ── getActiveLines — Track() style (legacy) ───────────────────────────────────

const CODE = `import { Song, Track, Kick, Snare } from '@score/dsl'

export default Song({
  bpm: 128,
  tracks: [
    Track(Kick({  pattern: [1, 0, 0, 0], volume: 0.9 })),
    Track(Snare({ pattern: [0, 0, 1, 0], volume: 0.7 })),
  ],
})`

// Line 5 = Track(Kick...)   (0-based)
// Line 6 = Track(Snare...)

describe('getActiveLines — empty inputs', () => {
  it('returns empty when tracks is empty', () => {
    expect(getActiveLines(CODE, [], 0)).toEqual([])
  })

  it('returns empty when no Track( lines in code', () => {
    const tracks = [{ type: 'kick', pattern: [1, 0] }]
    expect(getActiveLines('no tracks here', tracks, 0)).toEqual([])
  })
})

describe('getActiveLines — step matching', () => {
  const tracks = [
    { type: 'kick',  pattern: [1, 0, 0, 0] },
    { type: 'snare', pattern: [0, 0, 1, 0] },
  ]

  it('highlights kick line on step 0', () => {
    const result = getActiveLines(CODE, tracks, 0)
    expect(result).toContain(5) // Track(Kick... is line 5
    expect(result).not.toContain(6)
  })

  it('highlights snare line on step 2', () => {
    const result = getActiveLines(CODE, tracks, 2)
    expect(result).toContain(6) // Track(Snare... is line 6
    expect(result).not.toContain(5)
  })

  it('returns empty when no pattern step is active', () => {
    const result = getActiveLines(CODE, tracks, 1)
    expect(result).toEqual([])
  })

  it('highlights both lines when both active', () => {
    // A pattern where both are 1 at step 0
    const bothActive = [
      { type: 'kick',  pattern: [1, 0] },
      { type: 'snare', pattern: [1, 0] },
    ]
    const result = getActiveLines(CODE, bothActive, 0)
    expect(result).toContain(5)
    expect(result).toContain(6)
  })
})

describe('getActiveLines — modulo wrapping', () => {
  const tracks = [{ type: 'kick', pattern: [1, 0, 0, 0, 0, 0, 0, 0] }]

  it('step 8 wraps to index 0 (active)', () => {
    const result = getActiveLines(CODE, tracks, 8)
    expect(result).toContain(5)
  })

  it('step 9 wraps to index 1 (inactive)', () => {
    const result = getActiveLines(CODE, tracks, 9)
    expect(result).not.toContain(5)
  })
})

describe('getActiveLines — string patterns (melodic)', () => {
  it('treats non-empty string as active', () => {
    const tracks = [{ type: 'arp', pattern: ['C3', 'E3', 'G3'] }]
    const code = `Song({\n  tracks: [\n    Track(Arp({ notes: [] })),\n  ],\n})`
    const result = getActiveLines(code, tracks, 0)
    expect(result).toContain(2) // Track( is on line 2
  })
})

// ── getActiveLines — const style (new bare instrument style) ──────────────────

const BADGE_CODE = `import { Song, Kick, Snare } from '@score/dsl'
import { euclidean } from '@score/pattern'

const kick  = Kick({  pattern: euclidean(4, 8), volume: 0.9 })
const snare = Snare({ pattern: euclidean(2, 8, 4), volume: 0.7 })

export default Song({ bpm: 128, tracks: [kick, snare] })`

// Line 3 = const kick  = Kick(...) (0-based)
// Line 4 = const snare = Snare(...)

describe('getActiveLines — const instrument style', () => {
  const tracks = [
    { type: 'kick',  pattern: [1, 0, 0, 0] },
    { type: 'snare', pattern: [0, 0, 1, 0] },
  ]

  it('detects kick line in const style', () => {
    const result = getActiveLines(BADGE_CODE, tracks, 0)
    expect(result).toContain(3) // = Kick( is on line 3
  })

  it('detects snare line in const style', () => {
    const result = getActiveLines(BADGE_CODE, tracks, 2)
    expect(result).toContain(4) // = Snare( is on line 4
  })
})

// ── getTrackLines ─────────────────────────────────────────────────────────────

describe('getTrackLines', () => {
  it('returns empty when tracks is empty', () => {
    expect(getTrackLines(CODE, [])).toEqual([])
  })

  it('returns track-to-line mapping for Track() style', () => {
    const tracks = [
      { type: 'kick',  pattern: [1, 0] },
      { type: 'snare', pattern: [0, 1] },
    ]
    const result = getTrackLines(CODE, tracks)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ lineIndex: 5, trackIndex: 0 })
    expect(result[1]).toEqual({ lineIndex: 6, trackIndex: 1 })
  })

  it('returns track-to-line mapping for const style', () => {
    const tracks = [
      { type: 'kick',  pattern: [1, 0] },
      { type: 'snare', pattern: [0, 1] },
    ]
    const result = getTrackLines(BADGE_CODE, tracks)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ lineIndex: 3, trackIndex: 0 })
    expect(result[1]).toEqual({ lineIndex: 4, trackIndex: 1 })
  })
})

// ── CodeHighlight component ────────────────────────────────────────────────────

describe('CodeHighlight — rendering', () => {
  it('renders null when not playing', () => {
    const { container } = render(
      <CodeHighlight code={CODE} tracks={[]} currentStep={0} playing={false} scrollTop={0} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders null when playing but no tracks', () => {
    const { container } = render(
      <CodeHighlight code={CODE} tracks={[]} currentStep={0} playing={true} scrollTop={0} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders without throwing when playing with active tracks', () => {
    const tracks = [
      { type: 'kick',  pattern: [1, 0, 0, 0] },
      { type: 'snare', pattern: [0, 0, 1, 0] },
    ]
    expect(() =>
      render(<CodeHighlight code={CODE} tracks={tracks} currentStep={0} playing={true} scrollTop={0} />),
    ).not.toThrow()
  })

  it('is aria-hidden', () => {
    const tracks = [{ type: 'kick', pattern: [1, 0] }]
    const { container } = render(
      <CodeHighlight code={CODE} tracks={tracks} currentStep={0} playing={true} scrollTop={0} />,
    )
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})

// ── getStepBadges (t219) ──────────────────────────────────────────────────────

const STEP_BADGE_CODE = `import { Song, Kick808, Snare, HiHat } from '@score/dsl'

const kick  = Kick808({ pattern: [1, 0, 0, 0, 1, 0, 0, 0], volume: 0.6 })
const snare = Snare({  pattern: [0, 0, 1, 0, 0, 0, 1, 0], volume: 0.55 })
const hihat = HiHat({  pattern: [1, 1, 1, 1, 1, 1, 1, 1], volume: 0.25 })

export default Song({ bpm: 120, tracks: [kick, snare, hihat] })`

// Kick808 is line index 2 (0-based) → line 3 (1-based)
// Snare   is line index 3           → line 4 (1-based)
// HiHat   is line index 4           → line 5 (1-based)

describe('getStepBadges (t219)', () => {
  it('returns empty when no tracks', () => {
    expect(getStepBadges(STEP_BADGE_CODE, [], 0, 8)).toEqual([])
  })

  it('returns one badge per matched track line', () => {
    const tracks = [
      { type: 'kick',  pattern: [1, 0, 0, 0, 1, 0, 0, 0] },
      { type: 'snare', pattern: [0, 0, 1, 0, 0, 0, 1, 0] },
      { type: 'hihat', pattern: [1, 1, 1, 1, 1, 1, 1, 1] },
    ]
    const result = getStepBadges(STEP_BADGE_CODE, tracks, 0, 8)
    expect(result).toHaveLength(3)
  })

  it('reports correct 1-based line numbers', () => {
    const tracks = [
      { type: 'kick',  pattern: [1, 0, 0, 0, 1, 0, 0, 0] },
      { type: 'snare', pattern: [0, 0, 1, 0, 0, 0, 1, 0] },
    ]
    const result = getStepBadges(STEP_BADGE_CODE, tracks, 0, 8)
    expect(result[0]?.line).toBe(3) // Kick808 line
    expect(result[1]?.line).toBe(4) // Snare line
  })

  it('wraps step via modulo against pattern length', () => {
    const tracks = [{ type: 'kick', pattern: [1, 0, 0, 0] }]
    const result = getStepBadges(STEP_BADGE_CODE, tracks, 6, 8) // step 6 % 4 = 2
    expect(result[0]?.step).toBe(2)
    expect(result[0]?.total).toBe(4)
  })

  it('uses defaultStepCount when pattern is empty', () => {
    const tracks = [{ type: 'kick', pattern: [] }]
    const result = getStepBadges(STEP_BADGE_CODE, tracks, 3, 16)
    expect(result[0]?.step).toBe(3)
    expect(result[0]?.total).toBe(16)
  })
})

// ── getActiveLines — PR #74 melodic instruments ────────────────────────────────

const MELODIC_CODE = `import { Song, Bass303, Pad, Rhodes, Pluck } from '@score/dsl'

const bass   = Bass303('A2').filter(600).resonance(0.4).pattern(['A2', 0, 'D3', 0]).volume(0.6)
const pad    = Pad({ frequency: 220 }).volume(0.5)
const rhodes = Rhodes({ frequency: 440 }).volume(0.7)
const pluck  = Pluck({ frequency: 330 }).volume(0.6)

export default Song({ bpm: 128, tracks: [bass, pad, rhodes, pluck] })`

// bass   = line 2 (0-based)
// pad    = line 3
// rhodes = line 4
// pluck  = line 5

describe('getActiveLines — PR #74 melodic instruments', () => {
  const tracks = [
    { type: 'bass303', pattern: ['A2', 0, 'D3', 0] },
    { type: 'pad',     pattern: [1, 0, 0, 0] },
    { type: 'rhodes',  pattern: [0, 1, 0, 0] },
    { type: 'pluck',   pattern: [0, 0, 1, 0] },
  ]

  it('detects Bass303 line at step 0 (note hit)', () => {
    expect(getActiveLines(MELODIC_CODE, tracks, 0)).toContain(2)
  })

  it('does not highlight Bass303 at step 1 (rest)', () => {
    expect(getActiveLines(MELODIC_CODE, tracks, 1)).not.toContain(2)
  })

  it('detects Pad line at step 0', () => {
    expect(getActiveLines(MELODIC_CODE, tracks, 0)).toContain(3)
  })

  it('detects Rhodes line at step 1', () => {
    expect(getActiveLines(MELODIC_CODE, tracks, 1)).toContain(4)
  })

  it('detects Pluck line at step 2', () => {
    expect(getActiveLines(MELODIC_CODE, tracks, 2)).toContain(5)
  })
})

describe('getTrackLines — PR #74 melodic instruments', () => {
  const tracks = [
    { type: 'bass303', pattern: ['A2', 0] },
    { type: 'pad',     pattern: [1, 0] },
  ]

  it('maps Bass303 and Pad lines correctly', () => {
    const result = getTrackLines(MELODIC_CODE, tracks)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ lineIndex: 2, trackIndex: 0 })
    expect(result[1]).toEqual({ lineIndex: 3, trackIndex: 1 })
  })
})

// ── getBlockBounds (t330) ──────────────────────────────────────────────────────

// Single-line block: `const kick = Kick808(4)` — ends at a blank line
const SINGLE_LINE_CODE = `import { Song, Kick808, Snare } from '@score/dsl'

const kick  = Kick808(4).volume(0.8)
const snare = Snare(2).volume(0.55)

export default Song({ bpm: 128, tracks: [kick, snare] })`
// kick  → line index 2 (0-based) → startLine 3 (1-based), endLine 3
// snare → line index 3            → startLine 4 (1-based), endLine 4

// Multi-line block: chain continues on next lines
const MULTI_LINE_CODE = `import { Song, Bass303, Kick808 } from '@score/dsl'

const bass = Bass303('A2')
  .cutoff(600)
  .resonance(0.4)
  .volume(0.6)
const kick = Kick808(4).volume(0.8)

export default Song({ bpm: 128, tracks: [bass, kick] })`
// bass → line index 2 (0-based) through line index 5 → startLine 3, endLine 6
// kick → line index 6 (0-based) → startLine 7, endLine 7

describe('getBlockBounds (t330)', () => {
  it('returns null when tracks is empty', () => {
    expect(getBlockBounds(SINGLE_LINE_CODE, 0, [])).toBeNull()
  })

  it('returns null when track index has no matching line', () => {
    const tracks = [{ type: 'kick', pattern: [1, 0] }]
    expect(getBlockBounds(SINGLE_LINE_CODE, 1, tracks)).toBeNull()
  })

  it('returns single-line bounds for a one-liner instrument block', () => {
    const tracks = [
      { type: 'kick',  pattern: [1, 0] },
      { type: 'snare', pattern: [0, 1] },
    ]
    const result = getBlockBounds(SINGLE_LINE_CODE, 0, tracks)
    expect(result).toEqual({ startLine: 3, endLine: 3 })
  })

  it('second single-line instrument is its own single-line block', () => {
    const tracks = [
      { type: 'kick',  pattern: [1, 0] },
      { type: 'snare', pattern: [0, 1] },
    ]
    const result = getBlockBounds(SINGLE_LINE_CODE, 1, tracks)
    expect(result).toEqual({ startLine: 4, endLine: 4 })
  })

  it('returns multi-line bounds for a chained block', () => {
    const tracks = [
      { type: 'bass303', pattern: ['A2', 0] },
      { type: 'kick',    pattern: [1, 0] },
    ]
    const result = getBlockBounds(MULTI_LINE_CODE, 0, tracks)
    // Bass block: const bass = Bass303('A2') through .volume(0.6)
    expect(result).toEqual({ startLine: 3, endLine: 6 })
  })

  it('returns single-line bounds for a block following a multi-line block', () => {
    const tracks = [
      { type: 'bass303', pattern: ['A2', 0] },
      { type: 'kick',    pattern: [1, 0] },
    ]
    const result = getBlockBounds(MULTI_LINE_CODE, 1, tracks)
    expect(result).toEqual({ startLine: 7, endLine: 7 })
  })

  it('terminates block on new const statement (no blank line between)', () => {
    // SINGLE_LINE_CODE has no blank between kick and snare
    const tracks = [
      { type: 'kick',  pattern: [1, 0] },
      { type: 'snare', pattern: [0, 1] },
    ]
    const kickBounds = getBlockBounds(SINGLE_LINE_CODE, 0, tracks)
    // kick is line 3 — must NOT extend to line 4 (snare's const line)
    expect(kickBounds?.endLine).toBe(3)
  })
})
