import type { SongDefinition } from '@score/dsl'
import type { BridgeEngine, MidiBridge } from '@score/midi'

// ── Session state ─────────────────────────────────────────────────────────────

/**
 * Snapshot of the current session state.
 * Returned by {@link JamSession.state} — pure read-only data, no audio references.
 */
export type SessionState = {
  /** Whether the session engine is currently playing audio. */
  readonly playing:      boolean
  /** Current BPM — may differ from the song file's BPM if patched live. */
  readonly bpm:          number
  /** Current bar count (absolute, resets on stop). */
  readonly bars:         number
  /** Current master volume `0–1`. */
  readonly masterVolume: number
  /** Per-track mute state, indexed by track position. */
  readonly trackMutes:   ReadonlyArray<boolean>
  /** Whether a MIDI controller is connected. */
  readonly midiConnected: boolean
}

// ── Session config ────────────────────────────────────────────────────────────

/**
 * Configuration for {@link createJamSession}.
 */
export type JamSessionConfig = {
  /** The song definition to load at session start. */
  readonly song:    SongDefinition
  /**
   * Optional MIDI bridge to connect for hardware controller input.
   * The session exposes itself as a {@link BridgeEngine} for the bridge to call.
   */
  readonly midi?:   MidiBridge
  /** Initial master volume `0–1`. Default `0.85`. */
  readonly volume?: number
  /** Initial BPM override. Defaults to `song.bpm`. */
  readonly bpm?:    number
}

// ── Engine surface ────────────────────────────────────────────────────────────

/**
 * The minimal engine surface a {@link JamSession} exposes to a MIDI bridge.
 * Satisfies {@link BridgeEngine} from `\@score/midi`.
 */
export type SessionEngine = BridgeEngine

// ── Session handle ────────────────────────────────────────────────────────────

/**
 * Live jam session handle — returned by {@link createJamSession}.
 *
 * Coordinates a running {@link ScoreEngine} with optional MIDI hardware input.
 * Exposes start/stop/patch controls and a read-only state snapshot.
 */
export type JamSession = {
  /** Start audio playback. No-op if already playing. */
  readonly start: () => void
  /** Stop audio playback. No-op if not playing. */
  readonly stop:  () => void
  /**
   * Patch live parameters without reloading the song.
   * Supports: `bpm`, `masterVolume`, per-track `volume` and `mute`.
   */
  readonly patch: SessionEngine['patch']
  /**
   * Hot-swap to a new song definition.
   * BPM and per-track volume/mute changes apply live.
   * Structural changes (new tracks, new patterns) require a full reload via
   * `dispose()` + new `createJamSession()`.
   */
  readonly update: (song: SongDefinition) => void
  /** Read-only snapshot of the current session state. */
  readonly state:  SessionState
  /**
   * Connect the MIDI bridge passed in config (if any).
   * Safe to call multiple times — reconnects if already connected.
   */
  readonly connectMidi:    () => Promise<void>
  /** Disconnect the MIDI bridge. No-op if no bridge or not connected. */
  readonly disconnectMidi: () => void
  /** Stop audio, disconnect MIDI, and release all resources. */
  readonly dispose: () => void
}
