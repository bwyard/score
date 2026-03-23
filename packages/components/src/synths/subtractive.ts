import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import type { OscillatorType, FilterType } from '@score/core'
import { uid } from '@score/core'

/**
 * ADSR envelope parameters — used for both amp and filter envelopes.
 */
export type AdsrProps = {
  /** Attack time in seconds. Default varies by envelope target. */
  readonly attack?: number
  /** Decay time in seconds. */
  readonly decay?: number
  /** Sustain level 0–1. */
  readonly sustain?: number
  /** Release time in seconds. */
  readonly release?: number
}

/**
 * Filter configuration for {@link createSubtractiveSynth}.
 */
export type SubtractiveFilterProps = {
  /** Filter type. Default `'lowpass'`. */
  readonly type?: FilterType
  /** Base cutoff frequency in Hz. Default `1200`. */
  readonly frequency?: number
  /** Filter resonance Q. Default `1`. */
  readonly Q?: number
  /**
   * Filter envelope depth in Hz — how far above the base cutoff the envelope peaks.
   * `0` disables filter modulation. Default `800`.
   */
  readonly envDepth?: number
  /** Filter ADSR envelope. Default: attack 0.005, decay 0.3, sustain 0.4, release 0.4. */
  readonly adsr?: AdsrProps
}

/**
 * Configuration for {@link createSubtractiveSynth} — the full Juno-60/Minimoog model.
 */
export type SubtractiveSynthProps = {
  /**
   * Oscillator waveform. `'sawtooth'` or `'square'` for classic subtractive.
   * Default `'sawtooth'`.
   */
  readonly wave?: OscillatorType
  /** Oscillator frequency in Hz. Default `220`. */
  readonly frequency?: number
  /**
   * Detune spread between oscillators in cents (total spread, evenly distributed).
   * At 1 pair: osc A at −detune/2, osc B at +detune/2.
   * Default `8` cents (Juno fatness).
   */
  readonly detune?: number
  /**
   * Number of oscillator pairs to stack. `1` = 2 oscillators, `2` = 4, `4` = 8.
   * Higher values add thickness at the cost of CPU. Default `1`.
   */
  readonly unison?: 1 | 2 | 4
  /** Filter configuration. See {@link SubtractiveFilterProps}. */
  readonly filter?: SubtractiveFilterProps
  /** Amplitude ADSR envelope. Default: attack 0.005, decay 0.1, sustain 0.7, release 0.3. */
  readonly adsr?: AdsrProps
  /** Output gain 0–1. Default `0.7`. */
  readonly gain?: number
}

/**
 * A subtractive synthesis instrument component — Juno-60/Minimoog model.
 *
 * Signal path: N detuned oscillators → unison mixer → resonant filter (filter ADSR)
 * → amp VCA (amp ADSR) → output gain.
 */
export type SubtractiveSynthComponent = AudioComponent & {
  /**
   * Gate a note on: start oscillators, trigger amp + filter attack-decay-sustain.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOn: (time?: number) => void
  /**
   * Gate a note off: trigger amp + filter release, schedule oscillator stop.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOff: (time?: number) => void
  /**
   * Set the oscillator frequency in Hz (all oscillators track together).
   * @param value - Target frequency in Hz.
   * @param time  - Optional schedule time.
   */
  readonly setFrequency: (value: number, time?: number) => void
  /**
   * Set the filter base cutoff frequency in Hz.
   * @param value - Cutoff frequency in Hz.
   * @param time  - Optional schedule time.
   */
  readonly setFilterFrequency: (value: number, time?: number) => void
  /**
   * Set the output gain.
   * @param value - Gain 0–1.
   * @param time  - Optional schedule time.
   */
  readonly setGain: (value: number, time?: number) => void
}

// HARDWARE BOUNDARY — oscillator started state: append-only (false → true, never reset).
// Const-bound mutable object per the no-let rule.
type OscState = { started: boolean }

/**
 * Create a subtractive synthesis instrument — Juno-60/Minimoog model.
 *
 * Signal path: N detuned sawtooth/square oscillators → unison mixer (gain normalised)
 * → resonant lowpass filter with filter ADSR → amp VCA with amp ADSR → output gain.
 *
 * Supports 2/4/8 oscillators (1/2/4 unison pairs), configurable detune spread,
 * and independent filter and amplitude ADSR envelopes.
 *
 * @param context - Backend audio context.
 * @param props   - Synth configuration. All fields have defaults.
 * @returns A {@link SubtractiveSynthComponent} with `id` prefixed `subsynth`.
 *
 * @example
 * ```ts
 * // Juno-style pad — 2 detuned saws, slow filter sweep
 * const pad = createSubtractiveSynth(context, {
 *   wave: 'sawtooth',
 *   frequency: 220,
 *   detune: 12,
 *   filter: { frequency: 600, Q: 3, envDepth: 1200,
 *             adsr: { attack: 0.4, decay: 0.6, sustain: 0.5, release: 0.8 } },
 *   adsr: { attack: 0.3, decay: 0.2, sustain: 0.8, release: 0.8 },
 * })
 * pad.connect(context.destination)
 * pad.noteOn(context.currentTime)
 * pad.noteOff(context.currentTime + 2.0)
 * pad.dispose()
 * ```
 *
 * @see {@link SubtractiveSynthProps}
 * @see {@link SubtractiveSynthComponent}
 * @throws {ScoreError} Never — invalid props are silently clamped.
 */
