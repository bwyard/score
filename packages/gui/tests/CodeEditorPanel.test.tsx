import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen }                        from '@testing-library/react'
import { CodeEditorPanel }                       from '../src/renderer/components/shared/CodeEditorPanel.js'
import type { EditorDecoration }                 from '../src/renderer/components/shared/CodeEditorPanel.js'

// ── Monaco mock spies (hoisted so the vi.mock factory can reference them) ──────

const { addExtraLibSpy, setCompilerOptsSpy, setDiagnosticsSpy } = vi.hoisted(() => ({
  addExtraLibSpy:     vi.fn(),
  setCompilerOptsSpy: vi.fn(),
  setDiagnosticsSpy:  vi.fn(),
}))

// Monaco editor renders a loader in jsdom — stub it out.
// The real Monaco bundle requires a DOM canvas and workers; in jsdom we verify
// the wrapper renders, exports its types, passes props, and calls the
// TypeScript language service APIs (addExtraLib, setCompilerOptions,
// setDiagnosticsOptions) on mount.
vi.mock('@monaco-editor/react', () => ({
  default: ({
    value,
    'aria-label': ariaLabel,
    onMount,
  }: {
    value?:        string
    'aria-label'?: string
    onMount?:      (editor: unknown, monaco: unknown) => void
  }) => {
    if (typeof onMount === 'function') {
      const editorStub = {
        addCommand:       () => {},
        focus:            () => {},
        trigger:          () => {},
        deltaDecorations: () => [],
        getModel:         () => ({}),
      }
      const monacoStub = {
        languages: {
          getLanguages:             () => [],
          register:                 () => {},
          setMonarchTokensProvider: () => {},
          typescript: {
            typescriptDefaults: {
              addExtraLib:           addExtraLibSpy,
              setCompilerOptions:    setCompilerOptsSpy,
              setDiagnosticsOptions: setDiagnosticsSpy,
            },
            ScriptTarget: { ESNext: 99 },
            ModuleKind:   { ESNext: 99 },
          },
        },
        editor: {
          defineTheme:            () => {},
          setTheme:               () => {},
          OverviewRulerLane:      { Left: 1 },
          TrackedRangeStickiness: { NeverGrowsWhenTypingAtEdges: 1 },
        },
        Range:   class { constructor(..._args: unknown[]) {} },
        KeyMod:  { CtrlCmd: 2048 },
        KeyCode: { Enter: 3 },
      }
      onMount(editorStub, monacoStub)
    }
    return (
      <div data-testid="monaco-editor" aria-label={ariaLabel}>
        {value}
      </div>
    )
  },
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

// ── Value passthrough ─────────────────────────────────────────────────────────

describe('CodeEditorPanel — value passthrough', () => {
  it('passes value into editor stub content', () => {
    render(<CodeEditorPanel value="export default Song({ bpm: 128, tracks: [] })" onChange={vi.fn()} onEval={vi.fn()} />)
    expect(screen.getByTestId('monaco-editor')).toHaveTextContent('export default Song({ bpm: 128, tracks: [] })')
  })

  it('renders empty string value without throwing', () => {
    expect(() => render(
      <CodeEditorPanel value="" onChange={vi.fn()} onEval={vi.fn()} />,
    )).not.toThrow()
  })
})

// ── stepBadges prop ───────────────────────────────────────────────────────────

describe('CodeEditorPanel — stepBadges prop', () => {
  it('renders with stepBadges without throwing', () => {
    expect(() => render(
      <CodeEditorPanel
        value="const kick = Kick808({})"
        onChange={vi.fn()}
        onEval={vi.fn()}
        stepBadges={[{ line: 1, step: 3, total: 16 }]}
      />,
    )).not.toThrow()
  })

  it('renders with multiple stepBadges without throwing', () => {
    expect(() => render(
      <CodeEditorPanel
        value="code"
        onChange={vi.fn()}
        onEval={vi.fn()}
        stepBadges={[
          { line: 1, step: 0,  total: 16 },
          { line: 3, step: 4,  total: 8  },
          { line: 5, step: 15, total: 16 },
        ]}
      />,
    )).not.toThrow()
  })

  it('renders with empty stepBadges array without throwing', () => {
    expect(() => render(
      <CodeEditorPanel value="code" onChange={vi.fn()} onEval={vi.fn()} stepBadges={[]} />,
    )).not.toThrow()
  })
})

// ── t220 — importsVisible prop ─────────────────────────────────────────────────

describe('CodeEditorPanel — importsVisible (t220)', () => {
  it('renders without throwing when importsVisible is true', () => {
    expect(() => render(
      <CodeEditorPanel value="import { Song } from '@score/dsl'\nexport default Song({ bpm: 128, tracks: [] })" onChange={vi.fn()} onEval={vi.fn()} importsVisible={true} />,
    )).not.toThrow()
  })

  it('renders without throwing when importsVisible is false', () => {
    expect(() => render(
      <CodeEditorPanel value="import { Song } from '@score/dsl'\nexport default Song({ bpm: 128, tracks: [] })" onChange={vi.fn()} onEval={vi.fn()} importsVisible={false} />,
    )).not.toThrow()
  })

  it('defaults importsVisible to true (no prop = imports shown)', () => {
    // No importsVisible prop — should render normally without throwing
    expect(() => render(
      <CodeEditorPanel value="import { Song } from '@score/dsl'\nexport default Song({ bpm: 128, tracks: [] })" onChange={vi.fn()} onEval={vi.fn()} />,
    )).not.toThrow()
  })
})

// ── 13v Monaco IntelliSense setup ─────────────────────────────────────────────
// Verifies that the TypeScript language service is fully configured on editor
// mount: addExtraLib (Score DSL types), setCompilerOptions (permissive),
// setDiagnosticsOptions (suppress lib noise). Relies on the onMount-calling
// Monaco stub above.

describe('CodeEditorPanel — Monaco IntelliSense setup (13v)', () => {
  beforeEach(() => {
    addExtraLibSpy.mockClear()
    setCompilerOptsSpy.mockClear()
    setDiagnosticsSpy.mockClear()
  })

  it('addExtraLib called on mount with Score DSL type declarations', () => {
    render(<CodeEditorPanel value="" onChange={vi.fn()} onEval={vi.fn()} />)
    expect(addExtraLibSpy).toHaveBeenCalledWith(
      expect.stringContaining('declare function Kick'),
      'file:///node_modules/@score/dsl/index.d.ts',
    )
  })

  it('setCompilerOptions called on mount with permissive TS settings', () => {
    render(<CodeEditorPanel value="" onChange={vi.fn()} onEval={vi.fn()} />)
    expect(setCompilerOptsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        strict:        false,
        noImplicitAny: false,
        skipLibCheck:  true,
      }),
    )
  })

  it('setDiagnosticsOptions called on mount suppressing lib errors', () => {
    render(<CodeEditorPanel value="" onChange={vi.fn()} onEval={vi.fn()} />)
    expect(setDiagnosticsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        noSemanticValidation:    false,
        noSyntaxValidation:      false,
        diagnosticCodesToIgnore: expect.arrayContaining([2307, 2580]),
      }),
    )
  })

  it('addExtraLib URI uses node_modules path for @score/dsl module resolution', () => {
    render(<CodeEditorPanel value="" onChange={vi.fn()} onEval={vi.fn()} />)
    const [, uri] = addExtraLibSpy.mock.calls[0] as [string, string]
    expect(uri).toBe('file:///node_modules/@score/dsl/index.d.ts')
  })
})
