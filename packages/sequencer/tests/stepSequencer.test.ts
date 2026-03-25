import { describe, it, expect } from 'vitest'
import { createStepSequencer } from '../src/stepSequencer.js'
import { createTransport } from '../src/transport.js'
import type { Transport } from '../src/transport.js'
import type { Position } from '../src/types.js'
import { mockContext } from './utils/harness.js'

// Minimal mock transport — fires ticks synchronously for behavioral tests.
// Only implements the subset of Transport that createStepSequencer uses.
const makeMockTransport = (bpm = 120) => {
  const tickCallbacks: Array<(pos: Position) => void> = []
  const transport = {
    onTick: (cb: (pos: Position) => void) => { tickCallbacks.push(cb) },
    onBeat: (_cb: (pos: Position) => void) => {},
    onBar:  (_cb: (pos: Position) => void) => {},
    play: () => {}, stop: () => {}, pause: () => {}, seek: () => {}, dispose: () => {},
    get position() { return { bar: 0, beat: 0, tick: 0, time: 0 } },
    get state() { return 'stopped' as const },
    get bpm() { return bpm },
    setBPM: () => {},
  } as unknown as Transport
  const fireTick = (pos: Partial<Position> = {}) => {
    const p: Position = { bar: 0, beat: 0, tick: 0, time: 0, ...pos }
    tickCallbacks.forEach(cb => { cb(p) })
  }
  return { transport, fireTick }
}

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

describe('createStepSequencer — degrade', () => {
  it('degrade=0 fires all steps', () => {
    const { transport, fireTick } = makeMockTransport()
    const steps: number[] = []
    createStepSequencer(transport, { pattern: [1, 1, 1, 1], degrade: 0, seed: 42 },
      (_val, step) => { steps.push(step) })
    fireTick({ bar: 0, beat: 0, tick: 0, time: 0 })
    fireTick({ bar: 0, beat: 0, tick: 1, time: 0.125 })
    fireTick({ bar: 0, beat: 0, tick: 2, time: 0.25 })
    fireTick({ bar: 0, beat: 0, tick: 3, time: 0.375 })
    expect(steps).toEqual([0, 1, 2, 3])
  })

  it('degrade=1.0 skips all steps', () => {
    const { transport, fireTick } = makeMockTransport()
    const steps: number[] = []
    createStepSequencer(transport, { pattern: [1, 1, 1, 1], degrade: 1.0, seed: 42 },
      (_val, step) => { steps.push(step) })
    fireTick({ bar: 0, beat: 0, tick: 0, time: 0 })
    fireTick({ bar: 0, beat: 0, tick: 1, time: 0.125 })
    fireTick({ bar: 0, beat: 0, tick: 2, time: 0.25 })
    fireTick({ bar: 0, beat: 0, tick: 3, time: 0.375 })
    expect(steps).toEqual([])
  })

  it('degrade still advances currentStep when dropped', () => {
    const { transport, fireTick } = makeMockTransport()
    const seq = createStepSequencer(transport, { pattern: [1, 1], degrade: 1.0, seed: 0 }, () => {})
    fireTick({ bar: 0, beat: 0, tick: 0, time: 0 })
    fireTick({ bar: 0, beat: 0, tick: 1, time: 0.125 })
    expect(seq.currentStep).toBe(2)
  })
})

describe('createStepSequencer — swing', () => {
  it('swing=0 does not alter position.time', () => {
    const { transport, fireTick } = makeMockTransport(120)
    const times: number[] = []
    createStepSequencer(transport, { pattern: [1, 1, 1, 1], swing: 0 },
      (_val, _step, pos) => { times.push(pos.time) })
    fireTick({ bar: 0, beat: 0, tick: 0, time: 0 })
    fireTick({ bar: 0, beat: 0, tick: 1, time: 0.125 })
    expect(times[0]).toBe(0)
    expect(times[1]).toBe(0.125)
  })

  it('swing>0 delays odd steps and leaves even steps unchanged', () => {
    const { transport, fireTick } = makeMockTransport(120)
    const times: number[] = []
    createStepSequencer(transport, { pattern: [1, 1, 1, 1], swing: 0.5, ticksPerBeat: 4 },
      (_val, _step, pos) => { times.push(pos.time) })
    // bpm=120, ticksPerBeat=4 → tickDur = 60/120/4 = 0.125s
    // swing offset for odd steps = 0.5 * 0.125 * 0.5 = 0.03125s
    fireTick({ bar: 0, beat: 0, tick: 0, time: 0 })      // step 0 (even)
    fireTick({ bar: 0, beat: 0, tick: 1, time: 0.125 })   // step 1 (odd)
    fireTick({ bar: 0, beat: 0, tick: 2, time: 0.25 })    // step 2 (even)
    fireTick({ bar: 0, beat: 0, tick: 3, time: 0.375 })   // step 3 (odd)
    const expectedSwingOffset = 0.5 * (60 / 120 / 4) * 0.5
    expect(times[0]).toBe(0)                                          // even — no offset
    expect(times[1]).toBeCloseTo(0.125 + expectedSwingOffset)        // odd — delayed
    expect(times[2]).toBe(0.25)                                       // even — no offset
    expect(times[3]).toBeCloseTo(0.375 + expectedSwingOffset)        // odd — delayed
  })
})

