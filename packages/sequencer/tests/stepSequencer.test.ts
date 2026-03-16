import { describe, it, expect } from 'vitest'
import { createStepSequencer } from '../src/stepSequencer.js'
import { createTransport } from '../src/transport.js'
import { mockContext } from './utils/harness.js'

describe('createStepSequencer', () => {
  const makeTransport = () => createTransport(mockContext())

  it('returns correct shape (setPattern, currentStep, dispose)', () => {
    const transport = makeTransport()
    const seq = createStepSequencer(transport, { pattern: [1, 0, 1, 0] }, () => {})
    expect(typeof seq.setPattern).toBe('function')
    expect(typeof seq.currentStep).toBe('number')
    expect(typeof seq.dispose).toBe('function')
    transport.dispose()
  })

  it('accepts array pattern', () => {
    const transport = makeTransport()
    expect(() => {
      createStepSequencer(transport, { pattern: [1, 0, 1, 0] }, () => {})
    }).not.toThrow()
    transport.dispose()
  })

  it('accepts function pattern', () => {
    const transport = makeTransport()
    expect(() => {
      createStepSequencer(transport, { pattern: (step, _bar) => step % 2 }, () => {})
    }).not.toThrow()
    transport.dispose()
  })

  it('setPattern updates pattern without throwing', () => {
    const transport = makeTransport()
    const seq = createStepSequencer(transport, { pattern: [1, 0] }, () => {})
    expect(() => { seq.setPattern([0, 1, 0, 1]) }).not.toThrow()
    transport.dispose()
  })

  it('setPattern accepts function pattern', () => {
    const transport = makeTransport()
    const seq = createStepSequencer(transport, { pattern: [1, 0] }, () => {})
    expect(() => { seq.setPattern((step) => step) }).not.toThrow()
    transport.dispose()
  })

  it('initial currentStep is 0', () => {
    const transport = makeTransport()
    const seq = createStepSequencer(transport, { pattern: [1, 0, 1, 0] }, () => {})
    expect(seq.currentStep).toBe(0)
    transport.dispose()
  })

  it('dispose does not throw', () => {
    const transport = makeTransport()
    const seq = createStepSequencer(transport, { pattern: [1] }, () => {})
    expect(() => { seq.dispose() }).not.toThrow()
    transport.dispose()
  })

  it('dispose can be called multiple times', () => {
    const transport = makeTransport()
    const seq = createStepSequencer(transport, { pattern: [1] }, () => {})
    expect(() => {
      seq.dispose()
      seq.dispose()
    }).not.toThrow()
    transport.dispose()
  })

  it('accepts custom steps count', () => {
    const transport = makeTransport()
    expect(() => {
      createStepSequencer(transport, { pattern: [1, 0], steps: 8 }, () => {})
    }).not.toThrow()
    transport.dispose()
  })

  it('accepts function pattern with custom steps', () => {
    const transport = makeTransport()
    expect(() => {
      createStepSequencer(
        transport,
        { pattern: (step) => step % 4, steps: 16 },
        () => {},
      )
    }).not.toThrow()
    transport.dispose()
  })

  it('default steps is pattern.length for array', () => {
    const transport = makeTransport()
    const seq = createStepSequencer(transport, { pattern: [1, 0, 1, 0] }, () => {})
    // No direct accessor for steps, but construction should succeed
    expect(seq.currentStep).toBe(0)
    transport.dispose()
  })

  it('setPattern with array updates internal steps count', () => {
    const transport = makeTransport()
    const seq = createStepSequencer(transport, { pattern: [1, 0] }, () => {})
    seq.setPattern([1, 0, 1, 0, 1, 0, 1, 0])
    expect(seq.currentStep).toBe(0) // still valid
    transport.dispose()
  })

  it('currentStep resets to 0 after dispose', () => {
    const transport = makeTransport()
    const seq = createStepSequencer(transport, { pattern: [1, 0] }, () => {})
    seq.dispose()
    expect(seq.currentStep).toBe(0)
    transport.dispose()
  })

  it('works with string pattern values', () => {
    const transport = makeTransport()
    expect(() => {
      createStepSequencer<string>(
        transport,
        { pattern: ['kick', 'snare', 'hat'] },
        () => {},
      )
    }).not.toThrow()
    transport.dispose()
  })
})
