import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent }                  from '@testing-library/react'
import { emitBridgeEvent }                                 from './setup.js'
import { LiveCode }                                        from '../src/renderer/components/LiveCode/index.js'

// Monaco editor requires workers — stub for jsdom
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value?: string; onChange?: (v: string) => void }) => (
    <textarea data-testid="monaco-editor" value={value ?? ''} onChange={e => { onChange?.(e.target.value) }} />
  ),
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

const setup = () => render(<LiveCode hardware="pc-only" onHome={vi.fn()} />)

// ── t149: BPM bidirectional wiring ────────────────────────────────────────────

describe('LiveCode — BPM wiring: patchBpm + debounced re-eval (t149)', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(()  => { vi.useRealTimers() })

  it('does NOT send engine:eval immediately when BPM changes', () => {
    setup()
    const bpmInput = screen.getByRole('spinbutton', { name: /bpm/i })
    fireEvent.change(bpmInput, { target: { value: '140' } })
    expect(window.scoreBridge.send).not.toHaveBeenCalledWith('engine:eval', expect.anything())
  })

  it('sends engine:eval with patched bpm after 300ms debounce', () => {
    setup()
    const bpmInput = screen.getByRole('spinbutton', { name: /bpm/i })
    fireEvent.change(bpmInput, { target: { value: '140' } })
    act(() => { vi.advanceTimersByTime(300) })
    expect(window.scoreBridge.send).toHaveBeenCalledWith(
      'engine:eval',
      expect.objectContaining({ code: expect.stringContaining('bpm: 140') }),
    )
  })

  it('does not send engine:eval before 300ms elapses', () => {
    setup()
    const bpmInput = screen.getByRole('spinbutton', { name: /bpm/i })
    fireEvent.change(bpmInput, { target: { value: '140' } })
    act(() => { vi.advanceTimersByTime(299) })
    expect(window.scoreBridge.send).not.toHaveBeenCalledWith('engine:eval', expect.anything())
  })

  it('debounce resets on rapid BPM changes — only last value triggers eval', () => {
    setup()
    const bpmInput = screen.getByRole('spinbutton', { name: /bpm/i })
    fireEvent.change(bpmInput, { target: { value: '130' } })
    act(() => { vi.advanceTimersByTime(200) })
    fireEvent.change(bpmInput, { target: { value: '140' } })
    act(() => { vi.advanceTimersByTime(200) })
    // 200ms since last change — debounce not yet triggered
    expect(window.scoreBridge.send).not.toHaveBeenCalledWith('engine:eval', expect.anything())
    act(() => { vi.advanceTimersByTime(100) })
    // 300ms since last change — fires now
    const evalCalls = (window.scoreBridge.send as ReturnType<typeof vi.fn>).mock.calls
      .filter((args: unknown[]) => args[0] === 'engine:eval')
    expect(evalCalls).toHaveLength(1)
    expect(evalCalls[0]?.[1]).toMatchObject({ code: expect.stringContaining('bpm: 140') })
  })
})

// ── 12b.2: Step click re-eval wiring ─────────────────────────────────────────

describe('LiveCode — step click re-eval wiring (12b.2)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // PunchcardGrid handleClick uses canvas.clientWidth for step coordinate math.
    // jsdom returns 0 by default — override to a known value so clicks land.
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
      configurable: true, get: () => 420,
    })
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
      configurable: true, get: () => 60,
    })
  })
  afterEach(() => {
    vi.useRealTimers()
    // Restore original (0) so other tests are not affected
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
      configurable: true, get: () => 0,
    })
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
      configurable: true, get: () => 0,
    })
  })

  it('sends engine:eval after a step click and 300ms debounce', () => {
    setup()

    // Populate tracks so onStepClick has a pattern to toggle
    act(() => {
      emitBridgeEvent('song:update', {
        tracks: [{ name: 'Kick', type: 'kick808', pattern: [1, 0, 0, 0, 1, 0, 0, 0] }],
      })
    })

    // PunchcardGrid renders as a canvas. With clientWidth=420:
    //   LABEL_WIDTH=52, cellAreaWidth=368, stepCount defaults to 8
    //   cellWidth = (368 - 7*1) / 8 = 45.125
    //   Step 0 x-range: [52, 97.1]. Track 0 y-range: [0, 28].
    //   Click at (70, 14) → track 0, step 0.
    //
    // PunchcardGrid canvas is inside the floating Step Grid DraggablePanel.
    // It is the first canvas with an onClick handler.
    const canvases = document.querySelectorAll('canvas')
    // Find the PunchcardGrid canvas — it's the one inside the DraggablePanel titled "Step Grid"
    // Since there is no direct accessible way, use the first canvas that has cursor:pointer style
    // (PunchcardGrid sets cursor:'pointer' when onStepClick is provided).
    // Fallback: try each canvas until the click triggers the expected eval.
    const punchcardCanvas = Array.from(canvases).find(c =>
      (c as HTMLCanvasElement).style.cursor === 'pointer',
    ) ?? canvases[0]

    if (!punchcardCanvas) throw new Error('No canvas found in LiveCode render')

    fireEvent.click(punchcardCanvas, { clientX: 70, clientY: 14 })

    // Not yet fired
    expect(window.scoreBridge.send).not.toHaveBeenCalledWith('engine:eval', expect.anything())

    act(() => { vi.advanceTimersByTime(300) })

    expect(window.scoreBridge.send).toHaveBeenCalledWith('engine:eval', expect.anything())
  })
})

