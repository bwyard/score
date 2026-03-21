import { describe, it, expect } from 'vitest'
import { Kick, Snare, HiHat, Synth, Sample, Theremin, Sax, Arp } from '../src/instruments.js'

describe('Arp', () => {
  it('returns an InstrumentDescriptor with instrumentType arp', () => {
    const arp = Arp({ notes: ['C4', 'E4', 'G4'] })
    expect(arp._type).toBe('InstrumentDescriptor')
    expect(arp.instrumentType).toBe('arp')
  })

  it('stores notes in props', () => {
    const arp = Arp({ notes: ['A3', 'C4', 'E4'] })
    const props = arp.props as { notes: string[] }
    expect(props.notes).toEqual(['A3', 'C4', 'E4'])
  })

  it('stores optional mode, wave, gain in props', () => {
    const arp = Arp({ notes: ['C4'], mode: 'down', wave: 'sawtooth', gain: 0.5 })
    const props = arp.props as { mode: string; wave: string; gain: number }
    expect(props.mode).toBe('down')
    expect(props.wave).toBe('sawtooth')
    expect(props.gain).toBe(0.5)
  })

  it('has a unique id per instance', () => {
    const a = Arp({ notes: ['C4'] })
    const b = Arp({ notes: ['C4'] })
    expect(a.id).not.toBe(b.id)
  })

  it('has no-op connect/disconnect/dispose', () => {
    const arp = Arp({ notes: ['C4'] })
    expect(() => { arp.connect({} as never) }).not.toThrow()
    expect(() => { arp.disconnect() }).not.toThrow()
    expect(() => { arp.dispose() }).not.toThrow()
  })

  it('stores envelope in props', () => {
    const env = { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.05 }
    const arp = Arp({ notes: ['C4'], envelope: env })
    const props = arp.props as { envelope: typeof env }
    expect(props.envelope).toEqual(env)
  })
})

describe('existing instrument factories still work after type extension', () => {
  it('Kick returns kick descriptor', () => {
    expect(Kick().instrumentType).toBe('kick')
  })

  it('Snare returns snare descriptor', () => {
    expect(Snare().instrumentType).toBe('snare')
  })

  it('HiHat returns hihat descriptor', () => {
    expect(HiHat().instrumentType).toBe('hihat')
  })

  it('Synth returns synth descriptor', () => {
    expect(Synth().instrumentType).toBe('synth')
  })

  it('Sample returns sample descriptor', () => {
    expect(Sample({ path: './kick.wav' }).instrumentType).toBe('sample')
  })

  it('Theremin returns theremin descriptor', () => {
    expect(Theremin().instrumentType).toBe('theremin')
  })

  it('Sax returns sax descriptor', () => {
    expect(Sax().instrumentType).toBe('sax')
  })
})
