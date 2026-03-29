// ── LiveCode integration tests ────────────────────────────────────────────────
// Testing Trophy — integration layer.
// Tests cross-component flows within the LiveCode composite: transport ↔ editor
// ↔ IPC bridge interactions that span multiple child components.
//
// Unit-level tests for individual components (TransportBar, CodeEditorPanel,
// ConsoleLogPanel) live in their respective test files. This file covers the
// scenarios where the interaction *between* components is what is being verified.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent }                  from '@testing-library/react'
import userEvent                                            from '@testing-library/user-event'
import { emitBridgeEvent }                                 from './setup.js'
import { LiveCode }                                        from '../src/renderer/components/LiveCode/index.js'

// Monaco editor requires workers — stub for jsdom.
// The stub exposes a controlled textarea so onChange/onEval are testable.
vi.mock('@monaco-editor/react', () => ({
  default: ({
    value,
    onChange,
    onMount,
  }: {
    value?:    string
    onChange?: (v: string) => void
    onMount?:  (editor: unknown, monaco: unknown) => void
  }) => {
    // Provide a minimal editor stub with addCommand so onMount does not throw.
    const editorStub = {
      addCommand: vi.fn(),
      getModel:   vi.fn(() => null),
      focus:      vi.fn(),
      trigger:    vi.fn(),
    }
    const monacoStub = {
      KeyMod:  { CtrlCmd: 2048 },
      KeyCode: { Enter: 3 },
      Range:   class {},
      editor: {
        OverviewRulerLane:     { Left: 1 },
        defineTheme:           vi.fn(),
        setTheme:              vi.fn(),
        setModelLanguage:      vi.fn(),
        TrackedRangeStickiness: { NeverGrowsWhenTypingAtEdges: 1 },
      },
      languages: {
        getLanguages:             vi.fn(() => []),
        register:                 vi.fn(),
        setMonarchTokensProvider: vi.fn(),
        typescript: {
          ScriptTarget:       { ESNext: 99 },
          ModuleKind:         { ESNext: 99 },
          typescriptDefaults: {
            addExtraLib:           vi.fn(),
            setCompilerOptions:    vi.fn(),
            setDiagnosticsOptions: vi.fn(),
          },
        },
      },
    }
    // Call onMount synchronously so addCommand/focus wiring runs
    onMount?.(editorStub, monacoStub)
    return (
      <textarea
        data-testid="monaco-editor"
        value={value ?? ''}
        onChange={e => { onChange?.(e.target.value) }}
      />
    )
  },
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

const setup = () => ({
  user: userEvent.setup(),
  ...render(<LiveCode hardware="pc-only" onHome={vi.fn()} />),
})

// Exact Play/Stop button selectors — avoid matching "Eval song (load without playing)"
const getPlayButton = () => screen.getByRole('button', { name: 'Play' })
const getStopButton = () => screen.getByRole('button', { name: 'Stop' })

// ── Play / Stop flow ──────────────────────────────────────────────────────────

describe('LiveCode integration — play/stop transport cycle', () => {
  it('clicking Play sends engine:eval (eval-before-play pattern)', async () => {
    // LiveCode.onPlay() evals code first; transport:play fires after song:update
    // arrives from the engine (autoPlayRef pattern). In isolation, eval fires.
    const { user } = setup()
    await user.click(getPlayButton())
    expect(window.scoreBridge.send).toHaveBeenCalledWith('engine:eval', expect.objectContaining({ code: expect.any(String) }))
  })

  it('transport:play fires after song:update when autoPlay is pending', async () => {
    // Simulate the full eval→song:update→play cycle
    const { user } = setup()
    await user.click(getPlayButton())
    // engine:eval was sent — now simulate the engine responding with song:update
    act(() => {
      emitBridgeEvent('song:update', {
        tracks: [{ name: 'Kick808', type: 'kick808', pattern: [1, 0, 0, 0] }],
      })
    })
    expect(window.scoreBridge.send).toHaveBeenCalledWith('transport:play', undefined)
  })

  it('clicking Stop after engine:state playing=true sends transport:stop', async () => {
    const { user } = setup()
    act(() => { emitBridgeEvent('engine:state', { playing: true, bpm: 128, bars: 0 }) })
    await user.click(getStopButton())
    expect(window.scoreBridge.send).toHaveBeenCalledWith('transport:stop', undefined)
  })

  it('transport button label reflects engine:state playing toggle', () => {
    setup()
    expect(getPlayButton()).toBeInTheDocument()
    act(() => { emitBridgeEvent('engine:state', { playing: true, bpm: 128, bars: 0 }) })
    expect(getStopButton()).toBeInTheDocument()
    act(() => { emitBridgeEvent('engine:state', { playing: false, bpm: 128, bars: 0 }) })
    expect(getPlayButton()).toBeInTheDocument()
  })
})

// ── engine:panic integration ──────────────────────────────────────────────────

describe('LiveCode integration — engine:panic resets transport', () => {
  it('engine:panic while playing shows panic flash and play button returns', () => {
    setup()
    act(() => { emitBridgeEvent('engine:state', { playing: true, bpm: 128, bars: 0 }) })
    expect(getStopButton()).toBeInTheDocument()
    act(() => { emitBridgeEvent('engine:panic', undefined) })
    expect(screen.getByText(/stopped/i)).toBeInTheDocument()
    act(() => { emitBridgeEvent('engine:state', { playing: false, bpm: 128, bars: 0 }) })
    expect(getPlayButton()).toBeInTheDocument()
  })
})

// ── engine:pending — PendingSwapBadge ─────────────────────────────────────────

describe('LiveCode integration — pending swap badge', () => {
  it('PendingSwapBadge appears when engine:pending fires with true', () => {
    setup()
    act(() => { emitBridgeEvent('engine:pending', { pending: true }) })
    expect(screen.getByLabelText('Pending bar-boundary swap')).toBeInTheDocument()
  })

  it('PendingSwapBadge disappears when engine:pending fires with false', () => {
    setup()
    act(() => { emitBridgeEvent('engine:pending', { pending: true }) })
    expect(screen.getByLabelText('Pending bar-boundary swap')).toBeInTheDocument()
    act(() => { emitBridgeEvent('engine:pending', { pending: false }) })
    expect(screen.queryByLabelText('Pending bar-boundary swap')).not.toBeInTheDocument()
  })
})

// ── file:opened — editor code update ─────────────────────────────────────────

describe('LiveCode integration — file:opened updates editor', () => {
  it('editor textarea reflects code from file:opened event', () => {
    setup()
    const newCode = "export default Song({ bpm: 140, tracks: [] })"
    act(() => { emitBridgeEvent('file:opened', { code: newCode }) })
    const editor = screen.getByTestId('monaco-editor') as HTMLTextAreaElement
    expect(editor.value).toBe(newCode)
  })
})

// ── engine:state bars display ─────────────────────────────────────────────────

describe('LiveCode integration — engine:state bars counter in TransportBar', () => {
  it('bar counter output updates when engine:state delivers bars', () => {
    setup()
    act(() => { emitBridgeEvent('engine:state', { playing: true, bpm: 128, bars: 8 }) })
    // TransportBar: <label htmlFor="barsId">Bar</label> + <output id="barsId">
    expect(screen.getByLabelText('Bar')).toHaveTextContent('8')
  })
})

// ── display:tick — no crash ───────────────────────────────────────────────────

describe('LiveCode integration — display:tick decorations do not crash', () => {
  it('display:tick events do not throw', () => {
    setup()
    expect(() => {
      act(() => {
        emitBridgeEvent('display:tick', { step: 0,  stepCount: 16, bar: 1, beat: 0, bpm: 128 })
        emitBridgeEvent('display:tick', { step: 4,  stepCount: 16, bar: 1, beat: 1, bpm: 128 })
        emitBridgeEvent('display:tick', { step: 8,  stepCount: 16, bar: 1, beat: 2, bpm: 128 })
        emitBridgeEvent('display:tick', { step: 12, stepCount: 16, bar: 1, beat: 3, bpm: 128 })
      })
    }).not.toThrow()
  })

  it('display:tick with song:update does not crash', () => {
    setup()
    expect(() => {
      act(() => {
        emitBridgeEvent('song:update', {
          tracks: [
            { name: 'Kick808', type: 'kick808', pattern: [1, 0, 0, 0, 1, 0, 0, 0] },
            { name: 'Synth',   type: 'synth',   pattern: [0, 0, 1, 0, 0, 0, 1, 0] },
          ],
        })
        emitBridgeEvent('display:tick', { step: 0, stepCount: 16, bar: 2, beat: 0, bpm: 128 })
      })
    }).not.toThrow()
  })
})

// ── BPM wiring: TransportBar → engine:eval ────────────────────────────────────
// Uses fireEvent (synchronous) rather than userEvent so fake timers work cleanly.

describe('LiveCode integration — BPM change propagates through TransportBar', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(()  => { vi.useRealTimers() })

  it('BPM change in TransportBar sends engine:eval with updated bpm after debounce', () => {
    setup()
    const bpmInput = screen.getByRole('spinbutton', { name: /bpm/i })
    fireEvent.change(bpmInput, { target: { value: '150' } })
    expect(window.scoreBridge.send).not.toHaveBeenCalledWith('engine:eval', expect.objectContaining({ code: expect.stringContaining('bpm: 150') }))
    act(() => { vi.advanceTimersByTime(300) })
    expect(window.scoreBridge.send).toHaveBeenCalledWith('engine:eval', expect.objectContaining({ code: expect.stringContaining('bpm: 150') }))
  })
})

// ── onHome callback ───────────────────────────────────────────────────────────

describe('LiveCode integration — onHome callback from TransportBar', () => {
  it('clicking Score Studio home button triggers onHome prop', async () => {
    const onHome = vi.fn()
    const user = userEvent.setup()
    render(<LiveCode hardware="pc-only" onHome={onHome} />)
    await user.click(screen.getByRole('button', { name: /score studio home/i }))
    expect(onHome).toHaveBeenCalledOnce()
  })
})
