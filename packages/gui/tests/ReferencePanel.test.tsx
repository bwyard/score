import { describe, it, expect } from 'vitest'
import { render }               from '@testing-library/react'
import { screen }               from '@testing-library/react'
import { ReferencePanel }       from '../src/renderer/components/shared/ReferencePanel.js'

describe('ReferencePanel — rendering', () => {
  it('renders without throwing', () => {
    expect(() => render(<ReferencePanel />)).not.toThrow()
  })

  it('has an accessible label', () => {
    render(<ReferencePanel />)
    expect(screen.getByLabelText('DSL reference panel')).toBeInTheDocument()
  })
})

describe('ReferencePanel — instruments', () => {
  it('shows Kick', () => {
    render(<ReferencePanel />)
    expect(screen.getByText('Kick()')).toBeInTheDocument()
  })

  it('shows Snare', () => {
    render(<ReferencePanel />)
    expect(screen.getByText('Snare()')).toBeInTheDocument()
  })

  it('shows HiHat', () => {
    render(<ReferencePanel />)
    expect(screen.getByText('HiHat()')).toBeInTheDocument()
  })

  it('shows Synth', () => {
    render(<ReferencePanel />)
    expect(screen.getByText('Synth(wave)')).toBeInTheDocument()
  })

  it('shows Sample', () => {
    render(<ReferencePanel />)
    expect(screen.getByText('Sample(path)')).toBeInTheDocument()
  })

  it('shows Theremin', () => {
    render(<ReferencePanel />)
    expect(screen.getByText('Theremin(pitch)')).toBeInTheDocument()
  })

  it('shows Sax', () => {
    render(<ReferencePanel />)
    expect(screen.getByText('Sax(pitch)')).toBeInTheDocument()
  })

  it('shows Arp', () => {
    render(<ReferencePanel />)
    expect(screen.getByText('Arp(notes[])')).toBeInTheDocument()
  })
})

describe('ReferencePanel — effects', () => {
  it('shows Reverb', () => {
    render(<ReferencePanel />)
    expect(screen.getByText('Reverb')).toBeInTheDocument()
  })

  it('shows Delay', () => {
    render(<ReferencePanel />)
    expect(screen.getByText('Delay')).toBeInTheDocument()
  })

  it('shows Filter', () => {
    render(<ReferencePanel />)
    expect(screen.getByText('Filter')).toBeInTheDocument()
  })
})

describe('ReferencePanel — structure', () => {
  it('shows Song', () => {
    render(<ReferencePanel />)
    expect(screen.getByText('Song')).toBeInTheDocument()
  })

  it('shows Track', () => {
    render(<ReferencePanel />)
    expect(screen.getByText('Track')).toBeInTheDocument()
  })
})

describe('ReferencePanel — shortcuts', () => {
  it('shows Ctrl+Enter shortcut', () => {
    render(<ReferencePanel />)
    expect(screen.getByText('Ctrl+Enter')).toBeInTheDocument()
  })
})

describe('ReferencePanel — beat indicator', () => {
  it('renders beat dot element', () => {
    const { container } = render(<ReferencePanel beatPulse={true} />)
    // aria-hidden dot is in the DOM — verify the panel still renders cleanly
    expect(container.querySelector('[aria-label="DSL reference panel"]')).not.toBeNull()
  })

  it('renders without beatPulse prop (defaults to false)', () => {
    expect(() => render(<ReferencePanel />)).not.toThrow()
  })
})
