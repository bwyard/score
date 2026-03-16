// Effects chain — wires multiple effects in series
// Provides a single AudioComponent interface for a chain of effects

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendNode } from '@score/core'
import { uid } from '@score/core'

export const createEffectsChain = (
  context: ScoreAudioContext,
  effects: ReadonlyArray<AudioComponent>,
) => {
  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })

  // Wire effects in series: input -> effect[0] -> effect[1] -> ... -> output
  const first = effects[0]
  const last = effects[effects.length - 1]
  if (!first || !last) {
    inputGain.connect(outputGain)
  } else {
    inputGain.connect(first as unknown as BackendNode)
    for (let i = 0; i < effects.length - 1; i++) {
      const current = effects[i]
      const next = effects[i + 1]
      if (current && next) {
        current.connect(next as unknown as BackendNode)
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
    input: inputGain,
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
