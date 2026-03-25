import { describe, it, expect, vi }  from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent                     from '@testing-library/user-event'
import { axe }                       from './setup.js'
import { InstrumentPanel }           from '../src/renderer/components/shared/InstrumentPanel.js'
import type { InstrumentPanelProps } from '../src/renderer/components/shared/InstrumentPanel.js'

// ── Default props ─────────────────────────────────────────────────────────────

const defaultProps: InstrumentPanelProps = {
  trackIndex:     0,
  instrumentType: 'kick',
  trackName:      'Kick',
  params:         {},
  muted:          false,
  onChange:       vi.fn(),
  onMute:         vi.fn(),
}

// ── Setup helper (Kent C. Dodds pattern) ─────────────────────────────────────

const setup = (overrides: Partial<InstrumentPanelProps> = {}) => {
  const user = userEvent.setup()
  const result = render(<InstrumentPanel {...defaultProps} {...overrides} />)
  return { user, ...result }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('InstrumentPanel — rendering', () => {
  it('renders the track name', () => {
    setup()
    expect(screen.getByText('Kick')).toBeInTheDocument()
  })

  it('renders a mute button with accessible name', () => {
    setup()
    expect(screen.getByRole('button', { name: /mute kick/i })).toBeInTheDocument()
  })

  it('renders a Volume slider for kick type', () => {
    setup()
    expect(screen.getByRole('slider', { name: /volume/i })).toBeInTheDocument()
  })

  it('renders a Reverb slider for kick type', () => {
    setup()
    expect(screen.getByRole('slider', { name: /reverb/i })).toBeInTheDocument()
  })

  it('renders a Tune slider for kick type', () => {
    setup()
    expect(screen.getByRole('slider', { name: /tune/i })).toBeInTheDocument()
  })

  it('renders a Decay slider for kick type', () => {
    setup()
    expect(screen.getByRole('slider', { name: /decay/i })).toBeInTheDocument()
  })

  it('renders Snappy slider for snare type', () => {
    setup({ instrumentType: 'snare', trackName: 'Snare' })
    expect(screen.getByRole('slider', { name: /snappy/i })).toBeInTheDocument()
  })

  it('renders Decay slider for hihat type', () => {
    setup({ instrumentType: 'hihat', trackName: 'HiHat' })
    expect(screen.getByRole('slider', { name: /decay/i })).toBeInTheDocument()
  })

  it('renders Cutoff and Resonance sliders for bass303 type', () => {
    setup({ instrumentType: 'bass303', trackName: 'Bass303' })
    expect(screen.getByRole('slider', { name: /cutoff/i })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /resonance/i })).toBeInTheDocument()
  })

  it('renders Attack and Release sliders for synth type', () => {
    setup({ instrumentType: 'synth', trackName: 'Synth' })
    expect(screen.getByRole('slider', { name: /attack/i })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /release/i })).toBeInTheDocument()
  })

  it('renders Volume and Reverb for unknown instrument type (fallback)', () => {
    setup({ instrumentType: 'unknown-future-instrument', trackName: 'Unknown' })
    expect(screen.getByRole('slider', { name: /volume/i })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /reverb/i })).toBeInTheDocument()
  })

  it('shows muted state on mute button when muted=true', () => {
    setup({ muted: true })
    const btn = screen.getByRole('button', { name: /mute kick/i })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows unmuted state when muted=false', () => {
    setup({ muted: false })
    const btn = screen.getByRole('button', { name: /mute kick/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })
})

// ── Interactions ──────────────────────────────────────────────────────────────

describe('InstrumentPanel — interactions', () => {
  it('calls onMute when mute button is clicked', async () => {
    const onMute = vi.fn()
    const { user } = setup({ onMute })
    await user.click(screen.getByRole('button', { name: /mute kick/i }))
    expect(onMute).toHaveBeenCalledOnce()
  })

  it('calls onChange with method "volume" when Volume slider changes', () => {
    const onChange = vi.fn()
    setup({ onChange })
    const slider = screen.getByRole('slider', { name: /volume/i })
    // fireEvent.change is the accepted approach for range inputs —
    // userEvent has no range-slide API and jsdom range inputs are not interactable
    fireEvent.change(slider, { target: { value: '0.7' } })
    expect(onChange).toHaveBeenCalledWith('volume', 0.7)
  })

  it('calls onChange with method "reverb" when Reverb slider changes', () => {
    const onChange = vi.fn()
    setup({ onChange })
    const slider = screen.getByRole('slider', { name: /reverb/i })
    fireEvent.change(slider, { target: { value: '0.3' } })
    expect(onChange).toHaveBeenCalledWith('reverb', 0.3)
  })

  it('calls onChange with method "decay" when Decay slider changes for hihat', () => {
    const onChange = vi.fn()
    setup({ instrumentType: 'hihat', trackName: 'HiHat', onChange })
    const slider = screen.getByRole('slider', { name: /decay/i })
    fireEvent.change(slider, { target: { value: '0.5' } })
    expect(onChange).toHaveBeenCalledWith('decay', 0.5)
  })

  it('calls onChange with method "cutoff" when Cutoff slider changes for bass303', () => {
    const onChange = vi.fn()
    setup({ instrumentType: 'bass303', trackName: 'Bass303', onChange })
    const slider = screen.getByRole('slider', { name: /cutoff/i })
    fireEvent.change(slider, { target: { value: '800' } })
    expect(onChange).toHaveBeenCalledWith('cutoff', 800)
  })
})

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('InstrumentPanel — accessibility', () => {
  it('has no axe violations for kick type', async () => {
    const { container } = setup()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for bass303 type', async () => {
    const { container } = setup({ instrumentType: 'bass303', trackName: 'Bass303' })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// ── Props variants ────────────────────────────────────────────────────────────

describe('InstrumentPanel — props variants', () => {
  it('does not crash with empty params', () => {
    expect(() => setup({ params: {} })).not.toThrow()
  })

  it('does not crash with kick808 type', () => {
    expect(() => setup({ instrumentType: 'kick808', trackName: 'Kick 808' })).not.toThrow()
  })

  it('does not crash with kick909 type', () => {
    expect(() => setup({ instrumentType: 'kick909', trackName: 'Kick 909' })).not.toThrow()
  })

  it('does not crash with snare909 type', () => {
    expect(() => setup({ instrumentType: 'snare909', trackName: 'Snare 909' })).not.toThrow()
  })

  it('does not crash with subsynth type', () => {
    expect(() => setup({ instrumentType: 'subsynth', trackName: 'Sub' })).not.toThrow()
  })
})