export const createSubtractiveSynth = (
  context: ScoreAudioContext,
  props?: SubtractiveSynthProps,
): SubtractiveSynthComponent => {
  // ── Amp envelope ──────────────────────────────────────────────────────────
  const ampCfg = props?.adsr ?? {}
  const ampAtk = ampCfg.attack  ?? 0.005
  const ampDec = ampCfg.decay   ?? 0.1
  const ampSus = ampCfg.sustain ?? 0.7
  const ampRel = ampCfg.release ?? 0.3

  // ── Filter config and envelope ────────────────────────────────────────────
  const filterCfg  = props?.filter ?? {}
  const filterBase = filterCfg.frequency ?? 1200
  const filterQ    = filterCfg.Q         ?? 1
  const filterType = filterCfg.type      ?? 'lowpass'
  const envDepth   = filterCfg.envDepth  ?? 800
  const fCfg       = filterCfg.adsr ?? {}
  const fAtk       = fCfg.attack  ?? 0.005
  const fDec       = fCfg.decay   ?? 0.3
  const fSus       = fCfg.sustain ?? 0.4
  const fRel       = fCfg.release ?? 0.4
  // Pre-compute sustain cutoff for release anchor
  const filterSusFreq = filterBase + envDepth * fSus

  // ── Oscillator bank ───────────────────────────────────────────────────────
  const unisonPairs = props?.unison ?? 1
  const oscCount    = unisonPairs * 2
  const totalDetune = props?.detune ?? 8
  const freq        = props?.frequency ?? 220
  const wave        = props?.wave ?? 'sawtooth'

  // Spread N oscillators evenly across [−detune/2, +detune/2] cents
  const detuneOffsets = Array.from({ length: oscCount }, (_, i) => {
    if (oscCount === 1) return 0
    return -totalDetune / 2 + (totalDetune / (oscCount - 1)) * i
  })

  const oscs = detuneOffsets.map(detuneOffset =>
    context.createOscillator({ type: wave, frequency: freq, detune: detuneOffset })
  )

  // ── Signal chain ──────────────────────────────────────────────────────────
  // Normalise unison: divides by oscCount so total loudness stays consistent
  const unisonMix  = context.createGain({ gain: 1 / oscCount })
  const filter     = context.createFilter({ type: filterType, frequency: filterBase, Q: filterQ })
  const vca        = context.createGain({ gain: 0 })
  const outputGain = context.createGain({ gain: props?.gain ?? 0.7 })

  oscs.forEach(osc => { osc.connect(unisonMix); })
  unisonMix.connect(filter)
  filter.connect(vca)
  vca.connect(outputGain)

  // HARDWARE BOUNDARY — started flag: one-way transition, const-bound mutable object
  const oscState: OscState = { started: false }

  const noteOn = (time?: number): void => {
    const t = time ?? context.currentTime
    if (!oscState.started) {
      oscs.forEach(osc => { osc.start(t); })
      oscState.started = true
    }
    // Amp: attack → decay → hold at sustain (release on noteOff)
    vca.scheduleEnvelope({
      peak: 1.0, attack: ampAtk, decay: ampDec, sustain: ampSus,
      release: 0, startTime: t,
      duration: ampAtk + ampDec + 9999, // holds until noteOff triggers release
    })
    // Filter: sweep from base to peak, decay to sustain cutoff
    filter.scheduleFilterEnvelope({
      baseFreq: filterBase, envDepth, sustain: fSus,
      attack: fAtk, decay: fDec, startTime: t,
    })
  }

  const noteOff = (time?: number): void => {
    const t = time ?? context.currentTime
    // Amp release: ramp from sustain to 0
    vca.scheduleEnvelope({
      peak: ampSus, attack: 0, decay: ampRel, sustain: 0,
      release: 0, startTime: t, duration: ampRel,
    })
    // Filter release: ramp from sustain cutoff to base
    filter.scheduleFilterRelease({ sustainFreq: filterSusFreq, baseFreq: filterBase, release: fRel, time: t })
    // Stop oscillators after the longer of amp/filter release
    const stopTime = t + Math.max(ampRel, fRel) + 0.05
    oscs.forEach(osc => { osc.stop(stopTime); })
  }

  const component: SubtractiveSynthComponent = {
    id:   uid('subsynth'),
    type: 'subsynth' as const,
    noteOn,
    noteOff,

    setFrequency: (value: number, time?: number) => {
      oscs.forEach(osc => { osc.setFrequency(value, time); })
    },

    setFilterFrequency: (value: number, time?: number) => {
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
      oscs.forEach(osc => {
        try { osc.stop() } catch { /* already stopped */ }
        try { osc.disconnect() } catch { /* already disconnected */ }
      })
      try { unisonMix.disconnect() }  catch { /* already disconnected */ }
      try { filter.disconnect() }     catch { /* already disconnected */ }
      try { vca.disconnect() }        catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
