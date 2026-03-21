// Mixer — orchestrates channels, returns, master EQ, and limiter
// Channels -> Master gain <- Returns
// Master gain -> Master EQ -> Limiter -> destination

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'
import { createEQ, createLimiter } from '@score/effects'
import { createChannel } from './channel.js'
import type { ChannelProps } from './channel.js'
import { createReturn } from './return.js'
import type { ReturnProps } from './return.js'
import { createGroup } from './group.js'
import type { GroupProps } from './group.js'

/**
 * Configuration props for a mixer instance.
 */
export type MixerProps = {
  readonly channels?: ReadonlyArray<ChannelProps>
  readonly returns?: ReadonlyArray<ReturnProps>
  readonly groups?: ReadonlyArray<GroupProps>
  readonly masterVolume?: number    // 0-1, default 0.8
  readonly limiterCeiling?: number  // dB, default -0.3
}

/** Mutable state held inside the mixer factory closure. */
type MixerState = {
  readonly channels: ReadonlyArray<ReturnType<typeof createChannel>>
  readonly returns: ReadonlyArray<ReturnType<typeof createReturn>>
  readonly groups: ReadonlyArray<ReturnType<typeof createGroup>>
}

/**
 * Creates a mixer that orchestrates channels, returns, groups, master EQ, and a brickwall limiter.
 *
 * Signal flow: `channels/returns/groups → masterGain → masterEQ → limiter → destination`
 *
 * The sub-filter bus previously in series has been removed (architectural fix t092): it was
 * lowpassing all audio to 80 Hz before the limiter, which is incorrect. The main signal path
 * is now clean; a sub bus can be added as a parallel tap in a future phase if needed.
 *
 * @param context - The Score audio context used to create all internal nodes.
 * @param props - Optional initial configuration including pre-created channels, returns,
 *   groups, master volume, and limiter ceiling.
 * @returns A mixer component implementing `AudioComponent` with channel/group management API.
 *
 * @example
 * ```ts
 * const mixer = createMixer(context, { masterVolume: 0.8, limiterCeiling: -0.3 })
 * const ch = mixer.addChannel({ name: 'Kick', volume: 0.9 })
 * mixer.connect(context.destination)
 * ```
 */
export const createMixer = (
  context: ScoreAudioContext,
  props?: MixerProps,
) => {
  // Master chain nodes
  const masterGain = context.createGain({ gain: props?.masterVolume ?? 0.8 })
  const masterEQ = createEQ(context)
  const limiter = createLimiter(context, { ceiling: props?.limiterCeiling ?? -0.3 })

  // Master routing: masterGain -> masterEQ -> limiter -> destination
  // NOTE: subFilter and subOutputGain removed (t092) — they were in series and lowpassed
  // all audio to 80 Hz before the limiter. A parallel sub tap can be added later if needed.
  masterGain.connect(masterEQ.input)
  masterEQ.connect(limiter.input)
  limiter.connect(context.destination)

  // Single mutable state object — the only `let` in this factory
  let state: MixerState = { channels: [], returns: [], groups: [] }

  // Solo state management — pure function over the channels array; side effects are
  // setMuteGain calls which are the intentional audio-graph boundary.
  const updateSoloState = (channels: ReadonlyArray<ReturnType<typeof createChannel>>): void => {
    const anySoloed = channels.some((ch) => ch.solo)
    for (const ch of channels) {
      ch.setMuteGain(anySoloed ? (ch.solo ? (ch.mute ? 0 : 1) : 0) : (ch.mute ? 0 : 1))
    }
  }

  // Create initial channels
  if (props?.channels) {
    for (const chProps of props.channels) {
      const ch = createChannel(context, chProps, () => { updateSoloState(state.channels); })
      ch.connect(masterGain)
      state = { ...state, channels: [...state.channels, ch] }
    }
  }

  // Create initial returns
  if (props?.returns) {
    for (const retProps of props.returns) {
      const ret = createReturn(context, retProps)
      ret.connect(masterGain)
      state = { ...state, returns: [...state.returns, ret] }
    }
  }

  // Create initial groups (output to master by default)
  if (props?.groups) {
    for (const grpProps of props.groups) {
      const grp = createGroup(context, grpProps)
      grp.connect(masterGain)
      state = { ...state, groups: [...state.groups, grp] }
    }
  }

  const component: AudioComponent & {
    readonly getChannel: (index: number) => ReturnType<typeof createChannel> | undefined
    readonly getReturn: (index: number) => ReturnType<typeof createReturn> | undefined
    readonly getGroup: (index: number) => ReturnType<typeof createGroup> | undefined
    readonly setMasterVolume: (value: number, time?: number) => void
    readonly addChannel: (channelProps?: ChannelProps) => ReturnType<typeof createChannel>
    readonly removeChannel: (index: number) => void
    readonly addGroup: (groupProps?: GroupProps) => ReturnType<typeof createGroup>
  } = {
    id: uid('mixer'),
    type: 'mixer' as const,

    getChannel: (index: number) => state.channels[index],

    getReturn: (index: number) => state.returns[index],

    getGroup: (index: number) => state.groups[index],

    setMasterVolume: (value: number, time?: number) => {
      masterGain.setGain(value, time)
    },

    addChannel: (channelProps?: ChannelProps) => {
      const ch = createChannel(context, channelProps, () => { updateSoloState(state.channels); })
      ch.connect(masterGain)
      state = { ...state, channels: [...state.channels, ch] }
      return ch
    },

    addGroup: (groupProps?: GroupProps) => {
      const grp = createGroup(context, groupProps)
      grp.connect(masterGain)
      state = { ...state, groups: [...state.groups, grp] }
      return grp
    },

    removeChannel: (index: number) => {
      const ch = state.channels[index]
      if (ch) {
        ch.disconnect()
        ch.dispose()
        state = { ...state, channels: state.channels.filter((_, i) => i !== index) }
        updateSoloState(state.channels)
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
      for (const ch of state.channels) {
        try { ch.disconnect() } catch { /* already disconnected */ }
        try { ch.dispose() } catch { /* already disposed */ }
      }
      for (const ret of state.returns) {
        try { ret.disconnect() } catch { /* already disconnected */ }
        try { ret.dispose() } catch { /* already disposed */ }
      }
      for (const grp of state.groups) {
        try { grp.disconnect() } catch { /* already disconnected */ }
        try { grp.dispose() } catch { /* already disposed */ }
      }
      try { masterEQ.dispose() } catch { /* already disposed */ }
      try { limiter.dispose() } catch { /* already disposed */ }
      try { masterGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
