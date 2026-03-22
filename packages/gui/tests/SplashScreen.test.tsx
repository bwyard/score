import { describe, it, expect, vi } from 'vitest'
import { render, screen }           from '@testing-library/react'
import userEvent                    from '@testing-library/user-event'
import { axe, emitBridgeEvent }     from './setup.js'
import { SplashScreen }             from '../src/renderer/components/SplashScreen.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

const setup = (onSelect = vi.fn()) => ({
  user:     userEvent.setup(),
  onSelect,
  ...render(<SplashScreen onSelect={onSelect} />),
})

// suppress unused — emitBridgeEvent is exported for other tests
void emitBridgeEvent

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('SplashScreen — rendering', () => {
  it('renders headline and tagline', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Score Studio' })).toBeInTheDocument()
    expect(screen.getByText('What are you doing today?')).toBeInTheDocument()
  })

  it('renders all four mode buttons', () => {
    setup()
    // Use exact aria-label to avoid matching the "Start Live Code" button
    expect(screen.getByRole('button', { name: 'Live Code' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Produce' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'DJ Set' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jam Session' })).toBeInTheDocument()
  })

  it('renders three hardware level buttons', () => {
    setup()
    expect(screen.getByRole('button', { name: /pc only/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+ controller/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+ aio/i })).toBeInTheDocument()
  })
})

// ── Initial state ─────────────────────────────────────────────────────────────

describe('SplashScreen — initial state', () => {
  it('start button is enabled with live-code pre-selected', () => {
    setup()
    expect(screen.getByRole('button', { name: /start live code/i })).toBeEnabled()
  })

  it('live-code mode card and pc-only hardware start pressed', () => {
    setup()
    const pressed = screen.queryAllByRole('button', { pressed: true })
    // live-code pre-selected + pc-only hardware = 2 pressed buttons
    expect(pressed).toHaveLength(2)
    const names = pressed.map(b => b.getAttribute('aria-label'))
    expect(names).toContain('Live Code')
    expect(names).toContain('PC Only')
  })
})

// ── Mode selection ────────────────────────────────────────────────────────────

describe('SplashScreen — mode selection', () => {
  it('start button shows selected mode label', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Produce' }))
    expect(screen.getByRole('button', { name: /start produce/i })).toBeEnabled()
  })

  it('selected mode card has aria-pressed=true', async () => {
    const { user } = setup()
    const djBtn = screen.getByRole('button', { name: /dj set/i })
    await user.click(djBtn)
    expect(djBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('only one mode card is selected at a time', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Produce' }))
    expect(screen.getByRole('button', { name: 'Live Code' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Produce' })).toHaveAttribute('aria-pressed', 'true')
  })
})

// ── Hardware selection ────────────────────────────────────────────────────────

describe('SplashScreen — hardware selection', () => {
  it('PC Only is pre-selected', () => {
    setup()
    expect(screen.getByRole('button', { name: /pc only/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches hardware selection', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /\+ controller/i }))
    expect(screen.getByRole('button', { name: /\+ controller/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /pc only/i })).toHaveAttribute('aria-pressed', 'false')
  })
})

// ── onSelect callback ─────────────────────────────────────────────────────────

describe('SplashScreen — onSelect', () => {
  it('calls onSelect with mode and default hardware', async () => {
    const { user, onSelect } = setup()
    await user.click(screen.getByRole('button', { name: /dj set/i }))
    await user.click(screen.getByRole('button', { name: /start dj set/i }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('dj-set', 'pc-only')
  })

  it('calls onSelect with selected hardware level', async () => {
    const { user, onSelect } = setup()
    await user.click(screen.getByRole('button', { name: /jam session/i }))
    await user.click(screen.getByRole('button', { name: /\+ controller/i }))
    await user.click(screen.getByRole('button', { name: /start jam session/i }))
    expect(onSelect).toHaveBeenCalledWith('jam-session', 'controller')
  })

  it('calls onSelect immediately with default live-code mode', async () => {
    const { user, onSelect } = setup()
    await user.click(screen.getByRole('button', { name: /start live code/i }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('live-code', 'pc-only')
  })
})

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('SplashScreen — accessibility', () => {
  it('has no axe violations in initial state', async () => {
    const { container } = setup()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no axe violations after mode selection', async () => {
    const { container, user } = setup()
    await user.click(screen.getByRole('button', { name: /produce/i }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('start button is keyboard-focusable when enabled', () => {
    setup()
    const startBtn = screen.getByRole('button', { name: /start live code/i })
    startBtn.focus()
    expect(document.activeElement).toBe(startBtn)
  })
})