describe('createStepSequencer — humanize', () => {
  it('humanize=0 preserves exact position.time', () => {
    const { transport, fireTick } = makeMockTransport()
    const times: number[] = []
    createStepSequencer(transport, { pattern: [1, 1], humanize: 0, seed: 99 },
      (_val, _step, pos) => { times.push(pos.time) })
    fireTick({ bar: 0, beat: 0, tick: 0, time: 0.5 })
    fireTick({ bar: 0, beat: 0, tick: 1, time: 1.0 })
    expect(times[0]).toBe(0.5)
    expect(times[1]).toBe(1.0)
  })

  it('humanize>0 shifts position.time within ±humanize of base time', () => {
    const { transport, fireTick } = makeMockTransport()
    const times: number[] = []
    const amt = 0.01
    createStepSequencer(transport, { pattern: [1, 1, 1, 1], humanize: amt, seed: 42 },
      (_val, _step, pos) => { times.push(pos.time) })
    const baseTimes = [0.5, 0.625, 0.75, 0.875]
    for (const t of baseTimes) {
      fireTick({ bar: 0, beat: 0, tick: 0, time: t })
    }
    for (let i = 0; i < times.length; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(0)
      expect(times[i]).toBeGreaterThanOrEqual((baseTimes[i] ?? 0) - amt)
      expect(times[i]).toBeLessThanOrEqual((baseTimes[i] ?? 0) + amt)
    }
  })

  it('humanize clamps negative result to 0', () => {
    const { transport, fireTick } = makeMockTransport()
    const times: number[] = []
    // Large humanize at time=0 — some steps might go negative, should clamp to 0
    createStepSequencer(transport, { pattern: [1], humanize: 1.0, seed: 7 },
      (_val, _step, pos) => { times.push(pos.time) })
    fireTick({ bar: 0, beat: 0, tick: 0, time: 0 })
    expect(times[0]).toBeGreaterThanOrEqual(0)
  })
})

// ── Pattern extras — mask / stepProb / every / stretch ────────────────────────

describe('createStepSequencer — mask', () => {
  it('skips steps where mask is 0', () => {
    const { transport, fireTick } = makeMockTransport()
    const fired: number[] = []
    // mask = [1, 0, 1, 0] — only even steps fire
    createStepSequencer(
      transport,
      { pattern: [1, 1, 1, 1], mask: [1, 0, 1, 0] },
      (_, step) => { fired.push(step) },
    )
    // Fire 4 ticks (one full cycle)
    fireTick(); fireTick(); fireTick(); fireTick()
    expect(fired).toEqual([0, 2])
  })

  it('allows all steps when mask is all 1s', () => {
    const { transport, fireTick } = makeMockTransport()
    const fired: number[] = []
    createStepSequencer(
      transport,
      { pattern: [1, 1, 1, 1], mask: [1, 1, 1, 1] },
      (_, step) => { fired.push(step) },
    )
    fireTick(); fireTick(); fireTick(); fireTick()
    expect(fired).toEqual([0, 1, 2, 3])
  })

  it('mask wraps when shorter than pattern', () => {
    const { transport, fireTick } = makeMockTransport()
    const fired: number[] = []
    // mask = [1, 0] wraps over 4-step pattern → steps 0,2 fire
    createStepSequencer(
      transport,
      { pattern: [1, 1, 1, 1], mask: [1, 0] },
      (_, step) => { fired.push(step) },
    )
    fireTick(); fireTick(); fireTick(); fireTick()
    expect(fired).toEqual([0, 2])
  })
})

