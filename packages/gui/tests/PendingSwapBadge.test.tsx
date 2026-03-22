import { describe, it, expect } from 'vitest'
import { render, screen }       from '@testing-library/react'
import { PendingSwapBadge }     from '../src/renderer/components/status/PendingSwapBadge.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultProps = {
  pending:   true,
  step:      6,
  stepCount: 16,
}

// ── pending=false ─────────────────────────────────────────────────────────────

describe('PendingSwapBadge — pending false', () => {
  it('renders null when pending=false', () => {
    const { container } = render(<PendingSwapBadge pending={false} step={0} stepCount={16} />)
    expect(container.firstChild).toBeNull()
  })
})

// ── pending=true ──────────────────────────────────────────────────────────────

describe('PendingSwapBadge — pending true', () => {
  it('renders visible content when pending=true', () => {
    render(<PendingSwapBadge {...defaultProps} />)
    expect(screen.getByText(/swap on next bar/i)).toBeInTheDocument()
  })

  it('shows the swap indicator symbol', () => {
    render(<PendingSwapBadge {...defaultProps} />)
    expect(screen.getByText(/⟳/)).toBeInTheDocument()
  })
})

// ── Step progress ─────────────────────────────────────────────────────────────

describe('PendingSwapBadge — step progress', () => {
  it('shows current step and stepCount in progress indicator', () => {
    render(<PendingSwapBadge {...defaultProps} step={6} stepCount={16} />)
    expect(screen.getByText(/6/)).toBeInTheDocument()
    expect(screen.getByText(/16/)).toBeInTheDocument()
  })

  it('shows step=0 and stepCount in progress indicator', () => {
    render(<PendingSwapBadge pending={true} step={0} stepCount={8} />)
    expect(screen.getByText(/0/)).toBeInTheDocument()
    expect(screen.getByText(/8/)).toBeInTheDocument()
  })
})
