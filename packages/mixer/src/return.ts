// Return — send/return bus that receives from channel sends and applies a shared effect
// Audio flow: input -> effect -> volume -> output

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendNode } from '@score/core'
import { uid } from '@score/core'

export type ReturnProps = {
  readonly name?: string
  readonly effect: AudioComponent  // e.g., reverb or delay
  readonly volume?: number         // 0-1, default 0.8
}

export const createReturn = (
  context: ScoreAudioContext,
  props: ReturnProps,
) => {
  const returnName = props.name ?? 'Return'

  // Create nodes
  const inputGain = context.createGain({ gain: 1.0 })
  const volumeGain = context.createGain({ gain: props.volume ?? 0.8 })
  const outputGain = context.createGain({ gain: 1.0 })

  // Route: input -> effect -> volume -> output
  inputGain.connect(props.effect as unknown as BackendNode)
  props.effect.connect(volumeGain)
  volumeGain.connect(outputGain)

  const component: AudioComponent & {
    readonly input: BackendNode
    readonly name: string
    readonly setVolume: (value: number, time?: number) => void
  } = {
    id: uid('return'),
    type: 'return' as const,
    input: inputGain,
    get name() { return returnName },

    setVolume: (value: number, time?: number) => {
      volumeGain.setGain(value, time)
    },

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },

    disconnect: () => {
      try {
        outputGain.disconnect()
      } catch {
        // Already disconnected
      }
      return component
    },

    dispose: () => {
      try { props.effect.dispose() } catch { /* already disposed */ }
      try { inputGain.disconnect() } catch { /* already disconnected */ }
      try { volumeGain.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
