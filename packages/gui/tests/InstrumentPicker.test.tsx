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

  it('renders bass and synth instrument buttons', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Bass 303' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Synth' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Supersaw' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Wobble Bass' })).toBeInTheDocument()
  })

  it('renders all instrument labels', () => {
    setup()
    const labels = [
      'Kick 808', 'Kick 909', 'Snare 909', 'Clap 909', 'Hi-Hat 808', 'Open Hat 808', 'Cowbell 808',
      'Bass 303', 'Wobble Bass', 'Sub Synth',
      'Supersaw', 'Pad', 'Pluck', 'FM Synth', 'Rhodes',
      'Arp', 'Sample',
    ]
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
  it('calls onPick with "kick808" when Kick 808 button is clicked', async () => {
    const onPick = vi.fn()
    const { user } = setup({ onPick })
    await user.click(screen.getByRole('button', { name: 'Kick 808' }))
    expect(onPick).toHaveBeenCalledWith('kick808')
  })

  it('calls onPick with "snare909" when Snare 909 button is clicked', async () => {
    const onPick = vi.fn()
    const { user } = setup({ onPick })
    await user.click(screen.getByRole('button', { name: 'Snare 909' }))
    expect(onPick).toHaveBeenCalledWith('snare909')
  })

  it('calls onPick with "bass-303" when Bass 303 button is clicked', async () => {
    const onPick = vi.fn()
    const { user } = setup({ onPick })
    await user.click(screen.getByRole('button', { name: 'Bass 303' }))
    expect(onPick).toHaveBeenCalledWith('bass-303')
  })

  it('calls onPick with "synth" when Synth button is clicked', async () => {
    const onPick = vi.fn()
    const { user } = setup({ onPick })
    await user.click(screen.getByRole('button', { name: 'Synth' }))
    expect(onPick).toHaveBeenCalledWith('synth')
  })

  it('calls onPick with "pad" when Pad button is clicked', async () => {
    const onPick = vi.fn()
    const { user } = setup({ onPick })
    await user.click(screen.getByRole('button', { name: 'Pad' }))
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
    await user.click(screen.getByRole('button', { name: 'Kick 808' }))
    expect(onPick).toHaveBeenCalledOnce()
  })
})
