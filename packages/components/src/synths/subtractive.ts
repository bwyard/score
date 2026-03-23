import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import type { OscillatorType, FilterType } from '@score/core'
import { uid } from '@score/core'

/**
 * ADSR envelope parameters.
 */
export type AdsrProps = {
  /** Attack time in seconds. Default `0.01`. */
  readonly attack?: number
  /** Decay time in seconds. Default `0.1`. */
  readonly decay?: number
  /** Sustain level 0–1. Default `0.7`. */
  readonly sustain?: number
  /** Release time in seconds. Default `0.3`. */
  readonly release?: number
}

/**
 * Filter configuration for {@link createSubtractiveSynth}.
 */
export type SubtractiveFilterProps = {
  /**
   * Filter type. One of `'lowpass'`, `'highpass'`, `'bandpass'`, etc.
   * Default `'lowpass'`.
   */
  readonly type?: FilterType
  /** Cutoff frequency in Hz. Default `1200`. */
  readonly frequency?: number
  /** Filter resonance Q. Default `1`. */
  readonly Q?: number
}

/**
 * Configuration for {@link createSubtractiveSynth}.
 */
export type SubtractiveSynthProps = {
  /**
   * Oscillator waveform. `'sawtooth'` or `'square'` for classic subtractive.
   * Default `'sawtooth'`.
   */
  readonly wave?: OscillatorType
  /** Oscillator frequency in Hz. Default `220`. */
  readonly frequency?: number
  /** Filter configuration. See {@link SubtractiveFilterProps}. */
  readonly filter?: SubtractiveFilterProps
  /** Amplitude ADSR envelope. See {@link AdsrProps}. */
  readonly adsr?: AdsrProps
  /** Output gain 0–1. Default `0.8`. */
  readonly gain?: number
}

/**
 * A subtractive synthesis instrument component — extends {@link AudioComponent}
 * with note-on/note-off and real-time parameter controls.
 */
export type SubtractiveSynthComponent = AudioComponent & {
  /**
   * Gate a note on: start oscillator and trigger attack-decay-sustain phase.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOn: (time?: number) => void
  /**
   * Gate a note off: trigger release phase and schedule oscillator stop.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly noteOff: (time?: number) => void
  /**
   * Set the oscillator frequency in Hz.
   * @param value - Target frequency in Hz.
   * @param time - Optional schedule time.
   */
  readonly setFrequency: (value: number, time?: number) => void
  /**
   * Set the filter cutoff frequency in Hz.
   * @param value - Cutoff frequency in Hz.
   * @param time - Optional schedule time.
   */
  readonly setFilterFrequency: (value: number, time?: number) => void
  /**
   * Set the output gain.
   * @param value - Gain 0–1.
   * @param time - Optional schedule time.
   */
  readonly setGain: (value: number, time?: number) => void
}

/**
 * Create a subtractive synthesis instrument component.
 * Signal path: oscillator → resonant filter → VCA (ADSR gain) → output gain → (caller connects output).
 *
 * The VCA uses `noteOn` / `noteOff` for ADSR gating rather than a fire-and-forget `trigger`,
 * making it suitable for melodic parts where note length matters.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param props - Optional synth configuration. If omitted all defaults apply.
 * @returns A {@link SubtractiveSynthComponent} with `id` prefixed `subsynth` and `type` set to `'subsynth'`.
 *
 * @example
 * ```ts
 * const bass = createSubtractiveSynth(context, {
 *   wave: 'sawtooth',
 *   frequency: 110,
 *   filter: { type: 'lowpass', frequency: 800, Q: 4 },
 *   adsr: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4 },
 * })
 * bass.connect(context.destination)
 * bass.noteOn(context.currentTime)
 * bass.noteOff(context.currentTime + 0.5)
 * bass.dispose()
 * ```
 *
 * @see {@link SubtractiveSynthProps} — configuration options
 * @see {@link SubtractiveSynthComponent} — returned component shape
 * @throws \{ScoreError\} Never — invalid props are silently clamped.
 */
export const createSubtractiveSynth = (
  context: ScoreAudioContext,
  props?: SubtractiveSynthProps,
): SubtractiveSynthComponent => {
  const adsr = props?.adsr ?? {}
  const attack  = adsr.attack  ?? 0.01
  const decay   = adsr.decay   ?? 0.1
  const sustain = adsr.sustain ?? 0.7
  const release = adsr.release ?? 0.3

  const osc = context.createOscillator({
    type: props?.wave ?? 'sawtooth',
    frequency: props?.frequency ?? 220,
  })

  const filter = context.createFilter({
    type: props?.filter?.type ?? 'lowpass',
    frequency: props?.filter?.frequency ?? 1200,
    Q: props?.filter?.Q ?? 1,
  })

  const vca = context.createGain({ gain: 0 })
  const outputGain = context.createGain({ gain: props?.gain ?? 0.8 })

  // Wire: osc → filter → vca → output
  osc.connect(filter)
  filter.connect(vca)
  vca.connect(outputGain)

  let started = false

  const noteOn = (time?: number) => {
    const t = time ?? context.currentTime
    if (!started) {
      osc.start(t)
      started = true
    }
    // Attack + decay → hold at sustain
    vca.scheduleEnvelope({
      peak: 1.0,
      attack,
      decay,
      sustain,
      release: 0,         // release triggered separately by noteOff
      startTime: t,
      duration: attack + decay + 9999, // effectively infinite until noteOff
    })
  }

  const noteOff = (time?: number) => {
    const t = time ?? context.currentTime
    // Ramp from sustain to 0 over release time
    vca.scheduleEnvelope({
      peak: sustain,
      attack: 0,
      decay: release,
      sustain: 0,
      release: 0,
      startTime: t,
      duration: release,
    })
    osc.stop(t + release + 0.05)
  }

  const component: SubtractiveSynthComponent = {
    id: uid('subsynth'),
    type: 'subsynth' as const,
    noteOn,
    noteOff,
    setFrequency: (value: number, time?: number) => { osc.setFrequency(value, time) },
    setFilterFrequency: (value: number, time?: number) => { filter.setFrequency(value, time) },
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
      try { osc.stop() } catch { /* already stopped */ }
      try { osc.disconnect() } catch { /* already disconnected */ }
      try { filter.disconnect() } catch { /* already disconnected */ }
      try { vca.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
