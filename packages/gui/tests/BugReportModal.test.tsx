// BugReportModal.test.tsx — rendering, IPC, clipboard, accessibility

import { describe, it, expect, vi } from 'vitest'
import { render, screen }           from '@testing-library/react'
import userEvent                    from '@testing-library/user-event'
import { axe }                      from './setup.js'
import { BugReportModal }           from '../src/renderer/components/shared/BugReportModal.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultProps = {
  isOpen:          true,
  onClose:         vi.fn(),
  getCurrentCode:  () => 'const kick = Kick808()',
  getRecentLogs:   () => ['song loaded', 'engine started'],
  engineState:     { playing: false, bpm: 128, bars: 0 },
}

const setup = (overrides: Partial<typeof defaultProps> = {}) => ({
  user: userEvent.setup(),
  ...render(<BugReportModal {...defaultProps} {...overrides} />),
})

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('BugReportModal — rendering', () => {
  it('renders nothing when isOpen is false', () => {
    setup({ isOpen: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the modal when isOpen is true', () => {
    setup()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows the title', () => {
    setup()
    expect(screen.getByText('Report an Issue')).toBeInTheDocument()
  })

  it('shows the description textarea', () => {
    setup()
    expect(screen.getByRole('textbox', { name: /what happened/i })).toBeInTheDocument()
  })

  it('shows Cancel button', () => {
    setup()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('shows Copy Report button', () => {
    setup()
    expect(screen.getByRole('button', { name: /copy report/i })).toBeInTheDocument()
  })

  it('shows Save Report button', () => {
    setup()
    expect(screen.getByRole('button', { name: /save report/i })).toBeInTheDocument()
  })

  it('"What\'s included" disclosure is collapsed by default', () => {
    setup()
    expect(screen.queryByText(/code snapshot/i)).not.toBeInTheDocument()
  })
})

// ── Disclosure toggle ─────────────────────────────────────────────────────────

describe('BugReportModal — disclosure', () => {
  it('opens "What\'s included" when clicked', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /what.s included/i }))
    expect(screen.getByText(/code snapshot/i)).toBeInTheDocument()
  })

  it('shows log count in disclosure', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /what.s included/i }))
    expect(screen.getByText(/2 recent events/i)).toBeInTheDocument()
  })

  it('collapses again when clicked a second time', async () => {
    const { user } = setup()
    const btn = screen.getByRole('button', { name: /what.s included/i })
    await user.click(btn)
    await user.click(btn)
    expect(screen.queryByText(/code snapshot/i)).not.toBeInTheDocument()
  })
})

// ── Cancel ────────────────────────────────────────────────────────────────────

describe('BugReportModal — cancel', () => {
  it('Cancel button calls onClose', async () => {
    const onClose = vi.fn()
    const { user } = setup({ onClose })
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('close (✕) button calls onClose', async () => {
    const onClose = vi.fn()
    const { user } = setup({ onClose })
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

// ── Copy Report ───────────────────────────────────────────────────────────────

describe('BugReportModal — copy report', () => {
  it('Copy Report button shows "Copied ✓" after click', async () => {
    // Stub clipboard with configurable:true so user-event can still wrap it
    Object.defineProperty(navigator, 'clipboard', {
      value:        { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /copy report/i }))
    expect(await screen.findByText(/copied/i)).toBeInTheDocument()
  })

  it('does NOT send IPC when copying', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value:        { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /copy report/i }))
    expect(window.scoreBridge.send).not.toHaveBeenCalled()
  })

  it('does not call onClose after copying', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value:        { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
    const onClose = vi.fn()
    const { user } = setup({ onClose })
    await user.click(screen.getByRole('button', { name: /copy report/i }))
    expect(onClose).not.toHaveBeenCalled()
  })
})

// ── Save Report ───────────────────────────────────────────────────────────────

describe('BugReportModal — save report', () => {
  it('Save Report sends bug:report IPC', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /save report/i }))
    expect(window.scoreBridge.send).toHaveBeenCalledWith('bug:report', expect.objectContaining({
      code:        'const kick = Kick808()',
      engineState: { playing: false, bpm: 128, bars: 0 },
    }))
  })

  it('Save Report calls onClose after sending', async () => {
    const onClose = vi.fn()
    const { user } = setup({ onClose })
    await user.click(screen.getByRole('button', { name: /save report/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('Save Report payload includes description typed by user', async () => {
    const { user } = setup()
    await user.type(screen.getByRole('textbox', { name: /what happened/i }), 'engine froze')
    await user.click(screen.getByRole('button', { name: /save report/i }))

    const payload = ((window.scoreBridge.send as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[])[1] as Record<string, unknown>
    expect(payload.description).toBe('engine froze')
  })
})

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('BugReportModal — accessibility', () => {
  it('has no axe violations when open', async () => {
    const { container } = setup()
    expect(await axe(container)).toHaveNoViolations()
  })
})
