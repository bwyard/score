// Return — send/return bus that receives from channel sends and applies a shared effect
// Audio flow: input -> effect -> volume -> output

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration props for a return bus.
 *
 * The `effect` must be an `AudioComponent` that exposes an `input` property (a `BackendNode`).
 * All standard Score effect components (EQ, reverb, delay, etc.) satisfy this constraint.
 */
export type ReturnProps = {
  readonly name?: string
  /** The effect to apply to the return bus signal. Must expose a `.input` BackendNode. */
  readonly effect: AudioComponent & { readonly input: BackendNode }
  readonly volume?: number  // 0-1, default 0.8
}

/**
 * Creates a send/return bus that receives signals from channel sends and routes them through
 * a shared effect component before mixing back into the master bus.
 *
 * Signal flow: `input → effect.input → effect → volume → output`
 *
 * @param context - The Score audio context used to create all internal nodes.
 * @param props - Configuration including the effect component, optional name, and volume.
 * @returns A return component implementing `AudioComponent` with an `input` tap and `setVolume`.
 *
 * @example
 * ```ts
 * const reverb = createReverb(context, { roomSize: 0.8 })
 * const ret = createReturn(context, { name: 'Hall Reverb', effect: reverb, volume: 0.7 })
 * ret.connect(masterGain)
 * const send = kickChannel.createSend(ret.input)
 * ```
 */
export const createReturn = (
  context: ScoreAudioContext,
  props: ReturnProps,
) => {
  const returnName = props.name ?? 'Return'

  // Create nodes
  const inputGain = context.createGain({ gain: 1.0 })
  const volumeGain = context.createGain({ gain: props.volume ?? 0.8 })
  const outputGain = context.createGain({ gain: 1.0 })

  // Route: input -> effect.input -> effect -> volume -> output
  inputGain.connect(props.effect.input)
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
