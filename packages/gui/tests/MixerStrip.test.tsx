import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent }        from '@testing-library/react'
import { screen }                   from '@testing-library/react'
import { MixerStrip }               from '../src/renderer/components/shared/MixerStrip.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultProps = {
  name:     'Kick',
  type:     'kick',
  volume:   0.8,
  muted:    false,
  soloed:   false,
  pan:      0,
  level:    0.4,
  onVolume: vi.fn(),
  onMute:   vi.fn(),
  onSolo:   vi.fn(),
  onPan:    vi.fn(),
}

const setup = (overrides: Partial<typeof defaultProps> = {}) =>
  render(<MixerStrip {...defaultProps} {...overrides} />)

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('MixerStrip — rendering', () => {
  it('renders the track name', () => {
    setup()
    expect(screen.getByText('Kick')).toBeInTheDocument()
  })

  it('renders the mute button', () => {
    setup()
    expect(screen.getByRole('button', { name: /mute kick/i })).toBeInTheDocument()
  })

  it('renders the volume fader', () => {
    setup()
    expect(screen.getByRole('slider', { name: /kick volume/i })).toBeInTheDocument()
  })

  it('fader reflects the volume prop', () => {
    setup({ volume: 0.5 })
    const fader = screen.getByRole('slider', { name: /kick volume/i }) as HTMLInputElement
    expect(Number(fader.value)).toBeCloseTo(0.5)
  })

  it('mute button is aria-pressed=false when not muted', () => {
    setup({ muted: false })
    const btn = screen.getByRole('button', { name: /mute kick/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('mute button is aria-pressed=true when muted', () => {
    setup({ muted: true })
    const btn = screen.getByRole('button', { name: /unmute kick/i })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders a VU canvas element', () => {
    setup()
    const canvas = document.querySelector('canvas')
    expect(canvas).not.toBeNull()
  })
})

// ── Interactions ──────────────────────────────────────────────────────────────

describe('MixerStrip — interactions', () => {
  it('calls onMute when the mute button is clicked', () => {
    const onMute = vi.fn()
    setup({ onMute })
    fireEvent.click(screen.getByRole('button', { name: /mute kick/i }))
    expect(onMute).toHaveBeenCalledTimes(1)
  })

  it('calls onVolume with a number when the fader changes', () => {
    const onVolume = vi.fn()
    setup({ onVolume })
    const fader = screen.getByRole('slider', { name: /kick volume/i })
    fireEvent.change(fader, { target: { value: '0.6' } })
    expect(onVolume).toHaveBeenCalledWith(0.6)
  })

  it('calls onVolume with 0 when the fader is moved to minimum', () => {
    const onVolume = vi.fn()
    setup({ onVolume })
    const fader = screen.getByRole('slider', { name: /kick volume/i })
    fireEvent.change(fader, { target: { value: '0' } })
    expect(onVolume).toHaveBeenCalledWith(0)
  })

  it('calls onVolume with 1 when the fader is moved to maximum', () => {
    const onVolume = vi.fn()
    setup({ onVolume })
    const fader = screen.getByRole('slider', { name: /kick volume/i })
    fireEvent.change(fader, { target: { value: '1' } })
    expect(onVolume).toHaveBeenCalledWith(1)
  })
})

// ── Props variance ────────────────────────────────────────────────────────────

describe('MixerStrip — prop variance', () => {
  it('renders a snare strip without throwing', () => {
    expect(() => setup({ name: 'Snare', type: 'snare' })).not.toThrow()
  })

  it('renders an unknown type without throwing', () => {
    expect(() => setup({ name: 'FX', type: 'fx' })).not.toThrow()
  })

  it('renders with level=0 without throwing', () => {
    expect(() => setup({ level: 0 })).not.toThrow()
  })

  it('renders with level=1 without throwing', () => {
    expect(() => setup({ level: 1 })).not.toThrow()
  })
})
