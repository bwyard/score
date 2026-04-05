// wobble.ts — WobbleBass instrument component for @score/components
//
// Dubstep/brostep-style wobble bass: sawtooth oscillator through a resonant
// lowpass filter with an internal LFO modulating the filter cutoff frequency.
//
// Signal path: sawtooth osc → LP resonant filter → VCA → outputGain
// LFO path:    sine osc (lfo) → lfoGain → filter.frequencyParam (AudioParam modulation)

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration props for {@link createWobbleBass}.
 */
export type WobbleBassProps = {
  /**
   * LFO rate in Hz — controls how fast the filter sweeps up and down.
   * Default `2.0` (~2 wobbles/sec, one wobble per beat at 120 BPM).
   * Sync to BPM: `bpm / 60 * noteValue` (e.g. `120/60 * 1 = 2.0` for quarter-note wobble).
   */
  readonly lfoRateHz?: number
  /**
   * LFO modulation depth in Hz — peak deviation added to / subtracted from the base
   * filter cutoff. Default `800` Hz. At `filterBase: 200` + `lfoDepth: 800`, the filter
   * sweeps between 200 and 1000 Hz each cycle.
   */
  readonly lfoDepth?: number
  /**
   * Base filter cutoff frequency in Hz. Default `200` Hz — intentionally deep so the
   * wobble sits in the sub-bass register and has headroom to sweep upward.
   */
  readonly filterBase?: number
  /**
   * Filter resonance Q. Default `8.0` — high resonance for the characteristic
   * squeaky, self-oscillating wobble character.
   */
  readonly filterQ?: number
  /** Amp envelope attack time in seconds. Default `0.01`. */
  readonly attack?: number
  /** Amp envelope decay time in seconds. Default `0.1`. */
  readonly decay?: number
  /** Amp envelope sustain level 0–1. Default `0.8`. */
  readonly sustain?: number
  /** Amp envelope release time in seconds. Default `0.15`. */
  readonly release?: number
  /** Output gain 0–1. Default `0.8`. */
  readonly gain?: number
}

/**
 * A WobbleBass instrument component — resonant sawtooth bass with an internal
 * LFO sweeping the filter cutoff. Canonical Dubstep/Brostep voice.
 * Extends {@link AudioComponent} with note-on / note-off / frequency control.
 */
