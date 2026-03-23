import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Amp ADSR envelope parameters for {@link createFMSynth}.
 */
export type FMSynthAmpAdsr = {
  /** Attack time in seconds. Default `0.01`. */
  readonly attack?: number
  /** Decay time in seconds. Default `0.2`. */
  readonly decay?: number
  /** Sustain level 0–1. Default `0.7`. */
  readonly sustain?: number
  /** Release time in seconds. Default `0.4`. */
  readonly release?: number
}

/**
 * Modulator ADSR envelope parameters for {@link createFMSynth}.
 * Controls modulation depth over time (shapes timbre evolution).
 */
export type FMSynthModAdsr = {
  /** Attack time in seconds. Default `0.005`. */
  readonly attack?: number
  /** Decay time in seconds. Default `0.3`. */
  readonly decay?: number
  /** Sustain level as fraction of peak mod depth (0–1). Default `1.0`. */
  readonly sustain?: number
  /** Release time in seconds. Default `0.2`. */
  readonly release?: number
}

/**
 * Configuration props for {@link createFMSynth}.
 */
export type FMSynthProps = {
  /** Carrier frequency in Hz. Default `220`. */
  readonly frequency?: number
  /**
   * Modulator-to-carrier frequency ratio. Non-integer produces inharmonic (metallic) character.
   * Default `1.273` (DX7 Rhodes / metallic).
   */
  readonly modRatio?: number
  /**
   * Modulation index — peak frequency deviation as a multiplier of carrier frequency.
   * At `modIndex=3` and 220 Hz carrier, peak deviation = ±660 Hz.
   * Default `3`.
   */
  readonly modIndex?: number
  /** Amplitude VCA ADSR envelope. See {@link FMSynthAmpAdsr}. */
  readonly ampAdsr?: FMSynthAmpAdsr
  /** Modulation depth ADSR envelope. See {@link FMSynthModAdsr}. */
  readonly modAdsr?: FMSynthModAdsr
  /** Output gain 0–1. Default `0.7`. */
  readonly gain?: number
}

/**
 * A 2-operator FM synthesis instrument component — extends {@link AudioComponent}
 * with note-on / note-off. Suitable for DX7-style Rhodes, electric pianos, and
 * techno leads.
 *
 * Signal path:
 * - **Modulator** sine → modIndex gain (ADSR) → carrier.frequencyParam
 * - **Carrier** sine → amp VCA (ADSR) → output gain → (caller connects output)
 */
export type FMSynthComponent = AudioComponent & {
  /**
   * Gate a note on: start both oscillators and trigger attack-decay-sustain phase
   * on both the amp VCA and the mod-index gain.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOn: (time?: number) => void
  /**
   * Gate a note off: trigger release phase on both envelopes and schedule oscillator stop.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOff: (time?: number) => void
  /**
   * Set the carrier (and derived modulator) frequency in Hz.
   * @param value - Target frequency in Hz.
   * @param time - Optional schedule time.
   */
  readonly setFrequency: (value: number, time?: number) => void
  /**
   * Set the output gain.
   * @param value - Gain 0–1.
   * @param time - Optional schedule time.
   */
  readonly setGain: (value: number, time?: number) => void
}

/**
 * Create a 2-operator FM synthesis instrument component.
 *
 * Signal path:
 * ```
 * modulator sine → modIndex gain (ADSR) → carrier.frequencyParam
 * carrier sine → amp VCA (ADSR) → output gain → (caller connects output)
 * ```
 *
 * The modulator uses a non-integer ratio (default 1.273) for inharmonic/metallic character.
 * Modulation index controls peak frequency deviation: `noteFreq × modIndex` Hz at peak.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param props - Optional FM synth configuration. If omitted all defaults apply.
 * @returns A {@link FMSynthComponent} with `id` prefixed `fmsynth` and `type` set to `'fmsynth'`.
 *
 * @example
 * ```ts
 * // DX7 Rhodes voice at A3
 * const rhodes = createFMSynth(context, {
 *   frequency: 220,
 *   modRatio: 1.273,
 *   modIndex: 3,
 *   ampAdsr: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.4 },
 * })
 * rhodes.connect(context.destination)
 * rhodes.noteOn(context.currentTime)
 * rhodes.noteOff(context.currentTime + 1.0)
 * rhodes.dispose()
 * ```
 *
 * @see {@link FMSynthProps} — configuration options
 * @see {@link FMSynthComponent} — returned component shape
 * @throws ScoreError Never — invalid props are silently clamped.
 */
