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

/** Persisted position and size for a single draggable panel. */
export type PanelLayout = {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

/** Saved layout map — keyed by panel id. */
export type PanelLayoutMap = Record<string, PanelLayout>

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
  'file:save':          { code: string }
  'file:open':          undefined
  /** Renderer sends current panel positions so main can persist them to disk. */
  'layout:save':        PanelLayoutMap
  /** Bug report payload — main saves to Downloads as JSON. */
  'bug:report': {
    /** User's freetext description of what happened. */
    readonly description: string
    /** Current code in the editor at the time of report. */
    readonly code: string
    /** Last 20 console log entries (JSON array stringified). */
    readonly logs: string
    /** Unix timestamp of the report. */
    readonly timestamp: number
    /** Engine state snapshot at the time of report. */
    readonly engineState: Record<string, unknown>
  }
}

/** Channels from main → renderer (via ipcRenderer.on). */
export type MainToRenderer = {
  'engine:state':    { playing: boolean; bpm: number; bars: number }
  /** Fires every sequencer step — use for punchcard cursor and visualiser sync. */
  'engine:step':     { step: number; stepCount: number }
  'midi:status':     { connected: boolean }
  'error:report':    { message: string }
  'song:update':     { tracks: ReadonlyArray<{ name: string; type: string; pattern: ReadonlyArray<number | string> }>; theme?: string; palette?: string }
  'engine:analysis': { waveform: readonly number[] }
  /** Fires when a bar-boundary swap is queued or cleared. */
  'engine:pending':  { pending: boolean }
  /** Fires every time a pitched note plays — Synth, Sax, Arp only. Use for piano roll display. */
  'engine:notes':    { notes: ReadonlyArray<{ pitch: number; step: number; velocity: number; trackIndex: number }> }
  /** Fires after a file:open dialog succeeds — renderer should setCode with this. */
  'file:opened':     { code: string }
  /**
   * Fires when a waveform discontinuity is detected in the analysis stream.
   * `maxDelta` is the largest sample-to-sample amplitude jump in the last analysis window.
   * Helps diagnose hard-onset pops, gain staging issues, and scheduling jitter.
   */
  'debug:pop':       { maxDelta: number; step: number; bars: number }
  /** Sent by main on launch with the previously saved panel layout (if any). */
  'layout:load':     PanelLayoutMap
}
