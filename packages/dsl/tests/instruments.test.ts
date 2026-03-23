import { describe, it, expect } from 'vitest'
import { Kick, Snare, HiHat } from '../src/instruments.js'
import { Synth, SubSynth, FMSynth, Bass303, Arp, Sample, Theremin, Sax } from '../src/melodic.js'

describe('Arp', () => {
  it('returns a ChainablePart with instrumentType arp', () => {
    const arp = Arp(['C4', 'E4', 'G4'])
    expect(arp._type).toBe('ChainablePart')
    expect(arp.instrumentType).toBe('arp')
  })

  it('stores notes in _notes and props', () => {
    const arp = Arp(['A3', 'C4', 'E4'])
    expect(arp._notes).toEqual(['A3', 'C4', 'E4'])
    const props = arp.props as { notes: string[] }
    expect(props.notes).toEqual(['A3', 'C4', 'E4'])
  })

  it('has a unique id per instance', () => {
    const a = Arp(['C4'])
    const b = Arp(['C4'])
    expect(a.id).not.toBe(b.id)
  })

  it('has no-op connect/disconnect/dispose', () => {
    const arp = Arp(['C4'])
    expect(() => { arp.connect({} as never) }).not.toThrow()
    expect(() => { arp.disconnect() }).not.toThrow()
    expect(() => { arp.dispose() }).not.toThrow()
  })

  it('chain methods work — notes via .notes()', () => {
    const arp = Arp(['C4']).notes(['C4', 'E4', 'G4']).volume(0.5)
    expect(arp._notes).toEqual(['C4', 'E4', 'G4'])
    expect(arp._volume).toBe(0.5)
  })
})

describe('melodic factories return ChainablePart', () => {
  it('Synth returns synth descriptor', () => {
    const s = Synth()
    expect(s._type).toBe('ChainablePart')
    expect(s.instrumentType).toBe('synth')
  })

  it('Synth accepts wave and pitch', () => {
    const s = Synth('square', 'C3')
    expect(s.props).toMatchObject({ wave: 'square' })
    expect(s._notes).toEqual(['C3'])
  })

  it('SubSynth returns sub-synth descriptor with unison/detune extras', () => {
    const s = SubSynth('C2')
    expect(s.instrumentType).toBe('sub-synth')
    expect(s._notes).toEqual(['C2'])
    expect(typeof s.unison).toBe('function')
    expect(typeof s.detune).toBe('function')
  })

  it('SubSynth.unison() and .detune() store in props', () => {
    const s = SubSynth().unison(2).detune(12)
    expect((s.props).unison).toBe(2)
    expect((s.props).detune).toBe(12)
  })

  it('FMSynth returns fm-synth descriptor with ratio/modIndex/feedback extras', () => {
    const s = FMSynth('A3')
    expect(s.instrumentType).toBe('fm-synth')
    expect(typeof s.ratio).toBe('function')
    expect(typeof s.modIndex).toBe('function')
    expect(typeof s.feedback).toBe('function')
  })

  it('FMSynth.ratio().modIndex() chain stores in props', () => {
    const s = FMSynth().ratio(1.273).modIndex(3).feedback(0.2)
    expect((s.props).modRatio).toBe(1.273)
    expect((s.props).modIndex).toBe(3)
    expect((s.props).feedback).toBe(0.2)
  })

  it('Bass303 returns bass-303 descriptor with cutoff/resonance/accent/slide extras', () => {
    const b = Bass303('C2')
    expect(b.instrumentType).toBe('bass-303')
    expect(typeof b.cutoff).toBe('function')
    expect(typeof b.resonance).toBe('function')
    expect(typeof b.accent).toBe('function')
    expect(typeof b.slide).toBe('function')
  })

  it('Bass303 chain stores in props', () => {
    const b = Bass303().cutoff(600).resonance(2.0).accent([0, 4]).slide([1])
    const p = b.props
    expect(p.cutoff).toBe(600)
    expect(p.resonance).toBe(2.0)
    expect(p.accentSteps).toEqual([0, 4])
    expect(p.slideSteps).toEqual([1])
  })

  it('Sample returns sample descriptor', () => {
    const s = Sample('./kick.wav')
    expect(s._type).toBe('ChainablePart')
    expect(s.instrumentType).toBe('sample')
    expect((s.props).path).toBe('./kick.wav')
  })

  it('Theremin returns theremin descriptor', () => {
    expect(Theremin().instrumentType).toBe('theremin')
    expect(Theremin('A4')._notes).toEqual(['A4'])
  })

  it('Sax returns sax descriptor', () => {
    expect(Sax().instrumentType).toBe('sax')
    expect(Sax('A4')._notes).toEqual(['A4'])
  })
})

describe('percussion factories return InstrumentDescriptor', () => {
  it('Kick returns kick descriptor', () => {
    expect(Kick().instrumentType).toBe('kick')
  })

  it('Snare returns snare descriptor', () => {
    expect(Snare().instrumentType).toBe('snare')
  })

  it('HiHat returns hihat descriptor', () => {
    expect(HiHat().instrumentType).toBe('hihat')
  })
})
