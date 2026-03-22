// Group bus — submix bus that aggregates multiple channels before the master
// Audio flow: input (channels connect here) → EQ → volume → output (connects to master)
// Use for drum bus, synth bus, etc. — apply shared processing to a group of tracks

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendNode } from '@score/core'
import { uid } from '@score/core'
import { createEQ, createEffectsChain } from '@score/effects'
import type { EQProps } from '@score/effects'

/**
 * Configuration props for a group bus.
 */
export type GroupProps = {
  readonly name?: string
  readonly volume?: number      // 0-1, default 0.8
  readonly effects?: ReadonlyArray<AudioComponent>
  readonly eq?: EQProps
}

/**
 * Create a group bus backend node.
 * A submix bus that aggregates multiple channels and applies shared EQ and effects
 * before routing into the master bus.
 *
 * @param context - The audio context.
 * @param props   - Node configuration: optional `name`, `volume`, `effects` chain, and `eq`.
 * @returns An `AudioComponent` with an `input` tap, `setVolume`, and `setEQ` methods.
 *
 * @example
 * ```ts
 * const drumBus = createGroup(ctx, { name: 'Drums', volume: 0.9 })
 * kickChannel.connect(drumBus.input)
 * snareChannel.connect(drumBus.input)
 * drumBus.connect(masterGain)
 * ```
 */
export const createGroup = (
  context: ScoreAudioContext,
  props?: GroupProps,
) => {
  const groupName = props?.name ?? 'Group'

  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })

  // Effects chain (optional)
  const effects = props?.effects ? [...props.effects] : []
  const chain = effects.length > 0 ? createEffectsChain(context, effects) : null

  if (chain) {
    inputGain.connect(chain.input)
  }

  // EQ
  const eq = createEQ(context, props?.eq)

  // Connect chain output (or input directly) to EQ
  if (chain) {
    chain.connect(eq as unknown as BackendNode)
  } else {
    inputGain.connect(eq as unknown as BackendNode)
  }

  // Volume
  const volumeGain = context.createGain({ gain: props?.volume ?? 0.8 })
  eq.connect(volumeGain)
  volumeGain.connect(outputGain)

  const component: AudioComponent & {
    readonly input: BackendNode
    readonly name: string
    readonly setVolume: (value: number, time?: number) => void
    readonly setEQ: (eqProps: EQProps) => void
  } = {
    id: uid('group'),
    type: 'group' as const,
    input: inputGain,
    get name() { return groupName },

    setVolume: (value: number, time?: number) => {
      volumeGain.setGain(value, time)
    },

    setEQ: (eqProps: EQProps) => {
      if (eqProps.low !== undefined) { eq.setLow(eqProps.low) }
      if (eqProps.mid !== undefined) { eq.setMid(eqProps.mid) }
      if (eqProps.high !== undefined) { eq.setHigh(eqProps.high) }
    },

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },

    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      if (chain) {
        try { chain.dispose() } catch { /* already disposed */ }
      }
      try { eq.dispose() } catch { /* already disposed */ }
      try { inputGain.disconnect() } catch { /* already disconnected */ }
      try { volumeGain.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
