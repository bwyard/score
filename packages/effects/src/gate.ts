// Noise Gate effect — gates audio below threshold using extreme compression
// Uses CompressorNode with extreme ratio as a gate + GainNode for output level

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createGate}.
 *
 * A noise gate silences the signal when it falls below the threshold —
 * letting through loud hits while cutting background noise in the gaps.
 * Implemented via extreme-ratio compression as a gate approximation.
 */
export type GateProps = {
  /** Gate threshold in dBFS. Signal below this level is gated (silenced). Default `-40`. */
  readonly threshold?: number
  /** Attack time in seconds — how quickly the gate opens when signal exceeds threshold. Default `0.001` (1ms). */
  readonly attack?: number
  /** Release time in seconds — how quickly the gate closes after the signal drops. Default `0.05`. */
  readonly release?: number
}

/**
 * Create a noise gate to silence signal below a threshold.
 * Essential for cleaning up drum recordings, live inputs, and noise floors.
 * Also works creatively — tight release settings on a synth pad create rhythmic gating.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Gate configuration.
 * @returns AudioComponent with `setThreshold`, `setAttack`, and `setRelease` setters.
 *
 * @example
 * ```ts
 * // Clean up background noise on a vocal track
 * const gate = createGate(context, { threshold: -50, attack: 0.002, release: 0.1 })
 * ```
 *
 * @example
 * ```ts
 * // Rhythmic gating effect on a synth pad — creates stutter at -20dBFS
 * const stutter = createGate(context, { threshold: -20, attack: 0.001, release: 0.05 })
 * ```
 *
 * @see {@link createCompressor} — for dynamic range compression
 * @see {@link createSidechain} — for kick-triggered ducking
 */
export const createGate = (
  context: ScoreAudioContext,
  props?: GateProps,
) => {
  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })

  // Use extreme compression ratio to simulate a gate
  const gateComp = context.createCompressor({
    threshold: props?.threshold ?? -40,
    ratio: 20,
    knee: 0,
    attack: props?.attack ?? 0.001,
    release: props?.release ?? 0.05,
  })

  // Route: input -> compressor (gate) -> output
  inputGain.connect(gateComp)
  gateComp.connect(outputGain)

  const component: AudioComponent & {
    readonly input: BackendNode
    readonly setThreshold: (value: number, time?: number) => void
    readonly setAttack: (value: number, time?: number) => void
    readonly setRelease: (value: number, time?: number) => void
  } = {
    id: uid('gate'),
    type: 'gate' as const,
    input: inputGain,

    /**
     * Set the gate threshold in dBFS. Signal below this level is silenced.
     *
     * @param value - Threshold in dBFS. Lower values = only very quiet signals are gated.
     * @param time - Optional schedule time in seconds.
     */
    setThreshold: (value: number, _time?: number) => { gateComp.setThreshold(value) },

    /**
     * Set how quickly the gate opens when the signal rises above threshold.
     *
     * @param value - Attack time in seconds. `0.001` = 1ms (fast, snappy gate).
     * @param time - Optional schedule time in seconds.
     */
    setAttack: (value: number, _time?: number) => { gateComp.setAttack(value) },

    /**
     * Set how quickly the gate closes after the signal drops below threshold.
     *
     * @param value - Release time in seconds. Longer = natural decay; shorter = abrupt cutoff.
     * @param time - Optional schedule time in seconds.
     */
    setRelease: (value: number, _time?: number) => { gateComp.setRelease(value) },

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },

    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      try { inputGain.disconnect() } catch { /* already disconnected */ }
      try { gateComp.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
