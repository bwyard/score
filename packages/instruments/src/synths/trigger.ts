// @score/instruments — synths/trigger.ts
// Generic synthesizer factory — oscillator + optional filter + ADSR VCA.
// "Trigger" refers to the per-note instantiation pattern: each note spawns
// an ephemeral oscillator that stops when its envelope ends.
//
// Variants in INSTRUMENT_REGISTRY:
//   'synth' → createGenericSynth  (this file)
//
// For sustained/unison/filter-envelope variants see:
//   'subsynth' → createSubtractiveSynth  (@score/components)
//   'pad'      → createPad               (@score/components)
//
// PLANNED: supersaw (N detuned oscs), reese (2 detuned saws + sub)

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, OscillatorType } from '@score/core'
import { uid } from '@score/core'

// ── Props ─────────────────────────────────────────────────────────────────────

/** Filter configuration for {@link GenericSynthProps}. */
export type GenericSynthFilterProps = {
  readonly type?: 'lowpass' | 'highpass' | 'bandpass'
  /** Filter cutoff frequency in Hz. Default `2000`. */
  readonly frequency?: number
  /** Filter Q / resonance. Default `1`. */
  readonly Q?: number
}

/** ADSR envelope configuration for {@link GenericSynthProps}. */
export type GenericSynthEnvelope = {
  /** Attack time in seconds. Default `0.005`. */
  readonly attack?: number
  /** Decay time in seconds. Default `0.08`. */
  readonly decay?: number
  /** Sustain level 0–1. Default `0.7`. */
  readonly sustain?: number
  /** Release time in seconds. Default `0.05`. */
  readonly release?: number
}

/** Configuration for {@link createGenericSynth}. */
export type GenericSynthProps = {
  /** Oscillator waveform. Default `'sawtooth'`. */
  readonly wave?: OscillatorType
  /** Initial frequency in Hz. Overridden per-note by the engine dispatch. Default `440`. */
  readonly frequency?: number
  /** Output gain 0–1. Default `0.25`. */
  readonly gain?: number
  /** Optional filter inserted between oscillator and VCA. */
  readonly filter?: GenericSynthFilterProps
  /** Amplitude ADSR envelope. */
  readonly envelope?: GenericSynthEnvelope
}

// ── GenericSynthComponent ─────────────────────────────────────────────────────

/**
 * A synthesized voice component — extends {@link AudioComponent} with per-note
 * trigger semantics. Each `triggerNote(freq, time)` call spawns an ephemeral
 * oscillator + VCA that auto-stops when the ADSR envelope ends.
 */
export type GenericSynthComponent = AudioComponent & {
  /**
   * Trigger one note at `freq` Hz scheduled at `time`.
   * @param freq - Frequency in Hz.
   * @param time - Schedule time in seconds (`audioContext.currentTime`-relative).
   */
  readonly triggerNote: (freq: number, time: number) => void
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a generic synthesized voice component.
 *
 * Signal path: oscillator (→ optional filter) → ADSR VCA → output gain.
 * Each `triggerNote()` call spawns ephemeral nodes that stop when the envelope ends.
 * Envelope length = attack + decay + release + 20 ms.
 *
 * @param context - Backend audio context.
 * @param props   - Optional synth configuration.
 * @returns A {@link GenericSynthComponent} with `type` set to `'synth'`.
 *
 * @example
 * ```ts
 * const synth = createGenericSynth(context, { wave: 'sawtooth', gain: 0.3 })
 * synth.connect(context.destination)
 * synth.triggerNote(440, context.currentTime)
 * ```
 */
export const createGenericSynth = (
  context: ScoreAudioContext,
  props: GenericSynthProps = {},
): GenericSynthComponent => {
  // outputGain holds the static output level — the VCA envelope peaks at 1.0
  // so gain controls the instrument level without double-applying.
  const outputGain = context.createGain({ gain: props.gain ?? 0.25 })

  const triggerNote = (freq: number, time: number): void => {
    const env     = props.envelope ?? {}
    const attack  = env.attack  ?? 0.005
    const decay   = env.decay   ?? 0.08
    const sustain = env.sustain ?? 0.7
    const release = env.release ?? 0.05
    const noteDur = attack + decay + release + 0.02

    const osc = context.createOscillator({ type: props.wave ?? 'sawtooth', frequency: freq })
    const vca = context.createGain({ gain: 0 })

    if (props.filter) {
      const filt = context.createFilter({
        type:                props.filter.type      ?? 'lowpass',
        frequency:           props.filter.frequency ?? 2000,
        ...(props.filter.Q !== undefined && { Q: props.filter.Q }),
      })
      osc.connect(filt)
      filt.connect(vca)
      osc.onended = () => {
        try { osc.disconnect()  } catch { /* ok */ }
        try { filt.disconnect() } catch { /* ok */ }
        try { vca.disconnect()  } catch { /* ok */ }
      }
    } else {
      osc.connect(vca)
      osc.onended = () => {
        try { osc.disconnect() } catch { /* ok */ }
        try { vca.disconnect() } catch { /* ok */ }
      }
    }

    vca.connect(outputGain)
    vca.scheduleEnvelope({ peak: 1.0, attack, decay, sustain, release, startTime: time, duration: noteDur })
    osc.start(time)
    osc.stop(time + noteDur)
  }

  const component: GenericSynthComponent = {
    id:   uid('synth'),
    type: 'synth' as const,
    triggerNote,

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },
    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },
    dispose: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