export const createFMSynth = (
  context: ScoreAudioContext,
  props?: FMSynthProps,
): FMSynthComponent => {
  const noteFreq = props?.frequency ?? 220
  const modRatio = props?.modRatio  ?? 1.273
  const modIndex = props?.modIndex  ?? 3

  const ampAdsrCfg = props?.ampAdsr ?? {}
  const ampAttack  = ampAdsrCfg.attack  ?? 0.01
  const ampDecay   = ampAdsrCfg.decay   ?? 0.2
  const ampSustain = ampAdsrCfg.sustain ?? 0.7
  const ampRelease = ampAdsrCfg.release ?? 0.4

  const modAdsrCfg = props?.modAdsr ?? {}
  const modAttack  = modAdsrCfg.attack  ?? 0.005
  const modDecay   = modAdsrCfg.decay   ?? 0.3
  const modSustain = modAdsrCfg.sustain ?? 1.0
  const modRelease = modAdsrCfg.release ?? 0.2

  // Peak mod deviation in Hz: noteFreq × modIndex
  const modPeak = noteFreq * modIndex

  // Create oscillators
  const carrier   = context.createOscillator({ type: 'sine', frequency: noteFreq })
  const modulator = context.createOscillator({ type: 'sine', frequency: noteFreq * modRatio })

  // Modulator path: modulator → modGain (ADSR) → carrier.frequencyParam
  // modGain starts at 0; noteOn triggers the ADSR to ramp up to modPeak
  const modGain = context.createGain({ gain: 0 })

  // Amp path: carrier → ampVca (ADSR) → outputGain
  const ampVca     = context.createGain({ gain: 0 })
  const outputGain = context.createGain({ gain: props?.gain ?? 0.7 })

  // Wire modulator path: modulator → modGain; modGain → carrier.frequencyParam via connectModulator
  modulator.connect(modGain)
  carrier.frequencyParam.connectModulator(modGain)

  // Wire carrier/amp path: carrier → ampVca → outputGain
  carrier.connect(ampVca)
  ampVca.connect(outputGain)

  const startRef = { value: false }

  const noteOn = (time?: number): void => {
    const t = time ?? context.currentTime
    if (!startRef.value) {
      modulator.start(t)
      carrier.start(t)
      startRef.value = true
    }
    // Modulation index ADSR — peak = noteFreq × modIndex
    modGain.scheduleEnvelope({
      peak: modPeak,
      attack: modAttack,
      decay: modDecay,
      sustain: modSustain,
      release: 0,
      startTime: t,
      duration: modAttack + modDecay + 9999,
    })
    // Amp VCA ADSR
    ampVca.scheduleEnvelope({
      peak: 1.0,
      attack: ampAttack,
      decay: ampDecay,
      sustain: ampSustain,
      release: 0,
      startTime: t,
      duration: ampAttack + ampDecay + 9999,
    })
  }

  const noteOff = (time?: number): void => {
    const t = time ?? context.currentTime
    const releaseEnd = Math.max(ampRelease, modRelease)
    // Mod envelope release — from sustain fraction of peak down to 0
    modGain.scheduleEnvelope({
      peak: modPeak * modSustain,
      attack: 0,
      decay: modRelease,
      sustain: 0,
      release: 0,
      startTime: t,
      duration: modRelease,
    })
    // Amp VCA release
    ampVca.scheduleEnvelope({
      peak: ampSustain,
      attack: 0,
      decay: ampRelease,
      sustain: 0,
      release: 0,
      startTime: t,
      duration: ampRelease,
    })
    carrier.stop(t + releaseEnd + 0.05)
    modulator.stop(t + releaseEnd + 0.05)
  }

  const component: FMSynthComponent = {
    id:   uid('fmsynth'),
    type: 'fmsynth' as const,
    noteOn,
    noteOff,

    setFrequency: (value: number, time?: number) => {
      carrier.setFrequency(value, time)
      modulator.setFrequency(value * modRatio, time)
    },

    setGain: (value: number, time?: number) => { outputGain.setGain(value, time) },

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },

    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      try { carrier.stop()      } catch { /* already stopped */ }
      try { modulator.stop()    } catch { /* already stopped */ }
      try { carrier.disconnect()    } catch { /* already disconnected */ }
      try { modulator.disconnect()  } catch { /* already disconnected */ }
      try { modGain.disconnect()    } catch { /* already disconnected */ }
      try { ampVca.disconnect()     } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
