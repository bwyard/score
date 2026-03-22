import { describe, it, expect, vi } from 'vitest'
import { render, screen, act }      from '@testing-library/react'
import userEvent                    from '@testing-library/user-event'
import { axe }                      from './setup.js'
import { emitBridgeEvent }          from './setup.js'
import { TransportBar }             from '../src/renderer/components/shared/TransportBar.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

const setup = (hardware: 'pc-only' | 'controller' | 'aio' = 'pc-only') => ({
  user: userEvent.setup(),
  ...render(<TransportBar hardware={hardware} onHome={() => undefined} />),
})

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('TransportBar — rendering', () => {
  it('renders play button', () => {
    setup()
    expect(screen.getByRole('button', { name: /play|stop/i })).toBeInTheDocument()
  })

  it('renders BPM input with default value', () => {
    setup()
    expect(screen.getByRole('spinbutton', { name: /bpm/i })).toHaveValue(128)
  })

  it('shows PC hardware indicator when pc-only', () => {
    setup('pc-only')
    expect(screen.getByText('PC')).toBeInTheDocument()
  })

  it('shows CTRL indicator when controller hardware', () => {
    setup('controller')
    expect(screen.getByText('CTRL')).toBeInTheDocument()
  })

  it('shows AIO indicator when aio hardware', () => {
    setup('aio')
    expect(screen.getByText('AIO')).toBeInTheDocument()
  })
})

// ── IPC interactions ──────────────────────────────────────────────────────────

describe('TransportBar — IPC', () => {
  it('sends transport:play when play button clicked', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /play/i }))
    expect(window.scoreBridge.send).toHaveBeenCalledWith('transport:play', undefined)
  })

  it('sends transport:stop when stop button clicked while playing', async () => {
    const { user } = setup()
    // Start playing first
    act(() => { emitBridgeEvent('engine:state', { playing: true, bpm: 128, bars: 0 }) })
    await user.click(screen.getByRole('button', { name: /stop/i }))
    expect(window.scoreBridge.send).toHaveBeenCalledWith('transport:stop', undefined)
  })

  it('updates displayed BPM when engine:state event arrives', () => {
    setup()
    act(() => { emitBridgeEvent('engine:state', { playing: false, bpm: 145, bars: 4 }) })
    expect(screen.getByRole('spinbutton', { name: /bpm/i })).toHaveValue(145)
  })

  it('sends transport:bpm-set when BPM input changes', async () => {
    const { user } = setup()
    const bpmInput = screen.getByRole('spinbutton', { name: /bpm/i })
    await user.clear(bpmInput)
    await user.type(bpmInput, '140')
    expect(window.scoreBridge.send).toHaveBeenCalledWith('transport:bpm-set', { bpm: 140 })
  })
})

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('TransportBar — accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = setup()
    expect(await axe(container)).toHaveNoViolations()
  })
})
