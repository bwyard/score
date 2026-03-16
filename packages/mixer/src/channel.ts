// Channel — per-track channel strip with EQ, pan, volume, mute, sends
// Audio flow: input -> effects chain (optional) -> EQ -> Pan -> Volume -> Mute -> output
//                                                                            -> send gains (to returns)

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendNode } from '@score/core'
import { uid } from '@score/core'
import { createEQ } from '@score/effects'
import type { EQProps } from '@score/effects'

export type ChannelProps = {
  readonly name?: string
  readonly volume?: number      // 0-1, default 0.8
  readonly pan?: number         // -1 to 1, default 0
  readonly mute?: boolean       // default false
  readonly solo?: boolean       // default false
  readonly effects?: ReadonlyArray<AudioComponent>
  readonly eq?: EQProps
}

export type SendComponent = {
  readonly setLevel: (value: number, time?: number) => void
  readonly dispose: () => void
}

export const createChannel = (
  context: ScoreAudioContext,
  props?: ChannelProps,
  onSoloChange?: () => void,
) => {
  const channelName = props?.name ?? 'Channel'
  let muteState = props?.mute ?? false
  let soloState = props?.solo ?? false

  // Create nodes in signal flow order
  const inputGain = context.createGain({ gain: 1.0 })

  // Effects chain (optional) — wire effects in series manually
  const effects = props?.effects ? [...props.effects] : []
  if (effects.length > 0) {
    // Connect input to first effect
    const first = effects[0]
    if (first) {
      inputGain.connect(first as unknown as BackendNode)
    }
    // Chain effects together
    for (let i = 0; i < effects.length - 1; i++) {
      const current = effects[i]
      const next = effects[i + 1]
      if (current && next) {
        current.connect(next as unknown as BackendNode)
      }
    }
  }

  // EQ
  const eq = createEQ(context, props?.eq)

  // Connect last effect (or input) to EQ
  if (effects.length > 0) {
    const last = effects[effects.length - 1]
    if (last) {
      last.connect(eq as unknown as BackendNode)
    }
  } else {
    inputGain.connect(eq as unknown as BackendNode)
  }

  // Pan -> Volume -> Mute -> Output
  const panNode = context.createStereoPanner({ pan: props?.pan ?? 0 })
  const volumeGain = context.createGain({ gain: props?.volume ?? 0.8 })
  const muteGain = context.createGain({ gain: muteState ? 0 : 1 })
  const outputGain = context.createGain({ gain: 1.0 })

  eq.connect(panNode)
  panNode.connect(volumeGain)
  volumeGain.connect(muteGain)
  muteGain.connect(outputGain)

  // Send gains — each connected from muteGain to a return input
  const sends: Array<{ readonly gainNode: ReturnType<typeof context.createGain>; disposed: boolean }> = []

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
    get mute() { return muteState },
    get solo() { return soloState },

    setVolume: (value: number, time?: number) => {
      volumeGain.setGain(value, time)
    },

    setPan: (value: number, time?: number) => {
      panNode.setPan(value, time)
    },

    setMute: (value: boolean) => {
      muteState = value
      muteGain.setGain(value ? 0 : 1)
    },

    setSolo: (value: boolean) => {
      soloState = value
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
      const sendEntry = { gainNode: sendGain, disposed: false }
      sends.push(sendEntry)

      return {
        setLevel: (value: number, time?: number) => {
          sendGain.setGain(value, time)
        },
        dispose: () => {
          if (!sendEntry.disposed) {
            sendEntry.disposed = true
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
      for (const send of sends) {
        if (!send.disposed) {
          send.disposed = true
          try { send.gainNode.disconnect() } catch { /* already disconnected */ }
        }
      }
      for (const effect of effects) {
        try { effect.dispose() } catch { /* already disposed */ }
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
