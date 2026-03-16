// AudioContext factory — creates a real Web Audio API context via node-web-audio-api
// Phase 13 will add browser support with dynamic import

import { AudioContext, OfflineAudioContext } from 'node-web-audio-api'
import { ScoreError } from './errors/ScoreError.js'
import type { ScoreAudioContext } from './types.js'

export const createAudioContext = (options?: {
  sampleRate?: number
  latencyHint?: 'interactive' | 'balanced' | 'playback'
  offline?: { length: number; numberOfChannels?: number }
}): ScoreAudioContext => {
  try {
    if (options?.offline) {
      const sampleRate = options.sampleRate ?? 44100
      return new OfflineAudioContext(
        options.offline.numberOfChannels ?? 1,
        options.offline.length,
        sampleRate,
      ) as unknown as ScoreAudioContext
    }
    return new AudioContext(options)
  } catch (err) {
    throw ScoreError('Failed to create AudioContext', {
      fix: 'Ensure node-web-audio-api is installed: pnpm add node-web-audio-api',
      received: err instanceof Error ? err.message : String(err),
    })
  }
}
