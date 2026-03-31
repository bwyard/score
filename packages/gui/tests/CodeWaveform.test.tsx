import { describe, it, expect } from 'vitest'
import { render }               from '@testing-library/react'
import { CodeWaveform }         from '../src/renderer/components/shared/CodeWaveform.js'

describe('CodeWaveform', () => {
  it('renders an aria-hidden canvas', () => {
    const { container } = render(
      <CodeWaveform waveform={[]} playing={false} currentStep={0} stepCount={8} />,
    )
    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas?.getAttribute('aria-hidden')).toBe('true')
  })

  it('accepts waveform data and playing=true without crashing', () => {
    const waveform = Array.from({ length: 256 }, (_, i) => Math.sin(i / 10))
    const { container } = render(
      <CodeWaveform waveform={waveform} playing={true} currentStep={3} stepCount={8} />,
    )
    expect(container.querySelector('canvas')).not.toBeNull()
  })

  it('clears the canvas when playing=false', () => {
    const waveform = Array.from({ length: 256 }, () => 0.5)
    const { container } = render(
      <CodeWaveform waveform={waveform} playing={false} currentStep={0} stepCount={8} />,
    )
    expect(container.querySelector('canvas')).not.toBeNull()
  })

  it('renders with currentStep and stepCount props', () => {
    const waveform = Array.from({ length: 64 }, () => 0.3)
    expect(() =>
      render(
        <CodeWaveform waveform={waveform} playing={true} currentStep={4} stepCount={16} />,
      ),
    ).not.toThrow()
  })

  it('accepts a single-sample waveform without crashing', () => {
    expect(() =>
      render(
        <CodeWaveform waveform={[0.5]} playing={true} currentStep={0} stepCount={4} />,
      ),
    ).not.toThrow()
  })

  it('accepts a full 1024-sample waveform without crashing', () => {
    const waveform = Array.from({ length: 1024 }, (_, i) => Math.sin(i / 32))
    expect(() =>
      render(
        <CodeWaveform waveform={waveform} playing={true} currentStep={7} stepCount={16} />,
      ),
    ).not.toThrow()
  })

  it('accepts waveform with clipped values (±1) without crashing', () => {
    const waveform = [1, -1, 1, -1, 0.5, -0.5]
    expect(() =>
      render(
        <CodeWaveform waveform={waveform} playing={true} currentStep={0} stepCount={8} />,
      ),
    ).not.toThrow()
  })

  it('renders without crashing on beat boundary (currentStep === 0, playing)', () => {
    const waveform = Array.from({ length: 256 }, (_, i) => Math.sin(i / 8))
    expect(() =>
      render(
        <CodeWaveform waveform={waveform} playing={true} currentStep={0} stepCount={16} />,
      ),
    ).not.toThrow()
  })
})
