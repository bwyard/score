// ConsoleLogPanel.test.tsx — Unit tests for the self-contained console log panel.

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act }                  from '@testing-library/react'
import { fireEvent }                            from '@testing-library/react'
import { emitBridgeEvent }                      from './setup.js'
import { ConsoleLogPanel }                      from '../src/renderer/components/shared/ConsoleLogPanel.js'

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ConsoleLogPanel', () => {
  afterEach(() => { vi.clearAllMocks() })

  it('renders an empty state message when no entries exist', () => {
    render(<ConsoleLogPanel />)
    expect(screen.getByText(/no output yet/i)).toBeInTheDocument()
  })

  it('has role="log" with label "Engine console"', () => {
    render(<ConsoleLogPanel />)
    expect(screen.getByRole('log', { name: 'Engine console' })).toBeInTheDocument()
  })

  it('renders a Clear button', () => {
    render(<ConsoleLogPanel />)
    expect(screen.getByRole('button', { name: /clear console/i })).toBeInTheDocument()
  })

  it('adds EVAL entry when song:update fires', () => {
    render(<ConsoleLogPanel />)
    act(() => {
      emitBridgeEvent('song:update', { tracks: [{ name: 'Kick', type: 'kick808', pattern: [] }] })
    })
    expect(screen.getByText('Song loaded — 1 track')).toBeInTheDocument()
    expect(screen.getByText('EVAL')).toBeInTheDocument()
  })

  it('pluralises "tracks" for multiple tracks', () => {
    render(<ConsoleLogPanel />)
    act(() => {
      emitBridgeEvent('song:update', {
        tracks: [
          { name: 'Kick', type: 'kick808', pattern: [] },
          { name: 'Snare', type: 'snare909', pattern: [] },
        ],
      })
    })
    expect(screen.getByText('Song loaded — 2 tracks')).toBeInTheDocument()
  })

  it('adds ERROR entry when song:error fires', () => {
    render(<ConsoleLogPanel />)
    act(() => {
      emitBridgeEvent('song:error', { message: 'Kick is not defined' })
    })
    expect(screen.getByText('Kick is not defined')).toBeInTheDocument()
    expect(screen.getByText('ERROR')).toBeInTheDocument()
  })

  it('adds ERROR entry when error:report fires', () => {
    render(<ConsoleLogPanel />)
    act(() => {
      emitBridgeEvent('error:report', { message: 'Legacy report error' })
    })
    expect(screen.getByText('Legacy report error')).toBeInTheDocument()
  })

  it('adds ERROR entry prefixed with [engine] when engine:error fires', () => {
    render(<ConsoleLogPanel />)
    act(() => {
      emitBridgeEvent('engine:error', { message: 'effect hydration failed' })
    })
    expect(screen.getByText('[engine] effect hydration failed')).toBeInTheDocument()
  })

  it('adds BAR entry when engine:tick fires at step 0', () => {
    render(<ConsoleLogPanel />)
    act(() => {
      emitBridgeEvent('engine:tick', { step: 0, stepCount: 16, bar: 0, beat: 0, bpm: 128 })
    })
    expect(screen.getByText('Bar 1')).toBeInTheDocument()
    expect(screen.getByText('BAR')).toBeInTheDocument()
  })

  it('does NOT add BAR entry for steps other than 0', () => {
    render(<ConsoleLogPanel />)
    act(() => {
      emitBridgeEvent('engine:tick', { step: 4, stepCount: 16, bar: 0, beat: 1, bpm: 128 })
    })
    expect(screen.queryByText('BAR')).not.toBeInTheDocument()
  })

  it('bar number is 1-indexed (bar 0 → "Bar 1")', () => {
    render(<ConsoleLogPanel />)
    act(() => {
      emitBridgeEvent('engine:tick', { step: 0, stepCount: 16, bar: 3, beat: 0, bpm: 128 })
    })
    expect(screen.getByText('Bar 4')).toBeInTheDocument()
  })

  it('clears all entries when Clear button is clicked', () => {
    render(<ConsoleLogPanel />)
    act(() => {
      emitBridgeEvent('song:update', { tracks: [{ name: 'Kick', type: 'kick808', pattern: [] }] })
    })
    expect(screen.getByText('Song loaded — 1 track')).toBeInTheDocument()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /clear console/i }))
    })
    expect(screen.queryByText('Song loaded — 1 track')).not.toBeInTheDocument()
    expect(screen.getByText(/no output yet/i)).toBeInTheDocument()
  })

  it('accumulates multiple entries in order', () => {
    render(<ConsoleLogPanel />)
    act(() => {
      emitBridgeEvent('song:update', { tracks: [{ name: 'Kick', type: 'kick808', pattern: [] }] })
      emitBridgeEvent('song:error', { message: 'oops' })
    })
    const log = screen.getByRole('log', { name: 'Engine console' })
    expect(log).toHaveTextContent('Song loaded — 1 track')
    expect(log).toHaveTextContent('oops')
  })
})
