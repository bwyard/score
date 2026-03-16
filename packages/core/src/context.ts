// AudioContext factory — stub for Phase 2
// Phase 2 will wire up node-web-audio-api polyfill

import { ScoreError } from './errors/ScoreError.js'

export type AudioContextLike = {
  readonly currentTime: number
  readonly sampleRate: number
  readonly state: string
}

export const getAudioContext = (): AudioContextLike => {
  const g = globalThis as Record<string, unknown>
  if ('AudioContext' in g && typeof g.AudioContext === 'function') {
    return new (g.AudioContext as new () => AudioContextLike)()
  }
  throw ScoreError('AudioContext not available', {
    fix: 'Install node-web-audio-api for Node.js support',
  })
}
