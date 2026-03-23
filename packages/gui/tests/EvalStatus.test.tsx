import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act }                               from '@testing-library/react'
import { EvalStatus }                                        from '../src/renderer/components/status/EvalStatus.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// ── Rendering — no throw ──────────────────────────────────────────────────────

describe('EvalStatus — renders without throw for each status kind', () => {
  it('renders idle without throwing', () => {
    expect(() => render(<EvalStatus status="idle" />)).not.toThrow()
  })

  it('renders ok without throwing', () => {
    expect(() => render(<EvalStatus status="ok" timestamp={Date.now()} />)).not.toThrow()
  })

  it('renders error without throwing', () => {
    expect(() => render(<EvalStatus status="error" message="SyntaxError: unexpected token" />)).not.toThrow()
  })

  it('renders pending without throwing', () => {
    expect(() => render(<EvalStatus status="pending" />)).not.toThrow()
  })
})

// ── idle ──────────────────────────────────────────────────────────────────────

describe('EvalStatus — idle', () => {
  it('shows "Ready" when status is idle', () => {
    render(<EvalStatus status="idle" />)
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })
})

// ── error ─────────────────────────────────────────────────────────────────────

describe('EvalStatus — error', () => {
  it('shows the message prop when status is error', () => {
    render(<EvalStatus status="error" message="SyntaxError: unexpected token" />)
    expect(screen.getByText(/SyntaxError/)).toBeInTheDocument()
  })

  it('shows "Error" label when status is error', () => {
    render(<EvalStatus status="error" message="Something went wrong" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('renders without message when status is error', () => {
    expect(() => render(<EvalStatus status="error" />)).not.toThrow()
    expect(screen.getByText('Error')).toBeInTheDocument()
  })
})

// ── pending ───────────────────────────────────────────────────────────────────

describe('EvalStatus — pending', () => {
  it('shows "Pending" text when status is pending', () => {
    render(<EvalStatus status="pending" />)
    expect(screen.getByText(/Pending/)).toBeInTheDocument()
  })
})

// ── ok ───────────────────────────────────────────────────────────────────────

describe('EvalStatus — ok', () => {
  it('shows "OK" label when status is ok', () => {
    render(<EvalStatus status="ok" timestamp={Date.now()} />)
    expect(screen.getByText('OK')).toBeInTheDocument()
  })

  it('shows relative time when status is ok with timestamp', () => {
    const now = Date.now()
    render(<EvalStatus status="ok" timestamp={now - 5000} />)
    // 5 seconds ago → "5s ago"
    expect(screen.getByText(/ago/)).toBeInTheDocument()
  })

  it('updates relative time via interval', () => {
    const now = Date.now()
    render(<EvalStatus status="ok" timestamp={now} />)
    act(() => { vi.advanceTimersByTime(3000) })
    // At least "0s ago" or "3s ago" should be present
    expect(screen.getByText(/ago/)).toBeInTheDocument()
  })
})
