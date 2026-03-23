// Effects chain — wires multiple effects in series
// Provides a single AudioComponent interface for a chain of effects

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Create an effects chain that wires multiple `AudioComponent` effects in series.
 * The chain presents a single `AudioComponent` interface — connect it like any other effect.
 * Effects are processed in array order: `effects[0]` receives the input first,
 * `effects[effects.length - 1]` feeds the output.
 *
 * @param context - Backend audio context from the Score engine.
 * @param effects - Ordered array of effects to chain in series. Empty arrays are allowed (passthrough).
 * @returns AudioComponent wrapping the full chain, with an `input` node and `getEffect` accessor.
 *
 * @example
 * ```ts
 * // Classic mastering chain: EQ → compress → limit
 * const master = createEffectsChain(context, [
 *   createEQ(context, { low: 1, mid: -2, high: 2 }),
 *   createCompressor(context, { threshold: -18, ratio: 4 }),
 *   createLimiter(context, { ceiling: -0.3 }),
 * ])
 * master.connect(context.destination)
 * ```
 *
 * @example
 * ```ts
 * // Creative send chain: reverb → delay (reverse-engineered ambient pad)
 * const sendFX = createEffectsChain(context, [
 *   createReverb(context, { decay: 3.0, mix: 0.8 }),
 *   createDelay(context, { time: 0.375, feedback: 0.3 }),
 * ])
 * ```
 *
 * @see {@link createCompressor} — individual dynamics component
 * @see {@link createEQ} — individual EQ component
 * @see {@link createLimiter} — individual limiter component
 */
export const createEffectsChain = (
  context: ScoreAudioContext,
  effects: ReadonlyArray<AudioComponent>,
) => {
  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })

  // Wire effects in series: input -> effect[0] -> effect[1] -> ... -> output
  type EffectNode = AudioComponent & { readonly input: BackendNode }

  const first = effects[0]
  const last = effects[effects.length - 1]
  if (!first || !last) {
    inputGain.connect(outputGain)
  } else {
    inputGain.connect((first as EffectNode).input)
    for (let i = 0; i < effects.length - 1; i++) {
      const current = effects[i]
      const next = effects[i + 1]
      if (current && next) {
        current.connect((next as EffectNode).input)
      }
    }
    last.connect(outputGain)
  }

  const component: AudioComponent & {
    readonly input: BackendNode
    readonly getEffect: (index: number) => AudioComponent | undefined
  } = {
    id: uid('effects-chain'),
    type: 'effects-chain' as const,

    /** The raw input node — connect upstream audio here when building custom routing. */
    input: inputGain,

    /**
     * Retrieve an effect by index for runtime parameter changes.
     *
     * @param index - Zero-based position in the effects array.
     * @returns The `AudioComponent` at that index, or `undefined` if out of range.
     */
    getEffect: (index: number) => effects[index],

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
      for (const effect of effects) {
        try { effect.dispose() } catch { /* already disposed */ }
      }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
