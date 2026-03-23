import { describe, it, expect, vi } from 'vitest'
import { render, screen }           from '@testing-library/react'
import { CodeEditorPanel }           from '../src/renderer/components/shared/CodeEditorPanel.js'
import type { EditorDecoration }    from '../src/renderer/components/shared/CodeEditorPanel.js'

// Monaco editor renders a loader in jsdom — stub it out.
// The real Monaco bundle requires a DOM canvas and workers; in jsdom we verify
// the wrapper renders, exports its types, and passes props without throwing.
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, 'aria-label': ariaLabel }: { value?: string; 'aria-label'?: string }) => (
    <div data-testid="monaco-editor" aria-label={ariaLabel}>
      {value}
    </div>
  ),
}))

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('CodeEditorPanel — rendering', () => {
  it('renders without throwing', () => {
    expect(() => render(
      <CodeEditorPanel value="const x = 1" onChange={vi.fn()} onEval={vi.fn()} />,
    )).not.toThrow()
  })

  it('renders Monaco editor stub', () => {
    render(<CodeEditorPanel value="bpm: 128" onChange={vi.fn()} onEval={vi.fn()} />)
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  })
})

// ── Types ─────────────────────────────────────────────────────────────────────

describe('CodeEditorPanel — EditorDecoration type', () => {
  it('accepts valid decoration objects', () => {
    const dec: EditorDecoration = {
      startLine:   3,
      endLine:     3,
      className:   'score-beat-active',
      isWholeLine: true,
    }
    expect(dec.startLine).toBe(3)
    expect(dec.className).toBe('score-beat-active')
  })

  it('renders with decorations prop without throwing', () => {
    const decorations: ReadonlyArray<EditorDecoration> = [
      { startLine: 1, endLine: 1, className: 'score-beat-active' },
      { startLine: 5, endLine: 5, className: 'score-beat-active' },
    ]
    expect(() => render(
      <CodeEditorPanel
        value="code"
        onChange={vi.fn()}
        onEval={vi.fn()}
        decorations={decorations}
      />,
    )).not.toThrow()
  })

  it('renders with empty decorations array', () => {
    expect(() => render(
      <CodeEditorPanel value="code" onChange={vi.fn()} onEval={vi.fn()} decorations={[]} />,
    )).not.toThrow()
  })
})
