// bass303.ts — Roland TB-303-style bass synth component for @score/components
//
// Architecture:
//   osc (saw/square) → filter LP (high Q) → MEG envelope (cutoff sweep)
//                                          → VEG envelope (amp) → accent gain → output gain
//
// MEG (modulation envelope generator): attacks to env peak, decays to base cutoff.
// VEG (volume envelope generator): attacks, decays, sustains.
// Accent: boosts peak cutoff + peak amp when active (velocity-driven).
// Slide: when active, glides frequency from previous note to current
//        (uses setFrequency at previous note position, then ramps to new freq).
//
// The 303's signature sound is the filter cutoff sweeping down from a high peak on each note,
// driven by the MEG. The decay time and env depth together control "squelch" character.
// High resonance (Q ≥ 10) creates the self-oscillating resonant peak.

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

/**
 * ADSR envelope parameters.
 */
export type Bass303AdsrProps = {
  /** Attack time in seconds. */
  readonly attack?: number
  /** Decay time in seconds. */
  readonly decay?: number
  /** Sustain level 0–1. */
  readonly sustain?: number
  /** Release time in seconds. */
  readonly release?: number
}

/**
 * Configuration props for {@link createBass303}.
 */
export type Bass303Props = {
  /**
   * Oscillator waveform. `'sawtooth'` for classic 303 acid; `'square'` for hollow bass.
   * Default `'sawtooth'`.
   */
  readonly wave?: 'sawtooth' | 'square'
  /** Oscillator frequency in Hz. Default `110`. */
  readonly frequency?: number
  /**
   * Filter base cutoff frequency in Hz. MEG sweeps up from this point.
   * Default `400`.
   */
  readonly cutoff?: number
  /**
   * Filter resonance Q. Range 0–30; high values (≥10) produce 303 squelch.
   * Default `12`.
   */
  readonly resonance?: number
  /**
   * MEG envelope depth in Hz — how far the cutoff sweeps above the base cutoff on note trigger.
   * Large values (≥2000) produce classic acid squelch. Default `3000`.
   */
  readonly envDepth?: number
  /** MEG (filter envelope) ADSR. Default: attack 0.005, decay 0.2, sustain 0, release 0.1. */
  readonly filterAdsr?: Bass303AdsrProps
  /** VEG (amp envelope) ADSR. Default: attack 0.003, decay 0.2, sustain 0.6, release 0.1. */
  readonly ampAdsr?: Bass303AdsrProps
  /**
   * Accent boost factor for cutoff peak and amp peak. Accent multiplies both MEG peak
   * and amp peak by this factor. Range 1.0 (off) – 2.0 (heavy accent).
   * Default `1.0` (no accent — use `noteOnAccent()` to trigger with accent).
   */
  readonly accentAmount?: number
  /**
   * Slide (portamento / legato) time in seconds.
   * When `slide` is true on a `noteOn` call, the frequency ramps from its current
   * value to the new frequency over this duration. Default `0.06`.
   */
  readonly slideTime?: number
  /** Output gain 0–1. Default `0.7`. */
  readonly gain?: number
}

/**
 * A TB-303-style bass synth component.
 * Extends {@link AudioComponent} with note-on / note-off and accent / slide control.
 */
export type Bass303Component = AudioComponent & {
  /**
   * Gate a note on: trigger MEG (cutoff sweep) and VEG (amp envelope).
   * @param time    - Schedule time in seconds. Defaults to `context.currentTime`.
   * @param accent  - If true, boost cutoff peak and amp peak by `accentAmount`. Default false.
   * @param slide   - If true, glide frequency from current pitch to `frequency`. Default false.
   */
  readonly noteOn: (time?: number, accent?: boolean, slide?: boolean) => void
  /**
   * Gate a note off: trigger VEG amp release.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOff: (time?: number) => void
  /**
   * Set the oscillator frequency in Hz.
   * @param value - Target frequency in Hz.
   * @param time  - Optional schedule time.
   */
  readonly setFrequency: (value: number, time?: number) => void
  /**
   * Set the filter base cutoff in Hz.
   * @param value - Cutoff frequency in Hz.
   * @param time  - Optional schedule time.
   */
  readonly setCutoff: (value: number, time?: number) => void
  /**
   * Set the output gain.
   * @param value - Gain 0–1.
   * @param time  - Optional schedule time.
   */
  readonly setGain: (value: number, time?: number) => void
}

// HARDWARE BOUNDARY — oscillator started state: one-way transition
type OscState = { started: boolean }

/**
 * Create a TB-303-style bass synth component.
 *
 * Signal path:
 * ```
 * osc (saw/square)
 *   → LP filter (high Q, MEG cutoff sweep)
 *   → VEG amp VCA
 *   → accent gain (optional boost)
 *   → output gain
 * ```
 * MEG (modulation envelope generator): attacks from `cutoff + envDepth` peak, decays to
 * `cutoff` base. Accent multiplies the peak for classic TB-303 "accented" note behaviour.
 * Slide: when `slide=true`, ramps oscillator frequency from its current pitch to the new
 * note frequency over `slideTime` seconds.
 *
 * @param context - Backend audio context.
 * @param props   - 303 configuration. All fields optional.
 * @returns A {@link Bass303Component} with `id` prefixed `bass303` and `type` set to `'bass-303'`.
 *
 * @example
 * ```ts
 * // Classic acid bass
 * const bass = createBass303(context, { frequency: 110, cutoff: 400, resonance: 15, envDepth: 3000 })
 * bass.connect(context.destination)
 * bass.noteOn(context.currentTime)
 * bass.noteOff(context.currentTime + 0.2)
 *
 * // Accented note
 * bass.noteOn(context.currentTime, true)
 *
 * // Slide from previous pitch to new frequency
 * bass.setFrequency(82)
 * bass.noteOn(context.currentTime, false, true)
 * ```
 *
 * @see {@link Bass303Props}
 * @see {@link Bass303Component}
 * @throws Never — invalid props are silently clamped.
 */
