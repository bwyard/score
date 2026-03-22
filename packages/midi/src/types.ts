// ── WebMIDI API surface (minimal — only what the bridge uses) ─────────────────
// We define these ourselves rather than taking a @types/webmidi dependency.

type MidiInputEventMap = {
  midimessage: Event & { data: Uint8Array }
}

export type WebMidiInput = {
  readonly name?: string
  addEventListener<K extends keyof MidiInputEventMap>(type: K, cb: (e: MidiInputEventMap[K]) => void): void
  removeEventListener<K extends keyof MidiInputEventMap>(type: K, cb: (e: MidiInputEventMap[K]) => void): void
}

export type WebMidiAccess = {
  readonly inputs: Map<string, WebMidiInput>
}

// ── MIDI event types ──────────────────────────────────────────────────────────

/** Raw MIDI message types relevant to DJ controllers. */
export type MidiMessageType =
  | 'noteOn'
  | 'noteOff'
  | 'controlChange'
  | 'pitchBend'
  | 'sysex'

/** A single decoded MIDI event. */
export type MidiEvent = {
  readonly type:    MidiMessageType
  readonly channel: number   // 0–15
  readonly note:    number   // 0–127 (noteOn/Off) or CC number (controlChange)
  readonly value:   number   // 0–127 (note velocity / CC value) or -1–1 (pitchBend)
  readonly raw:     Uint8Array
}

// ── Controller mapping ────────────────────────────────────────────────────────

/**
 * Maps a single hardware control to a Score engine parameter.
 *
 * @example
 * // Knob on CC 22 → master volume
 * \{ type: 'controlChange', channel: 0, note: 22, target: 'masterVolume' \}
 */
export type ControlMapping = {
  readonly type:    MidiMessageType
  readonly channel: number
  readonly note:    number
  readonly target:  MappingTarget
}

/**
 * What a control maps to inside the Score engine.
 *
 * - `bpm` — tempo knob/encoder
 * - `masterVolume` — master fader
 * - `trackVolume` — per-track fader (requires `trackIndex`)
 * - `trackMute` — per-track mute button (requires `trackIndex`)
 * - `play` / `stop` — transport buttons
 */
export type MappingTarget =
  | { readonly param: 'bpm' }
  | { readonly param: 'masterVolume' }
  | { readonly param: 'trackVolume'; readonly trackIndex: number }
  | { readonly param: 'trackMute';   readonly trackIndex: number }
  | { readonly param: 'play' }
  | { readonly param: 'stop' }

// ── Controller profile ────────────────────────────────────────────────────────

/**
 * A named set of MIDI control mappings for a specific hardware controller.
 *
 * Profiles are pure data — they carry no audio logic.
 * The bridge reads the profile and routes incoming MIDI events to the engine.
 */
export type ControllerProfile = {
  /** Human-readable name, e.g. `'Pioneer XDJ-RX3'`. */
  readonly name:     string
  /** Short identifier, e.g. `'xdj-rx3'`. */
  readonly id:       string
  /**
   * Hardware testing status.
   * - `'verified'` — tested on real hardware
   * - `'needs-testing'` — mappings from spec, not yet verified on hardware
   * - `'look-into'` — model/mappings unknown, placeholder only
   */
  readonly status:   'verified' | 'needs-testing' | 'look-into'
  /** Notes about testing status or known caveats. */
  readonly notes?:   string
  readonly mappings: ReadonlyArray<ControlMapping>
}

// ── Bridge config ─────────────────────────────────────────────────────────────

/** Engine surface the bridge calls into. Matches ScoreEngine from \@score/cli. */
export type BridgeEngine = {
  readonly patch: (props: {
    bpm?: number
    masterVolume?: number
    tracks?: ReadonlyArray<{ index: number; volume?: number; mute?: boolean }>
  }) => void
  readonly start:   () => void
  readonly stop:    () => void
}

/** Config for {@link createMidiBridge}. */
export type MidiBridgeConfig = {
  readonly profile: ControllerProfile
  readonly engine:  BridgeEngine
  /**
   * Range for BPM knob/encoder. Default: `[60, 200]`.
   * CC value 0 → min, 127 → max.
   */
  readonly bpmRange?: readonly [number, number]
}

/** Handle returned by {@link createMidiBridge}. */
export type MidiBridge = {
  /** Connect to the first MIDI input matching the profile name. */
  readonly connect:    () => Promise<void>
  /** Disconnect and release MIDI access. */
  readonly disconnect: () => void
  /** Whether a MIDI input is currently connected. */
  readonly connected:  boolean
}
