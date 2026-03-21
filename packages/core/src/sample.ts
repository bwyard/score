import { ScoreError } from './errors/ScoreError.js'
import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from './types.js'
import type { BackendBuffer, BackendBufferSourceNode } from './backend/types.js'
import { uid } from './uid.js'

// --- Sample decoding ---
// Accepts raw audio data (ArrayBuffer) and decodes via the backend.
// File reading is intentionally NOT here — it belongs in @score/cli or user code.
// This keeps core backend-agnostic (works in Node, browser, scsynth).

export const decodeSample = async (
  context: ScoreAudioContext,
  data: ArrayBuffer,
): Promise<BackendBuffer> => {
  if (data.byteLength === 0) {
    throw ScoreError('Cannot decode empty audio data', {
      received: `ArrayBuffer(byteLength=${String(data.byteLength)})`,
      fix: 'Provide a non-empty ArrayBuffer containing valid audio data (WAV, MP3, OGG, FLAC)',
      docs: 'https://score.dev/docs/core#sample',
    })
  }
  return context.decodeAudio(data)
}

// --- Sample player ---
// Wraps a decoded BackendBuffer as an AudioComponent.
// Each start() creates a fresh buffer source (Web Audio one-shot pattern).
// Gain is managed internally for volume control.

export const createSamplePlayer = (
  context: ScoreAudioContext,
  buffer: BackendBuffer,
  props?: {
    loop?: boolean
    playbackRate?: number
    gain?: number
  },
) => {
  const gainNode = context.createGain({ gain: props?.gain ?? 1.0 })
  type SampleState = { readonly activeSource: BackendBufferSourceNode | null }
  let state: SampleState = { activeSource: null }

  const component: AudioComponent & {
    readonly start: (time?: number, offset?: number, duration?: number) => void
    readonly stop: (time?: number) => void
    readonly setPlaybackRate: (rate: number, time?: number) => void
    readonly setGain: (value: number, time?: number) => void
    readonly buffer: BackendBuffer
  } = {
    id: uid('sample'),
    type: 'sample' as const,
    buffer,

    start: (time?: number, offset?: number, duration?: number) => {
      // Clean up previous source to prevent memory leak (Web Audio sources are one-shot)
      if (state.activeSource) {
        try { state.activeSource.stop() } catch { /* already stopped */ }
        try { state.activeSource.disconnect() } catch { /* already disconnected */ }
      }
      const newSource = context.createBufferSource(buffer, {
        loop: props?.loop ?? false,
        playbackRate: props?.playbackRate ?? 1.0,
      })
      state = { ...state, activeSource: newSource }
      newSource.connect(gainNode)
      newSource.start(time, offset, duration)
    },

    stop: (time?: number) => {
      if (state.activeSource) {
        try {
          state.activeSource.stop(time)
        } catch {
          // Already stopped
        }
        state = { ...state, activeSource: null }
      }
    },

    setPlaybackRate: (rate: number, time?: number) => {
      if (state.activeSource) {
        state.activeSource.setPlaybackRate(rate, time)
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
      if (state.activeSource) {
        try {
          state.activeSource.stop()
        } catch {
          // Already stopped
        }
        try {
          state.activeSource.disconnect()
        } catch {
          // Already disconnected
        }
        state = { ...state, activeSource: null }
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
