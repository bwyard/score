// engine-pop-prevention — hard-onset click regression tests
//
// INVARIANT: every GainNode created inside a trigger function MUST be
// initialized with `gain: 0`. The scheduleEnvelope() call shapes the attack
// ramp. Violating this causes an audible click/pop on every hit because the
// signal jumps from 0 (silence) to `gain` (full amplitude) in one sample.
//
// This test intercepts ctx.createGain to record the initial gain value for
// each node created during a trigger call, then asserts all values are 0.
// It acts as a regression guard: any future trigger function that skips the
// zero-init pattern will fail this test immediately.

import { describe, it, expect, vi, afterEach } from 'vitest'
import { webAudioBackend } from '@score/core'
import { triggerKick, triggerSnare, triggerHiHat, triggerSynth } from '../src/engine.js'
import type { KickProps, SnareProps, HiHatProps, SynthDSLProps } from '@score/dsl'

// ── Helpers ──────────────────────────────────────────────────────────────────

type Ctx     = ReturnType<typeof webAudioBackend.createContext>
type GainN   = ReturnType<Ctx['createGain']>

/** Create a real audio context and intercept createGain to record init values. */
const withGainSpy = (fn: (ctx: Ctx, dest: GainN, initGains: () => number[]) => void): void => {
  const ctx  = webAudioBackend.createContext()
  const log: number[] = []

  const original = ctx.createGain.bind(ctx)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(ctx as any).createGain = (props?: { gain?: number }) => {
    // Web Audio spec: GainNode.gain defaults to 1.0 when not specified
    log.push(props?.gain ?? 1)
    return original(props)
  }

  // dest is the first logged value — the trigger's internal nodes come after
  const dest = ctx.createGain({ gain: 1 })
  const triggerGains = () => log.slice(1)

  fn(ctx, dest, triggerGains)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('trigger functions — zero-gain onset invariant', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('triggerKick — all internal GainNodes initialise at gain 0', () => {
    withGainSpy((ctx, dest, gains) => {
      triggerKick(ctx, 0, { volume: 0.9 } satisfies KickProps, dest)
      expect(gains().every(g => g === 0)).toBe(true)
      expect(gains().length).toBeGreaterThan(0)
    })
  })

  it('triggerSnare — both body and noise GainNodes initialise at gain 0', () => {
    withGainSpy((ctx, dest, gains) => {
      triggerSnare(ctx, 0, { volume: 0.7 } satisfies SnareProps, dest)
      expect(gains().every(g => g === 0)).toBe(true)
      // snare creates 2 internal gain nodes (bGain + nGain)
      expect(gains().length).toBe(2)
    })
  })

  it('triggerHiHat — internal GainNode initialises at gain 0 (regression: was full amplitude)', () => {
    withGainSpy((ctx, dest, gains) => {
      triggerHiHat(ctx, 0, { volume: 0.4 } satisfies HiHatProps, dest)
      expect(gains().every(g => g === 0)).toBe(true)
      expect(gains().length).toBe(1)
    })
  })

  it('triggerHiHat open — open hi-hat also initialises at gain 0', () => {
    withGainSpy((ctx, dest, gains) => {
      triggerHiHat(ctx, 0, { volume: 0.4, open: true } satisfies HiHatProps, dest)
      expect(gains().every(g => g === 0)).toBe(true)
    })
  })

  it('triggerSynth — GainNode initialises at gain 0', () => {
    withGainSpy((ctx, dest, gains) => {
      triggerSynth(ctx, 0, { wave: 'sawtooth', gain: 0.5 } satisfies SynthDSLProps, 440, dest)
      expect(gains().every(g => g === 0)).toBe(true)
      expect(gains().length).toBe(1)
    })
  })

  it('triggerSynth with filter — GainNode still initialises at gain 0', () => {
    withGainSpy((ctx, dest, gains) => {
      triggerSynth(ctx, 0, {
        wave: 'sawtooth', gain: 0.5,
        filter: { type: 'lowpass', frequency: 400 },
      } satisfies SynthDSLProps, 65.41, dest)
      expect(gains().every(g => g === 0)).toBe(true)
    })
  })
})