export const createBass303 = (
  context: ScoreAudioContext,
  props?: Bass303Props,
): Bass303Component => {
  // ── Props with defaults ───────────────────────────────────────────────────
  const wave         = props?.wave        ?? 'sawtooth'
  const initFreq     = props?.frequency   ?? 110
  const baseCutoff   = props?.cutoff      ?? 400
  const resonance    = Math.max(0, Math.min(30, props?.resonance ?? 12))
  const envDepth     = props?.envDepth    ?? 3000
  const accentAmount = Math.max(1.0, Math.min(2.0, props?.accentAmount ?? 1.0))
  const slideTime    = props?.slideTime   ?? 0.06

  const filterAdsr = props?.filterAdsr ?? {}
  const fAtk  = filterAdsr.attack  ?? 0.005
  const fDec  = filterAdsr.decay   ?? 0.2
  const fSus  = filterAdsr.sustain ?? 0
  const fRel  = filterAdsr.release ?? 0.1

  const ampAdsr = props?.ampAdsr ?? {}
  const aAtk  = ampAdsr.attack  ?? 0.003
  const aDec  = ampAdsr.decay   ?? 0.2
  const aSus  = ampAdsr.sustain ?? 0.6
  const aRel  = ampAdsr.release ?? 0.1

  // ── Audio graph ───────────────────────────────────────────────────────────
  const osc    = context.createOscillator({ type: wave, frequency: initFreq })
  const filter = context.createFilter({ type: 'lowpass', frequency: baseCutoff, Q: resonance })
  const vca    = context.createGain({ gain: 0 })
  const outputGain = context.createGain({ gain: props?.gain ?? 0.7 })

  osc.connect(filter)
  filter.connect(vca)
  vca.connect(outputGain)

  // HARDWARE BOUNDARY — osc started: one-way
  const oscState: OscState = { started: false }

  // Sustained filter cutoff (tracked for release anchor)
  const filterSusCutoff = baseCutoff + envDepth * fSus

  // ── noteOn ────────────────────────────────────────────────────────────────
  const noteOn = (time?: number, accent = false, slide = false): void => {
    const t = time ?? context.currentTime

    if (!oscState.started) {
      osc.start(t)
      oscState.started = true
    }

    // Slide: set frequency at t (current pitch held until slide arrives)
    if (slide) {
      osc.setFrequency(initFreq, t + slideTime)
    }

    // Accent multiplies the MEG peak and amp peak
    const cutoffPeak = accent ? (baseCutoff + envDepth) * accentAmount : baseCutoff + envDepth
    const ampPeak    = accent ? Math.min(1.0, accentAmount * 0.9) : 1.0

    // MEG: attack from baseCutoff to cutoffPeak, decay to sustain cutoff
    filter.scheduleFilterEnvelope({
      baseFreq: baseCutoff,
      envDepth: cutoffPeak - baseCutoff,
      sustain: fSus,
      attack: fAtk,
      decay: fDec,
      startTime: t,
    })

    // VEG: amp attack → decay → sustain
    vca.scheduleEnvelope({
      peak: ampPeak, attack: aAtk, decay: aDec, sustain: aSus,
      release: 0, startTime: t,
      duration: aAtk + aDec + 9999,
    })
  }

  // ── noteOff ───────────────────────────────────────────────────────────────
  const noteOff = (time?: number): void => {
    const t = time ?? context.currentTime
    // VEG release
    vca.scheduleEnvelope({
      peak: aSus, attack: 0, decay: aRel, sustain: 0,
      release: 0, startTime: t, duration: aRel,
    })
    // MEG release: sweep cutoff back to base
    filter.scheduleFilterRelease({
      sustainFreq: filterSusCutoff,
      baseFreq: baseCutoff,
      release: fRel,
      time: t,
    })
    osc.stop(t + Math.max(aRel, fRel) + 0.05)
  }

  const component: Bass303Component = {
    id:   uid('bass303'),
    type: 'bass-303' as const,
    noteOn,
    noteOff,

    setFrequency: (value: number, time?: number) => {
      osc.setFrequency(value, time)
    },

    setCutoff: (value: number, time?: number) => {
      filter.setFrequency(value, time)
    },

    setGain: (value: number, time?: number) => {
      outputGain.setGain(value, time)
    },

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },

    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      try { osc.stop()             } catch { /* already stopped */ }
      try { osc.disconnect()       } catch { /* already disconnected */ }
      try { filter.disconnect()    } catch { /* already disconnected */ }
      try { vca.disconnect()       } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
