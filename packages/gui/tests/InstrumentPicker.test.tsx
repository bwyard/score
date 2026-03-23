import { describe, it, expect, vi }  from 'vitest'
import { render, screen }            from '@testing-library/react'
import userEvent                     from '@testing-library/user-event'
import { axe }                       from './setup.js'
import { InstrumentPicker }          from '../src/renderer/components/shared/InstrumentPicker.js'
import type { InstrumentPickerProps } from '../src/renderer/components/shared/InstrumentPicker.js'

// ── Default props ─────────────────────────────────────────────────────────────

const defaultProps: InstrumentPickerProps = {
  onPick:  vi.fn(),
  onClose: vi.fn(),
}

// ── Setup helper (Kent C. Dodds pattern) ─────────────────────────────────────

const setup = (overrides: Partial<InstrumentPickerProps> = {}) => {
  const user = userEvent.setup()
  const result = render(<InstrumentPicker {...defaultProps} {...overrides} />)
  return { user, ...result }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('InstrumentPicker — rendering', () => {
  it('renders drum instrument buttons', () => {
    setup()
    expect(screen.getByRole('button', { name: /kick/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /snare/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hi.?hat/i })).toBeInTheDocument()
  })

  it('renders melodic instrument buttons', () => {
    setup()
    expect(screen.getByRole('button', { name: /bass ?303/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^synth$/i })).toBeInTheDocument()
  })

  it('renders all instrument labels', () => {
    setup()
    // Use exact string matching to avoid partial matches (e.g. "Synth" vs "SubSynth")
    const labels = ['Kick', 'Snare', 'HiHat', 'Bass303', 'Synth', 'Pad', 'Pluck', 'FMSynth']
    for (const label of labels) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('renders a close button', () => {
    setup()
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })
})

// ── Interactions ──────────────────────────────────────────────────────────────

describe('InstrumentPicker — interactions', () => {
  it('calls onPick with "kick" when Kick button is clicked', async () => {
    const onPick = vi.fn()
    const { user } = setup({ onPick })
    await user.click(screen.getByRole('button', { name: /kick/i }))
    expect(onPick).toHaveBeenCalledWith('kick')
  })

  it('calls onPick with "snare" when Snare button is clicked', async () => {
    const onPick = vi.fn()
    const { user } = setup({ onPick })
    await user.click(screen.getByRole('button', { name: /snare/i }))
    expect(onPick).toHaveBeenCalledWith('snare')
  })

  it('calls onPick with "bass303" when Bass303 button is clicked', async () => {
    const onPick = vi.fn()
    const { user } = setup({ onPick })
    await user.click(screen.getByRole('button', { name: /bass ?303/i }))
    expect(onPick).toHaveBeenCalledWith('bass303')
  })

  it('calls onPick with "synth" when Synth button is clicked', async () => {
    const onPick = vi.fn()
    const { user } = setup({ onPick })
    await user.click(screen.getByRole('button', { name: /^synth$/i }))
    expect(onPick).toHaveBeenCalledWith('synth')
  })

  it('calls onPick with "pad" when Pad button is clicked', async () => {
    const onPick = vi.fn()
    const { user } = setup({ onPick })
    await user.click(screen.getByRole('button', { name: /^pad$/i }))
    expect(onPick).toHaveBeenCalledWith('pad')
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    const { user } = setup({ onClose })
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn()
    const { user } = setup({ onClose })
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })
})

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('InstrumentPicker — accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = setup()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// ── Props variants ────────────────────────────────────────────────────────────

describe('InstrumentPicker — props variants', () => {
  it('does not crash with vi.fn() callbacks', () => {
    expect(() => setup()).not.toThrow()
  })

  it('calls onPick exactly once per click', async () => {
    const onPick = vi.fn()
    const { user } = setup({ onPick })
    await user.click(screen.getByRole('button', { name: /^kick$/i }))
    expect(onPick).toHaveBeenCalledOnce()
  })
})
