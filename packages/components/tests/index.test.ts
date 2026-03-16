import { describe, it, expect } from 'vitest'
import { Synth, Sample, Kick, Snare, HiHat } from '../src/index.js'

describe('@score/components barrel export', () => {
  it('exports all component factories', () => {
    expect(typeof Synth).toBe('function')
    expect(typeof Sample).toBe('function')
    expect(typeof Kick).toBe('function')
    expect(typeof Snare).toBe('function')
    expect(typeof HiHat).toBe('function')
  })
})