// ── t184: song:error IPC — crash resilience ───────────────────────────────────

describe('LiveCode — song:error crash resilience (t184)', () => {
  it('shows error banner when song:error fires', () => {
    render(<LiveCode hardware="pc-only" onHome={vi.fn()} />)
    act(() => {
      emitBridgeEvent('song:error', { message: 'ReferenceError: Kick is not defined' })
    })
    expect(screen.getByRole('alert')).toHaveTextContent('ReferenceError: Kick is not defined')
  })

  it('shows fix hint in console log when song:error has a fix', () => {
    render(<LiveCode hardware="pc-only" onHome={vi.fn()} />)
    act(() => {
      emitBridgeEvent('song:error', {
        message: 'Invalid bpm value',
        fix:     'bpm must be between 20 and 300',
      })
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    // Fix hint logged — visible in console panel
    expect(screen.getByText(/bpm must be between 20 and 300/i)).toBeInTheDocument()
  })

  it('does not stop transport when song:error fires', () => {
    render(<LiveCode hardware="pc-only" onHome={vi.fn()} />)
    // Start engine playing
    act(() => {
      emitBridgeEvent('engine:state', { playing: true, bpm: 128, bars: 0 })
    })
    act(() => {
      emitBridgeEvent('song:error', { message: 'some error' })
    })
    // transport:stop must NOT have been sent
    expect(window.scoreBridge.send).not.toHaveBeenCalledWith('transport:stop', expect.anything())
  })
})

// ── t152: resizable editor split ──────────────────────────────────────────────

describe('LiveCode — resizable editor/canvas split (t152)', () => {
  it('renders splitter with aria-label "Resize editor pane"', () => {
    render(<LiveCode hardware="pc-only" onHome={vi.fn()} />)
    expect(screen.getByLabelText('Resize editor pane')).toBeInTheDocument()
  })

  it('splitter has role=separator', () => {
    render(<LiveCode hardware="pc-only" onHome={vi.fn()} />)
    const splitter = screen.getByLabelText('Resize editor pane')
    expect(splitter).toHaveAttribute('role', 'separator')
  })

  it('splitter has col-resize cursor style', () => {
    render(<LiveCode hardware="pc-only" onHome={vi.fn()} />)
    const splitter = screen.getByLabelText('Resize editor pane')
    expect(splitter).toHaveStyle({ cursor: 'col-resize' })
  })

  it('mousedown on splitter does not throw', () => {
    render(<LiveCode hardware="pc-only" onHome={vi.fn()} />)
    const splitter = screen.getByLabelText('Resize editor pane')
    expect(() => { fireEvent.mouseDown(splitter, { clientX: 400 }) }).not.toThrow()
  })

  it('mousemove after splitter mousedown does not throw', () => {
    render(<LiveCode hardware="pc-only" onHome={vi.fn()} />)
    const splitter = screen.getByLabelText('Resize editor pane')
    fireEvent.mouseDown(splitter, { clientX: 400 })
    expect(() => { fireEvent.mouseMove(window, { clientX: 450 }) }).not.toThrow()
    fireEvent.mouseUp(window)
  })
})

// ── t184/t133: engine:error overlay ───────────────────────────────────────────

describe('LiveCode — engine:error overlay (t184/t133)', () => {
  it('shows overlay when engine:error fires', () => {
    render(<LiveCode hardware="pc-only" onHome={vi.fn()} />)
    act(() => { emitBridgeEvent('engine:error', { message: 'effect hydration failed' }) })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    // Use exact string — addLog also renders "[engine] effect hydration failed" so regex would match twice
    expect(screen.getByText('effect hydration failed')).toBeInTheDocument()
  })

  it('dismiss button removes the overlay', () => {
    render(<LiveCode hardware="pc-only" onHome={vi.fn()} />)
    act(() => { emitBridgeEvent('engine:error', { message: 'engine crashed' }) })
    const dismiss = screen.getByLabelText('Dismiss engine errors')
    act(() => { fireEvent.click(dismiss) })
    // addLog keeps "[engine] engine crashed" in the console panel — query for the exact overlay text only
    expect(screen.queryByText('engine crashed')).not.toBeInTheDocument()
  })

  it('keeps last 5 errors — older entries are dropped on overflow', () => {
    render(<LiveCode hardware="pc-only" onHome={vi.fn()} />)
    act(() => {
      for (let i = 1; i <= 6; i++) {
        emitBridgeEvent('engine:error', { message: `error ${String(i)}` })
      }
    })
    // addLog keeps "[engine] error 1" in console — query for exact overlay entry text only
    expect(screen.queryByText('error 1')).not.toBeInTheDocument()
    expect(screen.getByText('error 6')).toBeInTheDocument()
  })
})