export type WobbleBassComponent = AudioComponent & {
  /**
   * Gate a note on: start the main oscillator and LFO, trigger the amp ADSR.
   * Safe to call multiple times — oscillators are only started once.
   * @param freq - Note frequency in Hz.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOn: (freq: number, time?: number) => void
  /**
   * Gate a note off: trigger the amp release phase, stop oscillator and LFO after release.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOff: (time?: number) => void
  /**
   * Set the oscillator frequency in Hz. The LFO continues at its configured rate.
   * @param freq - Target frequency in Hz.
   * @param time - Optional schedule time.
   */
  readonly setFrequency: (freq: number, time?: number) => void
  /**
   * Set the output gain.
   * @param value - Gain 0–1.
   * @param time  - Optional schedule time.
   */
  readonly setGain: (value: number, time?: number) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

// HARDWARE BOUNDARY — oscillator started state: append-only (false → true, never reset).
// Const-bound mutable object per the no-let rule.
type OscState = { started: boolean }

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a WobbleBass instrument component — resonant sawtooth with LFO filter modulation.
 *
 * Signal path:
 * ```
 * sawtooth osc → LP resonant filter → VCA (ADSR) → outputGain
 * sine lfo → lfoGain → filter.frequencyParam  (AudioParam modulation)
 * ```
 *
 * The LFO is a second oscillator at `lfoRateHz` connected to the filter's frequency
 * AudioParam via a gain node set to `lfoDepth`. This adds ±`lfoDepth` Hz to the
 * base filter cutoff each LFO cycle, producing the characteristic wobble sweep.
 *
 * @param context - Backend audio context.
 * @param props   - Wobble bass configuration. All fields have defaults.
 * @returns A {@link WobbleBassComponent} with `id` prefixed `wobble` and `type` set to `'wobble'`.
 *
 * @example
 * ```ts
 * // Classic half-time dubstep wobble at 140 BPM (1 wobble per beat = 2.33 Hz)
 * const wobble = createWobbleBass(context, {
 *   lfoRateHz:  2.33,
 *   lfoDepth:   800,
 *   filterBase: 200,
 *   filterQ:    8.0,
 *   gain: 0.8,
 * })
 * wobble.connect(context.destination)
 * wobble.noteOn(55, context.currentTime)   // A1 — deep sub
 * wobble.noteOff(context.currentTime + 2.0)
 * wobble.dispose()
 * ```
 *
 * @see {@link WobbleBassProps}
 * @see {@link WobbleBassComponent}
 * @throws {ScoreError} Never — invalid props are silently clamped.
 */
export const createWobbleBass = (
  context: ScoreAudioContext,
  props?: WobbleBassProps,
): WobbleBassComponent => {
  // ── Config ────────────────────────────────────────────────────────────────
  const lfoRateHz  = props?.lfoRateHz  ?? 2.0
  const lfoDepth   = props?.lfoDepth   ?? 800
  const filterBase = props?.filterBase ?? 200
  const filterQ    = props?.filterQ    ?? 8.0

  const ampAttack  = props?.attack  ?? 0.01
  const ampDecay   = props?.decay   ?? 0.1
  const ampSustain = props?.sustain ?? 0.8
  const ampRelease = props?.release ?? 0.15

  // ── Oscillators ───────────────────────────────────────────────────────────
  // Main oscillator — frequency set on noteOn / setFrequency; start at 1 Hz placeholder
  const osc = context.createOscillator({ type: 'sawtooth', frequency: 1 })

  // LFO — internal sine oscillator that modulates filter cutoff
  const lfo = context.createOscillator({ type: 'sine', frequency: lfoRateHz })

  // ── Signal chain ──────────────────────────────────────────────────────────
  const filter     = context.createFilter({ type: 'lowpass', frequency: filterBase, Q: filterQ })
  const vca        = context.createGain({ gain: 0 })
  const outputGain = context.createGain({ gain: props?.gain ?? 0.8 })

  // Main audio path: osc → filter → vca → outputGain
  osc.connect(filter)
  filter.connect(vca)
  vca.connect(outputGain)

  // LFO modulation path: lfo → lfoGain → filter.frequencyParam (AudioParam modulation)
  // lfoGain scales the ±1 sine output to ±lfoDepth Hz of frequency deviation
  const lfoGain = context.createGain({ gain: lfoDepth })
  lfo.connect(lfoGain)
  filter.frequencyParam.connectModulator(lfoGain)

  // HARDWARE BOUNDARY — started flag: one-way transition, const-bound mutable object
  const oscState: OscState = { started: false }

  // ── noteOn ────────────────────────────────────────────────────────────────
  const noteOn = (freq: number, time?: number): void => {
    const t = time ?? context.currentTime
    osc.setFrequency(freq, t)
    if (!oscState.started) {
      osc.start(t)
      lfo.start(t)
      oscState.started = true
    }
    // Amp ADSR: attack → decay → hold at sustain (release on noteOff)
    vca.scheduleEnvelope({
      peak:      1.0,
      attack:    ampAttack,
      decay:     ampDecay,
      sustain:   ampSustain,
      release:   0,
      startTime: t,
      duration:  ampAttack + ampDecay + 9999,
    })
  }

  // ── noteOff ───────────────────────────────────────────────────────────────
  const noteOff = (time?: number): void => {
    const t = time ?? context.currentTime
    // Amp release: ramp from sustain to 0
    vca.scheduleEnvelope({
      peak:      ampSustain,
      attack:    0,
      decay:     ampRelease,
      sustain:   0,
      release:   0,
      startTime: t,
      duration:  ampRelease,
    })
    const stopTime = t + ampRelease + 0.05
    osc.stop(stopTime)
    lfo.stop(stopTime)
  }

  const component: WobbleBassComponent = {
    id:   uid('wobble'),
    type: 'wobble' as const,
    noteOn,
    noteOff,

    setFrequency: (freq: number, time?: number) => {
      osc.setFrequency(freq, time)
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
      try { osc.stop()        } catch { /* already stopped */ }
      try { lfo.stop()        } catch { /* already stopped */ }
      try { osc.disconnect()  } catch { /* already disconnected */ }
      try { lfo.disconnect()  } catch { /* already disconnected */ }
      try { lfoGain.disconnect()    } catch { /* already disconnected */ }
      try { filter.disconnect()     } catch { /* already disconnected */ }
      try { vca.disconnect()        } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
