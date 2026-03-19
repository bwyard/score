// Sidechain effect — sidechain compression that ducks audio when source signal is loud
// Uses a compressor internally, source is the key signal (e.g., kick drum)

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendNode, BackendCompressorNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for {@link createSidechain}.
 *
 * The `source` signal (typically a kick drum) triggers the compressor —
 * the louder the source, the more the through-signal is ducked.
 * This creates the classic "pumping" sound of house and techno.
 */
export type SidechainProps = {
  /** The key signal that triggers compression — usually a kick drum output node. */
  readonly source: BackendNode
  /** Compression threshold in dBFS. Ducking begins above this level. Default `-30`. */
  readonly threshold?: number
  /** Compression ratio. Higher values = more aggressive ducking. Default `10`. */
  readonly ratio?: number
  /** Attack time in seconds. Shorter = faster ducking onset. Default `0.005` (5ms). */
  readonly attack?: number
  /** Release time in seconds. Shorter = faster recovery after the kick. Default `0.1`. */
  readonly release?: number
}

/**
 * Create a sidechain compressor for the classic "pumping" ducking effect.
 * An external source signal (the kick) triggers compression on the through-signal
 * (the bass, pad, or entire mix). Fundamental to house, techno, and EDM production.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Sidechain configuration. `source` is required — the trigger signal.
 * @returns AudioComponent that ducks when the `source` is loud.
 *
 * @example
 * ```ts
 * // Classic four-on-the-floor pump — kick ducks the bass
 * const kickOut = kick.connect(context.destination) // route kick to destination AND...
 * const sidechain = createSidechain(context, {
 *   source: kickNode,
 *   threshold: -30,
 *   ratio: 10,
 *   attack: 0.005,
 *   release: 0.1,
 * })
 * bass.connect(sidechain).connect(context.destination)
 * ```
 *
 * @see {@link createCompressor} — for regular (non-sidechain) compression
 * @see {@link createGate} — for noise-gating below a threshold
 */
export const createSidechain = (
  context: ScoreAudioContext,
  props: SidechainProps,
) => {
  const compNode: BackendCompressorNode = context.createCompressor({
    threshold: props.threshold ?? -30,
    ratio: props.ratio ?? 10,
    knee: 0,
    attack: props.attack ?? 0.005,
    release: props.release ?? 0.1,
  })

  // The source signal feeds into the compressor to trigger ducking
  // The audio to be ducked also passes through the compressor
  props.source.connect(compNode)

  const component: AudioComponent = {
    id: uid('sidechain'),
    type: 'sidechain' as const,
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
      try { props.source.disconnect(compNode) } catch { /* already disconnected */ }
      try { compNode.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
