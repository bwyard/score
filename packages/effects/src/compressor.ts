// Compressor effect — wraps a backend dynamics compressor node

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendCompressorNode, BackendNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createCompressor}.
 *
 * A dynamics compressor reduces the dynamic range of a signal —
 * loud parts are turned down, giving headroom to push the overall level higher.
 */
export type CompressorProps = {
  /** Threshold in dBFS. Compression starts above this level. Default `-24`. */
  readonly threshold?: number
  /** Compression ratio. `4` means 4:1 — 4dB above threshold produces only 1dB output increase. Default `12`. */
  readonly ratio?: number
  /** Knee width in dB. Larger values create a softer, more gradual onset. Default `30`. */
  readonly knee?: number
  /** Attack time in seconds. How quickly compression engages. Default `0.003` (3ms). */
  readonly attack?: number
  /** Release time in seconds. How quickly compression disengages. Default `0.25`. */
  readonly release?: number
}

/**
 * Create a dynamics compressor for controlling level and adding punch.
 * Essential on the master bus, drum groups, and vocal chains.
 * Hard ratios (8:1+) with fast attack/release = limiting character.
 * Soft ratios (2:1–4:1) with moderate attack = glue compression.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Compressor configuration.
 * @returns AudioComponent with `setThreshold` and `setRatio` setters.
 *
 * @example
 * ```ts
 * // Glue compression on a drum bus — tightens the mix
 * const comp = createCompressor(context, { threshold: -18, ratio: 4, attack: 0.01, release: 0.1 })
 * ```
 *
 * @example
 * ```ts
 * // Punchy parallel compression on kicks
 * const crush = createCompressor(context, { threshold: -30, ratio: 20, attack: 0.001, release: 0.05 })
 * ```
 *
 * @see {@link createLimiter} — for hard ceiling brickwall limiting
 * @see {@link createSidechain} — for kick-triggered ducking (pumping effect)
 * @see {@link createGate} — for noise gate / gating
 */
export const createCompressor = (
  context: ScoreAudioContext,
  props?: CompressorProps,
) => {
  const compNode: BackendCompressorNode = context.createCompressor({
    threshold: props?.threshold ?? -24,
    ratio: props?.ratio ?? 12,
    knee: props?.knee ?? 30,
    attack: props?.attack ?? 0.003,
    release: props?.release ?? 0.25,
  })

  const component: AudioComponent & {
    readonly input: BackendNode
    readonly setThreshold: (value: number, time?: number) => void
    readonly setRatio: (value: number, time?: number) => void
  } = {
    id: uid('compressor'),
    type: 'compressor' as const,
    input: compNode,

    /**
     * Set the compression threshold in dBFS. Signals above this level are compressed.
     *
     * @param value - Threshold in dBFS. Typically `-40` to `0`.
     * @param time - Optional schedule time in seconds.
     */
    setThreshold: (value: number, time?: number) => { compNode.setThreshold(value, time) },

    /**
     * Set the compression ratio. Higher ratios = more aggressive compression.
     *
     * @param value - Ratio (e.g. `4` = 4:1). `20+` approaches hard limiting.
     * @param time - Optional schedule time in seconds.
     */
    setRatio: (value: number, time?: number) => { compNode.setRatio(value, time) },

    connect: (destination: ScoreAudioNode) => {
      compNode.connect(destination)
      return component
    },

    disconnect: () => {
      try {
        compNode.disconnect()
      } catch {
        // Already disconnected
      }
      return component
    },

    dispose: () => {
      try {
        compNode.disconnect()
      } catch {
        // Already disconnected
      }
    },
  }

  return component
}
