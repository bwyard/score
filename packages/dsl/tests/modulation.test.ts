import { describe, it, expect } from 'vitest'
import { lfo, sine, ramp, lorenz, ou, logistic } from '../src/index.js'
import type { ModulationDescriptor } from '../src/index.js'

// Verify that all modulation factories are re-exported from @score/dsl.
// Previously they were defined in dsl/src/modulation.ts but not exported
// from the package index, so `import { lfo } from '@score/dsl'` silently failed.

describe('@score/dsl — modulation exports', () => {
  it('lfo is exported and returns a ModulationDescriptor', () => {
    const mod: ModulationDescriptor = lfo(2, 0.5)
    expect(mod._type).toBe('ModulationDescriptor')
    expect(mod.source).toBe('lfo')
    expect(mod.params.rate).toBe(2)
  })

  it('sine is exported and returns a ModulationDescriptor', () => {
    const mod: ModulationDescriptor = sine(4, 0.8)
    expect(mod._type).toBe('ModulationDescriptor')
    expect(mod.source).toBe('sine')
    expect(mod.params.rate).toBe(4)
  })

  it('ramp is exported and returns a ModulationDescriptor', () => {
    const mod: ModulationDescriptor = ramp(8)
    expect(mod._type).toBe('ModulationDescriptor')
    expect(mod.source).toBe('ramp')
    expect(mod.params.bars).toBe(8)
  })

  it('lorenz is exported and returns a ModulationDescriptor', () => {
    const mod: ModulationDescriptor = lorenz({ axis: 'x', speed: 0.02 })
    expect(mod._type).toBe('ModulationDescriptor')
    expect(mod.source).toBe('lorenz')
  })

  it('ou is exported and returns a ModulationDescriptor', () => {
    const mod: ModulationDescriptor = ou(0.3, 0.5)
    expect(mod._type).toBe('ModulationDescriptor')
    expect(mod.source).toBe('ou')
    expect(mod.params.theta).toBe(0.3)
  })

  it('logistic is exported and returns a ModulationDescriptor', () => {
    const mod: ModulationDescriptor = logistic(3.9)
    expect(mod._type).toBe('ModulationDescriptor')
    expect(mod.source).toBe('logistic')
    expect(mod.params.r).toBe(3.9)
  })
})
