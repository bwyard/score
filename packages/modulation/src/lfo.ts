// LFO — Low Frequency Oscillator modulation source
// Connect to any BackendAudioParam to modulate filter frequency, gain, or pan over time

import type { BackendContext, BackendAudioParam } from '@score/core'
import { uid, ScoreError } from '@score/core'

/**
 * LFO waveform shape — controls the modulation curve character.
 *
 * - `'sine'` — smooth, organic sweeps. Most common for filter and vibrato.
 * - `'triangle'` — linear up/down ramp. Cleaner than sine, no curved peaks.
 * - `'square'` — hard on/off gating. Useful for tremolo and rhythmic effects.
 * - `'sawtooth'` — linear rise then instant drop. Good for one-shot ramp shapes.
 */
export type LFOShape = 'sine' | 'triangle' | 'square' | 'sawtooth'

/**
 * Configuration for {@link createLFO}.
 */
export type LFOProps = {
  /** LFO rate in Hz. `0.1` = glacial sweep, `0.5` = slow wobble, `5` = fast tremolo. Default `0.5`. */
  readonly rate?: number
  /** LFO waveform shape. Controls the modulation curve. Default `'sine'`. */
  readonly shape?: LFOShape
  /** Modulation depth — amplitude of the LFO output signal. Default `100`. */
  readonly depth?: number
}

/**
 * Return type of {@link createLFO}.
 */
export type LFOComponent = {
  /** Unique component ID. */
  readonly id: string
  /** Component type identifier. */
  readonly type: 'lfo'
  /**
   * Connect this LFO to a modulatable audio parameter.
   * @param param - The target audio parameter to modulate (e.g. `filter.frequencyParam`).
   */
  readonly connect: (param: BackendAudioParam) => void
  /**
   * Disconnect the LFO from its current targets and stop modulating.
   * @returns This component for chaining.
   */
  readonly disconnect: () => LFOComponent
  /** Stop the LFO oscillator and release all audio nodes. */
  readonly dispose: () => void
  /**
   * Change the LFO rate at runtime.
   * @param hz - New rate in Hz. Uses a 10ms linear ramp to avoid clicks.
   * @param time - Optional schedule time. Defaults to `context.currentTime`.
   */
  readonly setRate: (hz: number, time?: number) => void
  /**
   * Change the modulation depth at runtime.
   * @param depth - New amplitude value for the LFO output signal.
   * @param time - Optional schedule time.
   */
  readonly setDepth: (depth: number, time?: number) => void
  /**
   * Change the LFO waveform shape.
   * @param shape - New waveform shape.
   * @remarks Web Audio API does not allow oscillator type changes after start.
   * This method is a no-op — dispose and recreate the LFO to change shape.
   */
  readonly setShape: (shape: LFOShape) => void
}

/**
 * Create an LFO (Low Frequency Oscillator) modulation source.
 * Connect to any {@link BackendAudioParam} to modulate filter frequency, gain, or pan continuously over time.
 *
 * The LFO outputs an audio-rate signal centred at zero, scaled by `depth`.
 * When connected to a filter frequency param set to `1000Hz` with `depth: 200`,
 * the filter sweeps between `800Hz` and `1200Hz` at the given rate.
 *
 * @param context - Backend audio context.
 * @param props - LFO configuration — rate, shape, and depth.
 * @returns LFO component with `connect(param)` to wire modulation targets, plus runtime controls.
 *
 * @example
 * ```ts
 * import { createLFO } from '@score/modulation'
 *
 * // Slow filter sweep on a bass synth
 * const lfo = createLFO(context, { rate: 0.3, shape: 'sine', depth: 800 })
 * const filter = context.createFilter({ type: 'lowpass', frequency: 1000 })
 * lfo.connect(filter.frequencyParam)  // filter sweeps 200–1800Hz at 0.3Hz
 *
 * // Fast tremolo on a pad
 * const tremolo = createLFO(context, { rate: 4, shape: 'sine', depth: 0.4 })
 * const gainNode = context.createGain({ gain: 1.0 })
 * tremolo.connect(gainNode.gainParam)
 * ```
 *
 * @see {@link createADSR} — for one-shot envelope modulation
 * @throws {ScoreError} If `rate` is negative.
 */
export const createLFO = (
  context: BackendContext,
  props?: LFOProps,
): LFOComponent => {
  const rate = props?.rate ?? 0.5
  const depth = props?.depth ?? 100
  const shape = props?.shape ?? 'sine'

  if (rate < 0) {
    throw ScoreError('LFO rate must be non-negative', {
      received: `rate: ${String(rate)}`,
      fix: 'Use a positive rate value in Hz (e.g. 0.5 for a slow sweep)',
      docs: 'https://score.dev/docs/modulation/lfo',
    })
  }

  const osc = context.createOscillator({ type: shape, frequency: rate })
  const depthGain = context.createGain({ gain: depth })

  osc.connect(depthGain)
  osc.start()

  const MIN_RAMP = 0.01

  const component: LFOComponent = {
    id: uid('lfo'),
    type: 'lfo' as const,

    connect: (param: BackendAudioParam) => {
      param.connectModulator(depthGain)
    },

    setRate: (hz: number, time?: number) => {
      const t = time ?? context.currentTime
      osc.setFrequency(hz, t + MIN_RAMP)
    },

    setDepth: (d: number, time?: number) => {
      depthGain.setGain(d, time)
    },

    setShape: (_shape: LFOShape) => {
      // OscillatorNode type cannot be changed after start in Web Audio API.
      // Shape changes require dispose() + recreate the LFO.
      // This is a known Web Audio limitation — no-op intentionally.
    },

    disconnect: () => {
      try { depthGain.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      try { osc.stop() } catch { /* already stopped */ }
      try { osc.disconnect() } catch { /* already disconnected */ }
      try { depthGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
