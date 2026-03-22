import { describe, it, expect }  from 'vitest'
import { render, screen }        from '@testing-library/react'
import { SpectrumAnalyser }      from '../src/renderer/components/visualizer/SpectrumAnalyser.js'

// ── SpectrumAnalyser tests ─────────────────────────────────────────────────────

describe('SpectrumAnalyser — rendering', () => {
  it('renders a canvas element', () => {
    render(<SpectrumAnalyser bins={[0.1, 0.5, 0.8]} playing={false} />)
    const canvas = document.querySelector('canvas')
    expect(canvas).not.toBeNull()
  })

  it('sets aria-label on the canvas', () => {
    render(<SpectrumAnalyser bins={[0.1, 0.5, 0.8]} playing={true} />)
    expect(screen.getByRole('img', { name: 'Spectrum analyser' })).toBeInTheDocument()
  })

  it('does not throw when bins array is empty', () => {
    expect(() =>
      render(<SpectrumAnalyser bins={[]} playing={false} />),
    ).not.toThrow()
  })

  it('does not throw when all bins are zero', () => {
    expect(() =>
      render(<SpectrumAnalyser bins={[0, 0, 0, 0]} playing={false} />),
    ).not.toThrow()
  })

  it('renders with default color (#6a9fff) when color prop is omitted', () => {
    render(<SpectrumAnalyser bins={[0.5, 0.3]} playing={false} />)
    const canvas = document.querySelector('canvas')
    expect(canvas?.dataset['color']).toBe('#6a9fff')
  })

  it('reflects custom color in data-color attribute', () => {
    render(<SpectrumAnalyser bins={[0.5]} playing={true} color="#ff4488" />)
    const canvas = document.querySelector('canvas')
    expect(canvas?.dataset['color']).toBe('#ff4488')
  })
})
