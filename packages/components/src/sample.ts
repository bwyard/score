import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import type { BackendBuffer, BackendBufferSourceNode } from '@score/core'

export type SampleProps = {
  readonly loop?: boolean
  readonly playbackRate?: number
  readonly gain?: number
}

export type SampleComponent = AudioComponent & {
  readonly start: (time?: number, offset?: number, duration?: number) => void
  readonly stop: (time?: number) => void
  readonly setPlaybackRate: (rate: number, time?: number) => void
  readonly setGain: (value: number, time?: number) => void
  readonly buffer: BackendBuffer
}

export const Sample = (
  context: ScoreAudioContext,
  buffer: BackendBuffer,
  props?: SampleProps,
): SampleComponent => {
  const gainNode = context.createGain({ gain: props?.gain ?? 1.0 })
  let activeSource: BackendBufferSourceNode | null = null

  const component: SampleComponent = {
    buffer,

    start: (time?: number, offset?: number, duration?: number) => {
      // Clean up previous source (Web Audio sources are one-shot)
      if (activeSource) {
        try { activeSource.stop() } catch { /* already stopped */ }
        try { activeSource.disconnect() } catch { /* already disconnected */ }
      }
      activeSource = context.createBufferSource(buffer, {
        loop: props?.loop ?? false,
        playbackRate: props?.playbackRate ?? 1.0,
      })
      activeSource.connect(gainNode)
      activeSource.start(time, offset, duration)
    },

    stop: (time?: number) => {
      if (activeSource) {
        try {
          activeSource.stop(time)
        } catch {
          // Already stopped
        }
        activeSource = null
      }
    },

    setPlaybackRate: (rate: number, time?: number) => {
      if (activeSource) {
        activeSource.setPlaybackRate(rate, time)
      }
    },

    setGain: (value: number, time?: number) => {
      gainNode.setGain(value, time)
    },

    connect: (destination: ScoreAudioNode) => {
      gainNode.connect(destination)
      return component
    },

    disconnect: () => {
      try {
        gainNode.disconnect()
      } catch {
        // Already disconnected
      }
      return component
    },

    dispose: () => {
      if (activeSource) {
        try { activeSource.stop() } catch { /* already stopped */ }
        try { activeSource.disconnect() } catch { /* already disconnected */ }
        activeSource = null
      }
      try {
        gainNode.disconnect()
      } catch {
        // Already disconnected
      }
    },
  }

  return component
}
