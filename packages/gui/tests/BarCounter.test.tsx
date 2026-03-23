import { describe, it, expect } from 'vitest'
import { render, screen }       from '@testing-library/react'
import { BarCounter }           from '../src/renderer/components/status/BarCounter.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultProps = {
  bars:      4,
  step:      2,
  stepCount: 16,
  bpm:       128,
  playing:   true,
}

// ── Rendering — no throw ──────────────────────────────────────────────────────

describe('BarCounter — renders without throw', () => {
  it('renders while playing without throwing', () => {
    expect(() => render(<BarCounter {...defaultProps} />)).not.toThrow()
  })

  it('renders while stopped without throwing', () => {
    expect(() => render(<BarCounter {...defaultProps} playing={false} />)).not.toThrow()
  })
})

// ── Bar number ────────────────────────────────────────────────────────────────

describe('BarCounter — bar number display', () => {
  it('shows bar number as bars + 1 (1-indexed) when playing', () => {
    // bars=4 → display "5"
    render(<BarCounter {...defaultProps} bars={4} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows bar 1 when bars=0', () => {
    render(<BarCounter {...defaultProps} bars={0} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})

// ── Not playing ───────────────────────────────────────────────────────────────

describe('BarCounter — not playing', () => {
  it('shows "—" placeholder when not playing', () => {
    render(<BarCounter {...defaultProps} playing={false} />)
    // Both BAR and STEP show '—' when stopped — expect at least one
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })
})

// ── BPM ───────────────────────────────────────────────────────────────────────

describe('BarCounter — BPM display', () => {
  it('shows the BPM value', () => {
    render(<BarCounter {...defaultProps} bpm={140} />)
    expect(screen.getByText(/140/)).toBeInTheDocument()
  })
})
