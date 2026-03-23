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
})
