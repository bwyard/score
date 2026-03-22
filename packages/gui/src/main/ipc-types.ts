// ── IPC channel type definitions ──────────────────────────────────────────────
// Shared between main process and preload/renderer.
// Every channel has a typed payload — no `any` crossing the bridge.

/** Mode the user selected on the splash screen. */
export type StudioMode = 'live-code' | 'produce' | 'dj-set' | 'jam-session'

/** Hardware level selected on the splash screen. */
export type HardwareLevel = 'pc-only' | 'controller' | 'aio'

/** Payload sent when the user picks a mode on the splash screen. */
export type ModeSelectedPayload = {
  readonly mode:     StudioMode
  readonly hardware: HardwareLevel
}

/** Channels from renderer → main. */
export type RendererToMain = {
  'mode:selected':      ModeSelectedPayload
  'transport:play':     undefined
  'transport:stop':     undefined
  'transport:bpm-set':  { bpm: number }
  'engine:eval':        { code: string }
  'midi:connect':       undefined
  'midi:disconnect':    undefined
  'engine:patch':       Record<string, unknown>
}

/** Channels from main → renderer (via ipcRenderer.on). */
export type MainToRenderer = {
  'engine:state':    { playing: boolean; bpm: number; bars: number }
  'midi:status':     { connected: boolean }
  'error:report':    { message: string }
  'song:update':     { tracks: ReadonlyArray<{ name: string; type: string; pattern: ReadonlyArray<number | string> }> }
  'engine:analysis': { waveform: readonly number[] }
}
