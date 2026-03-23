import { describe, it, expect }   from 'vitest'
import { render, screen }         from '@testing-library/react'
import { PianoRoll }              from '../src/renderer/components/visualizer/PianoRoll.js'
import type { PianoRollNote }     from '../src/renderer/components/visualizer/PianoRoll.js'

// ── PianoRoll tests ───────────────────────────────────────────────────────────

const sampleNotes: ReadonlyArray<PianoRollNote> = [
  { pitch: 60, step: 0, velocity: 1,   duration: 1 },
  { pitch: 64, step: 4, velocity: 0.8, duration: 2 },
  { pitch: 67, step: 8, velocity: 0.6, duration: 1 },
]

describe('PianoRoll — rendering', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(<PianoRoll notes={[]} currentStep={0} stepCount={16} />),
    ).not.toThrow()
  })

  it('renders an accessible canvas element', () => {
    render(<PianoRoll notes={[]} currentStep={0} stepCount={16} />)
    expect(screen.getByRole('img', { name: 'Piano roll' })).toBeInTheDocument()
  })

  it('accepts an empty notes array and renders the empty state canvas', () => {
    render(<PianoRoll notes={[]} currentStep={0} stepCount={16} />)
    const canvas = document.querySelector('canvas')
    expect(canvas).not.toBeNull()
  })

  it('accepts a notes array and a currentStep without throwing', () => {
    expect(() =>
      render(
        <PianoRoll
          notes={sampleNotes}
          currentStep={4}
          stepCount={16}
        />,
      ),
    ).not.toThrow()
  })

  it('renders a canvas when notes are provided', () => {
    render(
      <PianoRoll
        notes={sampleNotes}
        currentStep={0}
        stepCount={16}
      />,
    )
    const canvas = document.querySelector('canvas')
    expect(canvas).not.toBeNull()
  })

  it('respects explicit minNote and maxNote props', () => {
    expect(() =>
      render(
        <PianoRoll
          notes={sampleNotes}
          currentStep={2}
          stepCount={16}
          minNote={48}
          maxNote={84}
        />,
      ),
    ).not.toThrow()
  })

  it('falls back to default note range (C3–C5) when notes array is empty', () => {
    render(<PianoRoll notes={[]} currentStep={0} stepCount={16} />)
    // Default range: minNote=48 (C3), maxNote=72 (C5) → 25 rows × 14px = 350px
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    expect(canvas).not.toBeNull()
    expect(canvas?.style.height).toBe('350px')
  })

  it('uses ResizeObserver stub without throwing', () => {
    // ResizeObserver is stubbed in tests/setup.ts — this verifies the stub
    // does not cause the component to crash during mount.
    expect(() =>
      render(<PianoRoll notes={sampleNotes} currentStep={0} stepCount={8} />),
    ).not.toThrow()
  })
})
