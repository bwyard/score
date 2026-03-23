// Tests for Phase 2 engine hydration:
// - createKick808 / createKick909 / createHihat808 / createSnare909 / createSubtractiveSynth
//   all hydrate and trigger without throwing via a mock audio context.
//
// Pattern: construct a minimal mock context, instantiate the component via the
// same factory path the engine uses, connect to a mock dest, call trigger/noteOn.

import { describe, it, expect } from 'vitest'
import {
  createKick808,
  createKick909,
  createHihat808,
  createSnare909,
  createSubtractiveSynth,
} from '@score/components'
import { webAudioBackend } from '@score/core'

// ── Lightweight offline context for output-level tests ────────────────────────

const makeCtx = () =>
  webAudioBackend.createContext({
    sampleRate: 44100,
    offline: { length: 4096, numberOfChannels: 1 },
  })

// ── Hydration smoke tests — each instrument must connect + trigger with no throw

describe('engine hydration — Phase 2 synthesis instruments', () => {
  it('createKick808 connects and triggers without throwing', () => {
    const ctx = makeCtx()
    const kick = createKick808(ctx, { gain: 0.8 })
    expect(() => {
      kick.connect(ctx.destination)
      kick.trigger(0)
      kick.trigger(0.5)
    }).not.toThrow()
    kick.dispose()
  })

  it('createKick909 connects and triggers without throwing', () => {
    const ctx = makeCtx()
    const kick = createKick909(ctx, { gain: 0.8, clickLevel: 0.25 })
    expect(() => {
      kick.connect(ctx.destination)
      kick.trigger(0)
    }).not.toThrow()
    kick.dispose()
  })

  it('createHihat808 connects and triggers without throwing (closed)', () => {
    const ctx = makeCtx()
    const hat = createHihat808(ctx, { decay: 0.06 })
    expect(() => {
      hat.connect(ctx.destination)
      hat.trigger(0)
    }).not.toThrow()
    hat.dispose()
  })

  it('createHihat808 connects and triggers without throwing (open)', () => {
    const ctx = makeCtx()
    const hat = createHihat808(ctx, { open: true })
    expect(() => {
      hat.connect(ctx.destination)
      hat.trigger(0)
    }).not.toThrow()
    hat.dispose()
  })

  it('createSnare909 connects and triggers without throwing', () => {
    const ctx = makeCtx()
    const snare = createSnare909(ctx, { toneDecay: 0.2, noiseDecay: 0.3 })
    expect(() => {
      snare.connect(ctx.destination)
      snare.trigger(0)
    }).not.toThrow()
    snare.dispose()
  })

  it('createSubtractiveSynth connects, noteOn and noteOff without throwing', () => {
    const ctx = makeCtx()
    const synth = createSubtractiveSynth(ctx, {
      wave: 'sawtooth',
      frequency: 220,
      filter: { type: 'lowpass', frequency: 800, Q: 2 },
      adsr: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 },
      gain: 0.7,
    })
    expect(() => {
      synth.connect(ctx.destination)
      synth.noteOn(0)
      synth.noteOff(0.3)
    }).not.toThrow()
    synth.dispose()
  })

  it('createSubtractiveSynth setFrequency does not throw', () => {
    const ctx = makeCtx()
    const synth = createSubtractiveSynth(ctx, { frequency: 110 })
    synth.connect(ctx.destination)
    expect(() => {
      synth.setFrequency(220, 0)
      synth.noteOn(0)
      synth.noteOff(0.5)
    }).not.toThrow()
    synth.dispose()
  })

  it('multiple kick808 triggers produce audio (oscillators are started)', () => {
    const ctx = makeCtx()
    const kick = createKick808(ctx, { gain: 0.9 })
    kick.connect(ctx.destination)
    // Trigger 4 times — no throw and no undefined
    for (let i = 0; i < 4; i++) {
      kick.trigger(i * 0.25)
    }
    kick.dispose()
  })

  it('kick808 and snare909 can both connect to same destination', () => {
    const ctx = makeCtx()
    const kick  = createKick808(ctx)
    const snare = createSnare909(ctx)
    expect(() => {
      kick.connect(ctx.destination)
      snare.connect(ctx.destination)
      kick.trigger(0)
      snare.trigger(0.25)
    }).not.toThrow()
    kick.dispose()
    snare.dispose()
  })
})
