// AudioContext factory — creates a BackendContext via a BackendProvider
// Defaults to Web Audio API. Pass a custom backend for scsynth, etc.

import type { BackendContext, BackendProvider } from './backend/types.js'
import { webAudioBackend } from './backend/web-audio.js'

export const createAudioContext = (options?: {
  sampleRate?: number
  latencyHint?: 'interactive' | 'balanced' | 'playback'
  offline?: { length: number; numberOfChannels?: number }
  backend?: BackendProvider
}): BackendContext => {
  const backend = options?.backend ?? webAudioBackend
  return backend.createContext(options)
}
