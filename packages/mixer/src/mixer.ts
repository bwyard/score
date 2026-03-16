// Mixer — orchestrates channels, returns, master EQ, sub bus, and limiter
// Channels -> Master gain <- Returns
// Master gain -> Master EQ -> Sub bus (lowpass 80Hz -> sub output) -> Limiter -> destination

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendNode } from '@score/core'
import { uid } from '@score/core'
import { createEQ, createLimiter } from '@score/effects'
import { createChannel } from './channel.js'
import type { ChannelProps } from './channel.js'
import { createReturn } from './return.js'
import type { ReturnProps } from './return.js'

export type MixerProps = {
  readonly channels?: ReadonlyArray<ChannelProps>
  readonly returns?: ReadonlyArray<ReturnProps>
  readonly masterVolume?: number  // 0-1, default 0.8
  readonly limiterCeiling?: number // dB, default -0.3
}

export const createMixer = (
  context: ScoreAudioContext,
  props?: MixerProps,
) => {
  // Master chain nodes
  const masterGain = context.createGain({ gain: props?.masterVolume ?? 0.8 })
  const masterEQ = createEQ(context)
  const subFilter = context.createFilter({ type: 'lowpass', frequency: 80 })
  const subOutputGain = context.createGain({ gain: 1.0 })
  const limiter = createLimiter(context, { ceiling: props?.limiterCeiling ?? -0.3 })

  // Master routing: masterGain -> masterEQ -> subFilter -> subOutputGain -> limiter -> destination
  masterGain.connect(masterEQ as unknown as BackendNode)
  masterEQ.connect(subFilter)
  subFilter.connect(subOutputGain)
  subOutputGain.connect(limiter as unknown as BackendNode)
  limiter.connect(context.destination)

  // Channel and return arrays (mutable for add/remove)
  const channels: Array<ReturnType<typeof createChannel>> = []
  const returns: Array<ReturnType<typeof createReturn>> = []

  // Solo state management
  const updateSoloState = () => {
    const anySoloed = channels.some((ch) => ch.solo)
    for (const ch of channels) {
      if (anySoloed) {
        ch.setMuteGain(ch.solo ? (ch.mute ? 0 : 1) : 0)
      } else {
        ch.setMuteGain(ch.mute ? 0 : 1)
      }
    }
  }

  // Create initial channels
  if (props?.channels) {
    for (const chProps of props.channels) {
      const ch = createChannel(context, chProps, updateSoloState)
      ch.connect(masterGain)
      channels.push(ch)
    }
  }

  // Create initial returns
  if (props?.returns) {
    for (const retProps of props.returns) {
      const ret = createReturn(context, retProps)
      ret.connect(masterGain)
      returns.push(ret)
    }
  }

  const component: AudioComponent & {
    readonly getChannel: (index: number) => ReturnType<typeof createChannel> | undefined
    readonly getReturn: (index: number) => ReturnType<typeof createReturn> | undefined
    readonly setMasterVolume: (value: number, time?: number) => void
    readonly addChannel: (channelProps?: ChannelProps) => ReturnType<typeof createChannel>
    readonly removeChannel: (index: number) => void
  } = {
    id: uid('mixer'),
    type: 'mixer' as const,

    getChannel: (index: number) => {
      const ch = channels[index]
      return ch ? ch : undefined
    },

    getReturn: (index: number) => {
      const ret = returns[index]
      return ret ? ret : undefined
    },

    setMasterVolume: (value: number, time?: number) => {
      masterGain.setGain(value, time)
    },

    addChannel: (channelProps?: ChannelProps) => {
      const ch = createChannel(context, channelProps, updateSoloState)
      ch.connect(masterGain)
      channels.push(ch)
      return ch
    },

    removeChannel: (index: number) => {
      const ch = channels[index]
      if (ch) {
        ch.disconnect()
        ch.dispose()
        channels.splice(index, 1)
        updateSoloState()
      }
    },

    connect: (destination: ScoreAudioNode) => {
      // Override default routing: disconnect limiter from destination, connect to new destination
      limiter.disconnect()
      limiter.connect(destination)
      return component
    },

    disconnect: () => {
      try {
        limiter.disconnect()
      } catch {
        // Already disconnected
      }
      return component
    },

    dispose: () => {
      for (const ch of channels) {
        try { ch.disconnect() } catch { /* already disconnected */ }
        try { ch.dispose() } catch { /* already disposed */ }
      }
      for (const ret of returns) {
        try { ret.disconnect() } catch { /* already disconnected */ }
        try { ret.dispose() } catch { /* already disposed */ }
      }
      try { masterEQ.dispose() } catch { /* already disposed */ }
      try { limiter.dispose() } catch { /* already disposed */ }
      try { masterGain.disconnect() } catch { /* already disconnected */ }
      try { subFilter.disconnect() } catch { /* already disconnected */ }
      try { subOutputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
