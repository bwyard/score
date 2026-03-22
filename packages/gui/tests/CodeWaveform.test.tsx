import { describe, it, expect } from 'vitest'
import { render }               from '@testing-library/react'
import { CodeWaveform }         from '../src/renderer/components/shared/CodeWaveform.js'

describe('CodeWaveform', () => {
  it('renders an aria-hidden canvas', () => {
    const { container } = render(<CodeWaveform waveform={[]} playing={false} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas?.getAttribute('aria-hidden')).toBe('true')
  })

  it('accepts waveform data and playing=true without crashing', () => {
    const waveform = Array.from({ length: 256 }, (_, i) => Math.sin(i / 10))
    const { container } = render(<CodeWaveform waveform={waveform} playing={true} />)
    expect(container.querySelector('canvas')).not.toBeNull()
  })

  it('clears the canvas when playing=false', () => {
    const waveform = Array.from({ length: 256 }, () => 0.5)
    const { container } = render(<CodeWaveform waveform={waveform} playing={false} />)
    expect(container.querySelector('canvas')).not.toBeNull()
  })
})
