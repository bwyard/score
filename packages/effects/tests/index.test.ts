import { describe, it, expect } from 'vitest'
import * as effects from '../src/index.js'

describe('@score/effects barrel export', () => {
  it('exports createFilter', () => {
    expect(typeof effects.createFilter).toBe('function')
  })

  it('exports createDelay', () => {
    expect(typeof effects.createDelay).toBe('function')
  })

  it('exports createReverb', () => {
    expect(typeof effects.createReverb).toBe('function')
  })

  it('exports createCompressor', () => {
    expect(typeof effects.createCompressor).toBe('function')
  })

  it('exports createEQ', () => {
    expect(typeof effects.createEQ).toBe('function')
  })

  it('exports createSidechain', () => {
    expect(typeof effects.createSidechain).toBe('function')
  })
})
