// AudioContext factory — same code runs in browser and Node.js
// Phase 2: wire up node-web-audio-api polyfill for Node.js

export type AudioContextLike = AudioContext

export const getAudioContext = (): AudioContextLike => {
  if (typeof globalThis.AudioContext !== 'undefined') {
    return new globalThis.AudioContext()
  }
  throw new Error('AudioContext not available — install node-web-audio-api for Node.js support')
}
