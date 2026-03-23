// PerformanceCanvas.test.tsx — Unit tests for the live canvas renderer component.

import { describe, it, expect, vi } from 'vitest'
import { render, screen }           from '@testing-library/react'
import React                        from 'react'
import { PerformanceCanvas }        from '../src/renderer/components/PerformanceMode/PerformanceCanvas.js'
import type { AudioVisualState }    from '@score/visuals'

// @score/visuals — stub theme registry (canvas rendering not available in jsdom)
vi.mock('@score/visuals', () => ({
  getTheme: (_name: string) => ({
    name:        'dark-pulse',
    appTheme:    {},
    canvasTheme: (_state: AudioVisualState) => ({
      _type:      'VisualSceneDescriptor',
      background: '#0e0e11',
      layers:     [],
    }),
  }),
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

const makeState = (overrides: Partial<AudioVisualState> = {}): AudioVisualState => ({
  waveform: [],
  bins:     [],
  tick:     { step: 0, stepCount: 16, bpm: 128, bar: 0, beat: 0, time: 0 },
  rms:      0,
  tracks:   [],
  ...overrides,
})

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('PerformanceCanvas', () => {
  it('renders a canvas element', () => {
    render(<PerformanceCanvas state={makeState()} theme="dark-pulse" editorVisible={true} />)
    expect(screen.getByTestId('performance-canvas')).toBeTruthy()
  })

  it('renders when editorVisible is false', () => {
    render(<PerformanceCanvas state={makeState()} theme="dark-pulse" editorVisible={false} />)
    expect(screen.getByTestId('performance-canvas')).toBeTruthy()
  })

  it('renders without throwing for any theme name', () => {
    expect(() =>
      render(<PerformanceCanvas state={makeState()} theme="lorenz" editorVisible={true} />),
    ).not.toThrow()
  })

  it('renders without throwing for unknown theme (fallback)', () => {
    expect(() =>
      render(<PerformanceCanvas state={makeState()} theme="nonexistent" editorVisible={true} />),
    ).not.toThrow()
  })

  it('renders with tracks in state', () => {
    const state = makeState({
      tracks: [{ name: 'kick', type: 'kick808', active: true, rms: 0.9 }],
    })
    render(<PerformanceCanvas state={state} theme="dark-pulse" editorVisible={true} />)
    expect(screen.getByTestId('performance-canvas')).toBeTruthy()
  })

  it('re-renders cleanly on state update', () => {
    const { rerender } = render(
      <PerformanceCanvas state={makeState({ rms: 0 })} theme="dark-pulse" editorVisible={true} />,
    )
    expect(() =>
      rerender(<PerformanceCanvas state={makeState({ rms: 0.9 })} theme="dark-pulse" editorVisible={true} />),
    ).not.toThrow()
  })

  it('re-renders cleanly on theme change', () => {
    const { rerender } = render(
      <PerformanceCanvas state={makeState()} theme="dark-pulse" editorVisible={true} />,
    )
    expect(() =>
      rerender(<PerformanceCanvas state={makeState()} theme="lorenz" editorVisible={true} />),
    ).not.toThrow()
  })
})
