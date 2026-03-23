import { describe, it, expect, vi }        from 'vitest'
import { render, screen, fireEvent }        from '@testing-library/react'
import { PerformanceMode }                  from '../src/renderer/components/PerformanceMode/index.js'

// Monaco editor requires workers + canvas — stub it for jsdom
vi.mock('@monaco-editor/react', () => ({
  default: ({ value }: { value?: string }) => (
    <div data-testid="monaco-editor">{value}</div>
  ),
}))

// @score/visuals — stub theme registry for jsdom
vi.mock('@score/visuals', () => ({
  getTheme: () => ({
    name:        'dark-pulse',
    appTheme:    {},
    canvasTheme: () => ({ _type: 'VisualSceneDescriptor', background: '#000', layers: [] }),
  }),
}))

// scoreBridge is injected by the preload script — stub it for tests
const mockSend = vi.fn()
Object.defineProperty(window, 'scoreBridge', {
  value:    { send: mockSend, on: vi.fn(() => vi.fn()) },
  writable: true,
})

// ── Rendering ──────────────────────────────────────────────────────────────────

describe('PerformanceMode — rendering', () => {
  it('renders without throwing', () => {
    expect(() => render(
      <PerformanceMode hardware="pc-only" onHome={vi.fn()} />,
    )).not.toThrow()
  })

  it('shows Monaco editor on mount (editor visible by default)', () => {
    render(<PerformanceMode hardware="pc-only" onHome={vi.fn()} />)
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  })

  it('shows Performance mode label', () => {
    render(<PerformanceMode hardware="pc-only" onHome={vi.fn()} />)
    expect(screen.getByText(/performance/i)).toBeInTheDocument()
  })

  it('renders a canvas element for the visual area', () => {
    render(<PerformanceMode hardware="pc-only" onHome={vi.fn()} />)
    expect(document.querySelector('canvas[data-testid="performance-canvas"]')).not.toBeNull()
  })

  it('shows Tab hint text', () => {
    render(<PerformanceMode hardware="pc-only" onHome={vi.fn()} />)
    expect(screen.getByText(/tab/i)).toBeInTheDocument()
  })
})

// ── Home navigation ────────────────────────────────────────────────────────────

describe('PerformanceMode — home navigation', () => {
  it('calls onHome when Home button is clicked', () => {
    const onHome = vi.fn()
    render(<PerformanceMode hardware="pc-only" onHome={onHome} />)
    fireEvent.click(screen.getByText(/home/i))
    expect(onHome).toHaveBeenCalledOnce()
  })
})

// ── Tab toggle ─────────────────────────────────────────────────────────────────

describe('PerformanceMode — Tab toggle', () => {
  it('hides editor when Tab is pressed on body', () => {
    render(<PerformanceMode hardware="pc-only" onHome={vi.fn()} />)
    // Editor visible initially
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()

    // Press Tab on body (not inside a text input)
    fireEvent.keyDown(window, { key: 'Tab', target: document.body })
    expect(screen.queryByTestId('monaco-editor')).not.toBeInTheDocument()
  })

  it('restores editor when Tab is pressed a second time', () => {
    render(<PerformanceMode hardware="pc-only" onHome={vi.fn()} />)

    fireEvent.keyDown(window, { key: 'Tab', target: document.body })
    expect(screen.queryByTestId('monaco-editor')).not.toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Tab', target: document.body })
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  })

  it('does not toggle on Ctrl+Tab', () => {
    render(<PerformanceMode hardware="pc-only" onHome={vi.fn()} />)
    fireEvent.keyDown(window, { key: 'Tab', ctrlKey: true, target: document.body })
    // Editor should still be visible
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  })
})

// ── Hardware prop ──────────────────────────────────────────────────────────────

describe('PerformanceMode — hardware variants', () => {
  it('renders with controller hardware', () => {
    expect(() => render(
      <PerformanceMode hardware="controller" onHome={vi.fn()} />,
    )).not.toThrow()
  })

  it('renders with aio hardware', () => {
    expect(() => render(
      <PerformanceMode hardware="aio" onHome={vi.fn()} />,
    )).not.toThrow()
  })
})
