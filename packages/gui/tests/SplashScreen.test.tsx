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
    expect(screen.getByRole('button', { name: 'Live Code' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Produce — coming soon' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'DJ Set — coming soon' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jam Session — coming soon' })).toBeInTheDocument()
  })

  it('non-live-code modes are disabled (coming soon)', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Produce — coming soon' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'DJ Set — coming soon' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Jam Session — coming soon' })).toBeDisabled()
  })

  it('live-code mode is enabled', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Live Code' })).toBeEnabled()
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
  it('start button shows Live Code label (pre-selected mode)', () => {
    setup()
    expect(screen.getByRole('button', { name: /start live code/i })).toBeEnabled()
  })

  it('live-code card has aria-pressed=true', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Live Code' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('clicking a disabled mode card does not change selection', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Produce — coming soon' }))
    // live-code remains selected — disabled card click is a no-op
    expect(screen.getByRole('button', { name: 'Live Code' })).toHaveAttribute('aria-pressed', 'true')
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
  it('calls onSelect with live-code and default hardware', async () => {
    const { user, onSelect } = setup()
    await user.click(screen.getByRole('button', { name: /start live code/i }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('live-code', 'pc-only')
  })

  it('calls onSelect with selected hardware level', async () => {
    const { user, onSelect } = setup()
    await user.click(screen.getByRole('button', { name: /\+ controller/i }))
    await user.click(screen.getByRole('button', { name: /start live code/i }))
    expect(onSelect).toHaveBeenCalledWith('live-code', 'controller')
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

  it('has no axe violations after hardware selection', async () => {
    const { container, user } = setup()
    await user.click(screen.getByRole('button', { name: /\+ controller/i }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('start button is keyboard-focusable when enabled', () => {
    setup()
    const startBtn = screen.getByRole('button', { name: /start live code/i })
    startBtn.focus()
    expect(document.activeElement).toBe(startBtn)
  })
})
