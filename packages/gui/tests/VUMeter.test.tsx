import { describe, it, expect }  from 'vitest'
import { render, screen }        from '@testing-library/react'
import { VUMeter }               from '../src/renderer/components/visualizer/VUMeter.js'

// ── VUMeter tests ─────────────────────────────────────────────────────────────

describe('VUMeter — rendering', () => {
  it('renders a canvas element', () => {
    render(<VUMeter level={0.5} peak={0.7} label="Master" />)
    // The canvas is identified by its aria-label role="img"
    const canvas = document.querySelector('canvas')
    expect(canvas).not.toBeNull()
  })

  it('sets aria-label from label prop', () => {
    render(<VUMeter level={0.5} peak={0.7} label="Kick" />)
    expect(screen.getByRole('img', { name: 'Kick' })).toBeInTheDocument()
  })

  it('renders with default color (#6a9fff) when color prop is omitted', () => {
    // Default color is used internally on the canvas — we verify the component
    // renders without error and the data-color attribute reflects the default.
    render(<VUMeter level={0.5} peak={0.7} label="Bass" />)
    const canvas = document.querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas?.dataset['color']).toBe('#6a9fff')
  })

  it('reflects custom color in data-color attribute', () => {
    render(<VUMeter level={0.8} peak={0.9} label="Lead" color="#ff8800" />)
    const canvas = document.querySelector('canvas')
    expect(canvas?.dataset['color']).toBe('#ff8800')
  })

  it('renders without throwing when level and peak are 0', () => {
    expect(() =>
      render(<VUMeter level={0} peak={0} label="Silent" />),
    ).not.toThrow()
  })

  it('renders without throwing when level and peak are 1', () => {
    expect(() =>
      render(<VUMeter level={1} peak={1} label="Full" />),
    ).not.toThrow()
  })
})
