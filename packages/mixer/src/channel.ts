// Channel — per-track channel strip with EQ, pan, volume, mute, sends
// Audio flow: input -> effects chain (optional) -> EQ -> Pan -> Volume -> Mute -> output
//                                                                            -> send gains (to returns)

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendNode } from '@score/core'
import { uid } from '@score/core'
import { createEQ, createEffectsChain } from '@score/effects'
import type { EQProps } from '@score/effects'

/**
 * Configuration props for a channel strip.
 */
export type ChannelProps = {
  readonly name?: string
  readonly volume?: number      // 0-1, default 0.8
  readonly pan?: number         // -1 to 1, default 0
  readonly mute?: boolean       // default false
  readonly solo?: boolean       // default false
  readonly effects?: ReadonlyArray<AudioComponent>
  readonly eq?: EQProps
  /** Optional group ID to route this channel to a group bus instead of masterGain. */
  readonly groupId?: string
}

/**
 * A send from this channel to a return bus.
 * Created via {@link createChannel}'s `createSend` method.
 */
export type SendComponent = {
  /** Sets the send level (0–1). Optionally ramps to value at the given audio-context time. */
  readonly setLevel: (value: number, time?: number) => void
  /** Disconnects and releases the send gain node. Safe to call multiple times. */
  readonly dispose: () => void
}

/** Internal representation of a send connection. */
type SendEntry = {
  readonly gainNode: ReturnType<ScoreAudioContext['createGain']>
}

/**
 * Mutable state held inside a channel factory closure.
 * `const` binding — the object identity never changes, only its properties.
 * Property mutation is the hardware-boundary exception (engine layer only).
 */
type ChannelState = {
  mute: boolean
  solo: boolean
  sends: SendEntry[]
}

/**
 * Creates a per-track channel strip with EQ, pan, volume, mute/solo, and send routing.
 *
 * Signal flow: `input → [effects chain] → EQ → pan → volume → mute → output`
 * Send taps are taken after the mute gain so sends respect the mute state.
 *
 * @param context - The Score audio context used to create all internal nodes.
 * @param props - Optional initial configuration for name, volume, pan, mute, solo, effects, and EQ.
 * @param onSoloChange - Optional callback invoked whenever the solo state changes,
 *   allowing the parent mixer to re-evaluate solo logic across all channels.
 * @returns A channel component implementing `AudioComponent` with extended channel API.
 *
 * @example
 * ```ts
 * const ch = createChannel(context, { name: 'Kick', volume: 0.9 })
 * ch.connect(masterGain)
 * ```
 */
export const createChannel = (
  context: ScoreAudioContext,
  props?: ChannelProps,
  onSoloChange?: () => void,
) => {
  const channelName = props?.name ?? 'Channel'

  // Single mutable state object — const binding, property mutation only
  const state: ChannelState = {
    mute: props?.mute ?? false,
    solo: props?.solo ?? false,
    sends: [],
  }

  // Create nodes in signal flow order
  const inputGain = context.createGain({ gain: 1.0 })

  // Effects chain (optional) — uses createEffectsChain utility
  const effects = props?.effects ? [...props.effects] : []
  const chain = effects.length > 0 ? createEffectsChain(context, effects) : null

  if (chain) {
    inputGain.connect(chain.input)
  }

  // EQ
  const eq = createEQ(context, props?.eq)

  // Connect chain output (or input directly) to EQ
  if (chain) {
    chain.connect(eq.input)
  } else {
    inputGain.connect(eq.input)
  }

  // Pan -> Volume -> Mute -> Output
  const panNode = context.createStereoPanner({ pan: props?.pan ?? 0 })
  const volumeGain = context.createGain({ gain: props?.volume ?? 0.8 })
  const muteGain = context.createGain({ gain: state.mute ? 0 : 1 })
  const outputGain = context.createGain({ gain: 1.0 })

  eq.connect(panNode)
  panNode.connect(volumeGain)
  volumeGain.connect(muteGain)
  muteGain.connect(outputGain)

  const component: AudioComponent & {
    readonly input: BackendNode
    readonly name: string
    readonly mute: boolean
    readonly solo: boolean
    readonly setVolume: (value: number, time?: number) => void
    readonly setPan: (value: number, time?: number) => void
    readonly setMute: (value: boolean) => void
    readonly setSolo: (value: boolean) => void
    readonly setEQ: (eqProps: EQProps) => void
    readonly createSend: (returnInput: BackendNode) => SendComponent
    readonly setMuteGain: (value: number) => void
  } = {
    id: uid('channel'),
    type: 'channel' as const,
    input: inputGain,
    get name() { return channelName },
    get mute() { return state.mute },
    get solo() { return state.solo },

    setVolume: (value: number, time?: number) => {
      volumeGain.setGain(value, time)
    },

    setPan: (value: number, time?: number) => {
      panNode.setPan(value, time)
    },

    setMute: (value: boolean) => {
      state.mute = value
      muteGain.setGain(value ? 0 : 1)
    },

    setSolo: (value: boolean) => {
      state.solo = value
      if (onSoloChange) {
        onSoloChange()
      }
    },

    setEQ: (eqProps: EQProps) => {
      if (eqProps.low !== undefined) { eq.setLow(eqProps.low) }
      if (eqProps.mid !== undefined) { eq.setMid(eqProps.mid) }
      if (eqProps.high !== undefined) { eq.setHigh(eqProps.high) }
    },

    createSend: (returnInput: BackendNode): SendComponent => {
      const sendGain = context.createGain({ gain: 0.5 })
      muteGain.connect(sendGain)
      sendGain.connect(returnInput)
      state.sends.push({ gainNode: sendGain })

      // Per-send disposed flag — const object, property mutation at hardware boundary
      const sendState = { disposed: false }

      return {
        setLevel: (value: number, time?: number) => {
          sendGain.setGain(value, time)
        },
        dispose: () => {
          if (!sendState.disposed) {
            sendState.disposed = true
            state.sends = state.sends.filter((s) => s.gainNode !== sendGain)
            try { sendGain.disconnect() } catch { /* already disconnected */ }
          }
        },
      }
    },

    // Internal: allows mixer to override mute gain for solo logic
    setMuteGain: (value: number) => {
      muteGain.setGain(value)
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
      for (const send of state.sends) {
        try { send.gainNode.disconnect() } catch { /* already disconnected */ }
      }
      if (chain) {
        try { chain.dispose() } catch { /* already disposed */ }
      }
      try { eq.dispose() } catch { /* already disposed */ }
      try { inputGain.disconnect() } catch { /* already disconnected */ }
      try { panNode.disconnect() } catch { /* already disconnected */ }
      try { volumeGain.disconnect() } catch { /* already disconnected */ }
      try { muteGain.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