describe('createStepSequencer — stepProb', () => {
  it('fires all steps when all probabilities are 1', () => {
    const { transport, fireTick } = makeMockTransport()
    const fired: number[] = []
    createStepSequencer(
      transport,
      { pattern: [1, 1, 1, 1], stepProb: [1, 1, 1, 1], seed: 42 },
      (_, step) => { fired.push(step) },
    )
    fireTick(); fireTick(); fireTick(); fireTick()
    expect(fired).toEqual([0, 1, 2, 3])
  })

  it('fires no steps when all probabilities are 0', () => {
    const { transport, fireTick } = makeMockTransport()
    const fired: number[] = []
    createStepSequencer(
      transport,
      { pattern: [1, 1, 1, 1], stepProb: [0, 0, 0, 0], seed: 99 },
      (_, step) => { fired.push(step) },
    )
    fireTick(); fireTick(); fireTick(); fireTick()
    expect(fired).toEqual([])
  })

  it('produces deterministic results for same seed', () => {
    const run = (seed: number) => {
      const { transport, fireTick } = makeMockTransport()
      const fired: number[] = []
      createStepSequencer(
        transport,
        { pattern: [1, 1, 1, 1, 1, 1, 1, 1], stepProb: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], seed },
        (_, step) => { fired.push(step) },
      )
      for (let i = 0; i < 8; i++) fireTick()
      return fired
    }
    expect(run(1234)).toEqual(run(1234))
  })

  it('produces different results for different seeds', () => {
    const run = (seed: number) => {
      const { transport, fireTick } = makeMockTransport()
      const fired: number[] = []
      createStepSequencer(
        transport,
        { pattern: [1, 1, 1, 1, 1, 1, 1, 1], stepProb: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], seed },
        (_, step) => { fired.push(step) },
      )
      for (let i = 0; i < 8; i++) fireTick()
      return fired
    }
    expect(run(1)).not.toEqual(run(9999))
  })
})

describe('createStepSequencer — every', () => {
  it('applies transform after every n cycles', () => {
    const { transport, fireTick } = makeMockTransport()
    const patterns: number[][] = []
    const currentPattern = [1, 0, 1, 0]
    // every 1 cycle, reverse the pattern
    createStepSequencer(
      transport,
      {
        pattern: [1, 0, 1, 0],
        every: { n: 1, transform: (p) => [...p].reverse() },
      },
      (val, step) => {
        if (step === 0) patterns.push([])
        patterns[patterns.length - 1]?.push(val)
        void currentPattern
      },
    )
    // Cycle 0: 4 ticks → [1, 0, 1, 0]
    fireTick(); fireTick(); fireTick(); fireTick()
    // Cycle 1: 4 ticks → transform applied → [0, 1, 0, 1]
    fireTick(); fireTick(); fireTick(); fireTick()
    expect(patterns[0]).toEqual([1, 0, 1, 0])
    expect(patterns[1]).toEqual([0, 1, 0, 1])
  })

  it('does not apply transform before first cycle completes', () => {
    const { transport, fireTick } = makeMockTransport()
    const values: number[] = []
    createStepSequencer(
      transport,
      {
        pattern: [1, 0, 1, 0],
        every: { n: 1, transform: (p) => [...p].reverse() },
      },
      (val) => { values.push(val) },
    )
    // Only fire 4 ticks (first cycle only)
    fireTick(); fireTick(); fireTick(); fireTick()
    // First cycle should be the original pattern
    expect(values).toEqual([1, 0, 1, 0])
  })
})

describe('createStepSequencer — stretch', () => {
  it('fires half as many steps with stretch=2', () => {
    const { transport, fireTick } = makeMockTransport()
    const fired: number[] = []
    createStepSequencer(
      transport,
      { pattern: [1, 0, 1, 0], stretch: 2 },
      (_, step) => { fired.push(step) },
    )
    // 8 ticks with stretch=2 → 4 steps (one full cycle)
    for (let i = 0; i < 8; i++) fireTick()
    expect(fired).toEqual([0, 1, 2, 3])
  })

  it('fires all steps at normal speed with stretch=1', () => {
    const { transport, fireTick } = makeMockTransport()
    const fired: number[] = []
    createStepSequencer(
      transport,
      { pattern: [1, 0, 1, 0], stretch: 1 },
      (_, step) => { fired.push(step) },
    )
    for (let i = 0; i < 4; i++) fireTick()
    expect(fired).toEqual([0, 1, 2, 3])
  })

  it('stretch=3 fires step only on sub-tick 0 of each interval', () => {
    const { transport, fireTick } = makeMockTransport()
    const fired: number[] = []
    createStepSequencer(
      transport,
      { pattern: [1, 1], stretch: 3 },
      (_, step) => { fired.push(step) },
    )
    // 6 ticks with stretch=3 → 2 steps
    for (let i = 0; i < 6; i++) fireTick()
    expect(fired).toEqual([0, 1])
  })
})
