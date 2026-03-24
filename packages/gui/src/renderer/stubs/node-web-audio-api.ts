// Browser stub for node-web-audio-api.
// In the renderer (Chromium), the native Web Audio API is available on window.
// This stub re-exports the browser globals so any @score/* code that imports
// node-web-audio-api works transparently without the Node.js polyfill.
// BOUNDARY — renderer only. Main process uses the real node-web-audio-api.
export const AudioContext       = window.AudioContext
export const OfflineAudioContext = window.OfflineAudioContext
