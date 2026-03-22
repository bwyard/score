// @score/session — JamSession
//
// Coordinates a ScoreEngine (audio playback) with an optional MidiBridge
// (hardware controller input). Provides a unified start/stop/patch/update
// surface for live performance.
//
// Architecture boundary:
//   Hardware → MidiBridge → JamSession.patch() → ScoreEngine
//   Song file → JamSession.update()            → ScoreEngine.update()

import type { SongDefinition } from '@score/dsl'
import type { JamSession, JamSessionConfig, SessionState } from './types.js'

// ── Engine interface ──────────────────────────────────────────────────────────
// Defined locally to avoid a hard dep on @score/cli internals.
// The caller passes a pre-built engine that satisfies this shape.

type EngineHandle = {
  readonly start:   () => void
  readonly stop:    () => void
  readonly dispose: () => void
  readonly bpm:     number
  readonly bars:    number
  readonly patch:   (props: {
    bpm?: number
    masterVolume?: number
    tracks?: ReadonlyArray<{ index: number; volume?: number; mute?: boolean }>
  }) => void
  readonly update:  (song: SongDefinition) => void
}

// ── Session state ─────────────────────────────────────────────────────────────

type MutableSessionState = {
  playing:       boolean
  bpm:           number
  masterVolume:  number
  trackMutes:    boolean[]
  midiConnected: boolean
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a jam session that coordinates audio playback with optional MIDI hardware.
 *
 * The caller must supply a pre-built engine handle (from `createScoreEngine` in
 * `\@score/cli`). This keeps `\@score/session` free of the heavy audio-context
 * dependency — the CLI owns engine creation; the session owns coordination.
 *
 * @param engine - Running engine returned by `createScoreEngine`.
 * @param config - Song definition, optional MIDI bridge, initial volume and BPM.
 * @returns {@link JamSession} handle with start/stop/patch/update/dispose.
 *
 * @example
 * ```ts
 * import { createScoreEngine } from '@score/cli/engine'
 * import { createMidiBridge, xdjRx3 } from '@score/midi'
 * import { createJamSession } from '@score/session'
 *
 * const engine = await createScoreEngine(song)
 * const bridge = createMidiBridge({ profile: xdjRx3, engine: session })
 * const session = createJamSession(engine, { song, midi: bridge })
 *
 * await session.connectMidi()
 * session.start()
 * ```
 *
 * @see {@link JamSession} — returned handle type
 * @see {@link JamSessionConfig} — configuration options
 */
export const createJamSession = (
  engine: EngineHandle,
  config: JamSessionConfig,
): JamSession => {
  const local: MutableSessionState = {
    playing:       false,
    bpm:           config.bpm ?? config.song.bpm,
    masterVolume:  config.volume ?? 0.85,
    trackMutes:    config.song.tracks.map(() => false),
    midiConnected: false,
  }

  // Apply initial BPM/volume overrides if they differ from defaults
  if (config.bpm !== undefined && config.bpm !== config.song.bpm) {
    engine.patch({ bpm: config.bpm })
  }
  if (config.volume !== undefined) {
    engine.patch({ masterVolume: config.volume })
  }

  const session: JamSession = {
    start: () => {
      if (local.playing) return
      engine.start()
      local.playing = true
    },

    stop: () => {
      if (!local.playing) return
      engine.stop()
      local.playing = false
    },

    patch: (props) => {
      engine.patch(props)
      if (props.bpm           !== undefined) local.bpm = props.bpm
      if (props.masterVolume  !== undefined) local.masterVolume = props.masterVolume
      if (props.tracks) {
        for (const t of props.tracks) {
          if (t.mute !== undefined) local.trackMutes[t.index] = t.mute
        }
      }
    },

    update: (song: SongDefinition) => {
      engine.update(song)
      local.bpm = song.bpm
      // Resize trackMutes array if track count changed
      while (local.trackMutes.length < song.tracks.length) local.trackMutes.push(false)
      local.trackMutes.length = song.tracks.length
    },

    get state(): SessionState {
      return {
        playing:       local.playing,
        bpm:           engine.bpm,
        bars:          engine.bars,
        masterVolume:  local.masterVolume,
        trackMutes:    [...local.trackMutes],
        midiConnected: local.midiConnected,
      }
    },

    connectMidi: async () => {
      if (!config.midi) return
      if (local.midiConnected) config.midi.disconnect()
      await config.midi.connect()
      local.midiConnected = true
    },

    disconnectMidi: () => {
      if (!config.midi) return
      config.midi.disconnect()
      local.midiConnected = false
    },

    dispose: () => {
      if (config.midi) {
        config.midi.disconnect()
        local.midiConnected = false
      }
      engine.stop()
      engine.dispose()
      local.playing = false
    },
  }

  return session
}
