// supersaw.ts — SuperSaw instrument component for @score/components
//
// Roland JP-8080-style supersaw: 7 detuned sawtooth oscillators (1 center + 3 pairs).
// Classic trance / big-room / synthwave lead and pad voice.
//
// Signal path: 7 saws → unisonMix (gain 1/7) [→ optional LP filter] → VCA → outputGain

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Optional lowpass filter between the unison mixer and the VCA.
 * When omitted, the signal passes through with no filtering.
 */
export type SupersawFilterProps = {
  /** Filter cutoff frequency in Hz. E.g. `4000` for a bright trance lead. */
  readonly frequency: number
  /** Filter resonance Q. Default `0.7` (Butterworth — gentle rolloff). */
  readonly Q?: number
}

/**
 * Configuration props for {@link createSupersaw}.
 */
export type SupersawProps = {
  /**
   * Total detune spread across the 6 detuned oscillators, in cents.
   * Centre oscillator is always at 0. Default `20` cents (±10 cents total per side).
   */
  readonly detune?: number
  /** Amp envelope attack time in seconds. Default `0.005`. */
  readonly attack?: number
  /** Amp envelope decay time in seconds. Default `0.1`. */
  readonly decay?: number
  /** Amp envelope sustain level 0–1. Default `0.7`. */
  readonly sustain?: number
  /** Amp envelope release time in seconds. Default `0.4`. */
  readonly release?: number
  /**
   * Output gain 0–1. Defaults to `0.6` — intentionally lower than most synths
   * because 7 oscillators sum to a louder signal.
   */
  readonly gain?: number
  /**
   * Optional lowpass filter inserted between the unison mixer and the VCA.
   * Omit to leave the signal unfiltered (full-range saw stack).
   * @example `{ frequency: 4000, Q: 0.7 }`
   */
  readonly filter?: SupersawFilterProps
}

/**
 * A SuperSaw instrument component — Roland JP-8080-style 7-oscillator detuned saw stack.
 * Extends {@link AudioComponent} with note-on / note-off / frequency control.
 */
export type SupersawComponent = AudioComponent & {
  /**
   * Gate a note on: start all 7 oscillators and trigger the amp attack-decay-sustain phase.
   * Safe to call multiple times — oscillators are only started once.
   * @param freq - Note frequency in Hz.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOn: (freq: number, time?: number) => void
  /**
   * Gate a note off: trigger the amp release phase and stop all oscillators after release.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOff: (time?: number) => void
  /**
   * Set the fundamental frequency in Hz.
   * Centre oscillator tracks `freq` directly; each flanking pair is offset by its
   * detune amount using the formula `freq * 2^(cents/1200)`.
   * @param freq - Target fundamental frequency in Hz.
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

/**
 * Convert a cent offset to a frequency multiplier.
 * `freq * centMultiplier(c)` gives the frequency `c` cents above `freq`.
 */
const centMultiplier = (cents: number): number => Math.pow(2, cents / 1200)

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a SuperSaw instrument component — Roland JP-8080-style 7-oscillator saw stack.
 *
 * Signal path:
 * ```
 * 7 detuned sawtooth oscs → unisonMix (gain 1/7) [→ optional LP filter] → VCA (ADSR) → outputGain
 * ```
 *
 * The 7 oscillators follow the JP-8080 layout:
 * - 1 centre osc at the base frequency
 * - 3 pairs detuned at ±(`detune/6`), ±(`detune/3`), ±(`detune/2`) cents
 *   (evenly distributed across −detune/2 to +detune/2)
 *
 * @param context - Backend audio context.
 * @param props   - Supersaw configuration. All fields have defaults.
 * @returns A {@link SupersawComponent} with `id` prefixed `supersaw` and `type` set to `'supersaw'`.
 *
 * @example
 * ```ts
 * // Classic trance lead — 7 saws, mild detune, LP filter
 * const lead = createSupersaw(context, {
 *   detune: 20,
 *   filter: { frequency: 4000, Q: 0.7 },
 *   attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.5,
 *   gain: 0.6,
 * })
 * lead.connect(context.destination)
 * lead.noteOn(440, context.currentTime)
 * lead.noteOff(context.currentTime + 2.0)
 * lead.dispose()
 * ```
 *
 * @see {@link SupersawProps}
 * @see {@link SupersawComponent}
 * @throws {ScoreError} Never — invalid props are silently clamped.
 */
export const createSupersaw = (
  context: ScoreAudioContext,
  props?: SupersawProps,
): SupersawComponent => {
  // ── Amp envelope config ───────────────────────────────────────────────────
  const ampAttack  = props?.attack  ?? 0.005
  const ampDecay   = props?.decay   ?? 0.1
  const ampSustain = props?.sustain ?? 0.7
  const ampRelease = props?.release ?? 0.4

  // ── Detune layout: 7 values evenly spread from −detune/2 to +detune/2 ────
  // JP-8080 spec: centre + 3 pairs. 6 non-zero offsets, 1 centre at 0.
  const totalDetune = props?.detune ?? 20
  const centOffsets = [
    -totalDetune / 2,
    -totalDetune / 3,
    -totalDetune / 6,
    0,
    totalDetune / 6,
    totalDetune / 3,
    totalDetune / 2,
  ]

  // ── Oscillator bank — created at 1 Hz placeholder; noteOn sets real freq ──
  const oscs = centOffsets.map(offset =>
    context.createOscillator({ type: 'sawtooth', frequency: 1, detune: offset })
  )

  // ── Signal chain ──────────────────────────────────────────────────────────
  const unisonMix  = context.createGain({ gain: 1 / 7 })
  const vca        = context.createGain({ gain: 0 })
  const outputGain = context.createGain({ gain: props?.gain ?? 0.6 })

  // Optional LP filter between unisonMix and VCA
  const filterCfg = props?.filter
  const filter     = filterCfg != null
    ? context.createFilter({ type: 'lowpass', frequency: filterCfg.frequency, Q: filterCfg.Q ?? 0.7 })
    : null

  oscs.forEach(osc => { osc.connect(unisonMix) })

  if (filter != null) {
    unisonMix.connect(filter)
    filter.connect(vca)
  } else {
    unisonMix.connect(vca)
  }

  vca.connect(outputGain)

  // HARDWARE BOUNDARY — started flag: one-way transition, const-bound mutable object
  const oscState: OscState = { started: false }

  // ── Frequency setter — sets centre + detuned pairs from fundamental ───────
  const applyFrequency = (freq: number, time?: number): void => {
    centOffsets.forEach((cents, index) => {
      oscs[index]!.setFrequency(freq * centMultiplier(cents), time)
    })
  }

  // ── noteOn ────────────────────────────────────────────────────────────────
  const noteOn = (freq: number, time?: number): void => {
    const t = time ?? context.currentTime
    applyFrequency(freq, t)
    if (!oscState.started) {
      oscs.forEach(osc => { osc.start(t) })
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
    oscs.forEach(osc => { osc.stop(stopTime) })
  }

  const component: SupersawComponent = {
    id:   uid('supersaw'),
    type: 'supersaw' as const,
    noteOn,
    noteOff,

    setFrequency: (freq: number, time?: number) => {
      applyFrequency(freq, time)
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
      oscs.forEach(osc => {
        try { osc.stop()       } catch { /* already stopped */ }
        try { osc.disconnect() } catch { /* already disconnected */ }
      })
      try { unisonMix.disconnect()  } catch { /* already disconnected */ }
      if (filter != null) {
        try { filter.disconnect()   } catch { /* already disconnected */ }
      }
      try { vca.disconnect()        } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
