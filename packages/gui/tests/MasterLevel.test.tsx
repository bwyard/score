import { describe, it, expect } from 'vitest'
import { render, screen }       from '@testing-library/react'
import { MasterLevel }          from '../src/renderer/components/shared/MasterLevel.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

const silence = Array.from<number>({ length: 256 }).fill(0)

const sineWave = (amplitude: number, samples = 256): number[] =>
  Array.from({ length: samples }, (_, i) =>
    amplitude * Math.sin((2 * Math.PI * i) / samples),
  )

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('MasterLevel — rendering', () => {
  it('renders without throwing', () => {
    expect(() =>
      render(<MasterLevel waveform={silence} playing={false} />),
    ).not.toThrow()
  })

  it('has an aria-label of "Master level"', () => {
    render(<MasterLevel waveform={silence} playing={false} />)
    expect(screen.getByRole('img', { name: 'Master level' })).toBeInTheDocument()
  })

  it('renders a canvas element', () => {
    render(<MasterLevel waveform={silence} playing={false} />)
    expect(document.querySelector('canvas')).not.toBeNull()
  })

  it('renders the MASTER label text', () => {
    render(<MasterLevel waveform={silence} playing={false} />)
    expect(screen.getByText('MASTER')).toBeInTheDocument()
  })
})

// ── Waveform prop ─────────────────────────────────────────────────────────────

describe('MasterLevel — waveform prop', () => {
  it('accepts an empty waveform without throwing', () => {
    expect(() =>
      render(<MasterLevel waveform={[]} playing={true} />),
    ).not.toThrow()
  })

  it('accepts a full-amplitude waveform without throwing', () => {
    expect(() =>
      render(<MasterLevel waveform={sineWave(1)} playing={true} />),
    ).not.toThrow()
  })

  it('accepts a low-amplitude waveform without throwing', () => {
    expect(() =>
      render(<MasterLevel waveform={sineWave(0.1)} playing={true} />),
    ).not.toThrow()
  })

  it('accepts a silence waveform while playing', () => {
    expect(() =>
      render(<MasterLevel waveform={silence} playing={true} />),
    ).not.toThrow()
  })
})

// ── Playing prop ──────────────────────────────────────────────────────────────

describe('MasterLevel — playing prop', () => {
  it('renders when playing=false', () => {
    render(<MasterLevel waveform={sineWave(0.8)} playing={false} />)
    expect(screen.getByRole('img', { name: 'Master level' })).toBeInTheDocument()
  })

  it('renders when playing=true', () => {
    render(<MasterLevel waveform={sineWave(0.8)} playing={true} />)
    expect(screen.getByRole('img', { name: 'Master level' })).toBeInTheDocument()
  })
})
