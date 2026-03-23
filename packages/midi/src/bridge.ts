import { ScoreError } from '@score/core'
import type {
  MidiEvent,
  MidiMessageType,
  MidiBridgeConfig,
  MidiBridge,
  ControlMapping,
  MappingTarget,
  WebMidiAccess,
  WebMidiInput,
} from './types.js'

// ── MIDI decoding ─────────────────────────────────────────────────────────────

const decodeMessage = (data: Uint8Array): MidiEvent | null => {
  if (data.length < 2) return null

  const status  = data[0] ?? 0
  const type    = status & 0xf0
  const channel = status & 0x0f
  const note    = data[1] ?? 0
  const value   = data[2] ?? 0

  const toType = (t: number): MidiMessageType | null => {
    if (t === 0x80) return 'noteOff'
    if (t === 0x90) return 'noteOn'
    if (t === 0xb0) return 'controlChange'
    if (t === 0xe0) return 'pitchBend'
    if (t === 0xf0) return 'sysex'
    return null
  }

  const msgType = toType(type)
  if (!msgType) return null

  const pitchBendValue = msgType === 'pitchBend'
    ? ((((data[2] ?? 0) << 7) | note) - 8192) / 8192
    : value

  return { type: msgType, channel, note, value: pitchBendValue, raw: data }
}

// ── Value scaling ─────────────────────────────────────────────────────────────

const ccToUnit   = (cc: number): number => cc / 127           // 0–1
const ccToRange  = (cc: number, min: number, max: number): number =>
  min + (cc / 127) * (max - min)

// ── Target dispatch ───────────────────────────────────────────────────────────

const applyTarget = (
  target:  MappingTarget,
  event:   MidiEvent,
  config:  MidiBridgeConfig,
): void => {
  const [bpmMin, bpmMax] = config.bpmRange ?? [60, 200]

  switch (target.param) {
    case 'bpm':
      config.engine.patch({ bpm: ccToRange(event.value, bpmMin, bpmMax) })
      break

    case 'masterVolume':
      config.engine.patch({ masterVolume: ccToUnit(event.value) })
      break

    case 'trackVolume':
      config.engine.patch({
        tracks: [{ index: target.trackIndex, volume: ccToUnit(event.value) }],
      })
      break

    case 'trackMute':
      // Button: noteOn velocity > 0 = toggle mute on; noteOff / vel 0 = off
      config.engine.patch({
        tracks: [{ index: target.trackIndex, mute: event.value > 0 }],
      })
      break

    case 'play':
      if (event.value > 0) config.engine.start()
      break

    case 'stop':
      if (event.value > 0) config.engine.stop()
      break
  }
}

// ── Mapping lookup ────────────────────────────────────────────────────────────

const findMapping = (
  event:    MidiEvent,
  mappings: ReadonlyArray<ControlMapping>,
): ControlMapping | undefined =>
  mappings.find(m =>
    m.type    === event.type    &&
    m.channel === event.channel &&
    m.note    === event.note,
  )

// ── Main factory ──────────────────────────────────────────────────────────────

/**
 * Create a MIDI bridge that routes hardware controller events to a Score engine.
 *
 * Connects to the first available MIDI input whose name contains the profile's
 * `id` string (case-insensitive). Falls back to the first available input if
 * no name match is found.
 *
 * @param config - Profile, engine reference, and optional BPM range
 * @returns      - Bridge handle with `connect`, `disconnect`, and `connected`
 *
 * @example
 * ```ts
 * import { createMidiBridge } from '@score/midi'
 * import { xdjRx3 } from '@score/midi/profiles'
 *
 * const bridge = createMidiBridge({ profile: xdjRx3, engine })
 * await bridge.connect()
 * ```
 *
 * @remarks
 * Requires WebMIDI API — available in browsers and Node.js 20+ via
 * `navigator.requestMIDIAccess`. In Node, use the `web-midi-api` polyfill
 * or ensure `node-web-audio-api` exposes it.
 */
// Minimal WebMIDI navigator surface — avoids @types/webmidi dependency
type WebMidiNavigator = {
  requestMIDIAccess: (opts: { sysex: boolean }) => Promise<WebMidiAccess>
}

const getWebMidi = (): WebMidiNavigator | null => {
  if (typeof navigator === 'undefined') return null
  const nav = navigator as unknown as Record<string, unknown>
  if (typeof nav['requestMIDIAccess'] !== 'function') return null
  return nav as unknown as WebMidiNavigator
}

export const createMidiBridge = (config: MidiBridgeConfig): MidiBridge => {
  const state = {
    midiAccess:  null as WebMidiAccess | null,
    activeInput: null as WebMidiInput | null,
    isConnected: false,
  }

  const onMidiMessage = (event: { data: Uint8Array }): void => {
    const decoded = decodeMessage(event.data)
    if (!decoded) return
    const mapping = findMapping(decoded, config.profile.mappings)
    if (!mapping) return
    applyTarget(mapping.target, decoded, config)
  }

  return {
    get connected() { return state.isConnected },

    connect: async (): Promise<void> => {
      const webMidi = getWebMidi()
      if (!webMidi) {
        throw ScoreError('WebMIDI not available in this environment', {
          received: typeof navigator,
          fix:      'Ensure navigator.requestMIDIAccess is available (browser or Node polyfill)',
          docs:     'https://score.dev/docs/midi',
        })
      }

      state.midiAccess = await webMidi.requestMIDIAccess({ sysex: false })

      const inputs  = Array.from(state.midiAccess.inputs.values())
      const idLower = config.profile.id.toLowerCase()

      state.activeInput =
        inputs.find(i => i.name?.toLowerCase().includes(idLower)) ??
        inputs[0] ??
        null

      if (!state.activeInput) {
        throw ScoreError('No MIDI input devices found', {
          received: inputs.length,
          fix:      'Connect a MIDI controller and try again',
          docs:     'https://score.dev/docs/midi',
        })
      }

      state.activeInput.addEventListener('midimessage', onMidiMessage)
      state.isConnected = true
    },

    disconnect: (): void => {
      if (state.activeInput) {
        state.activeInput.removeEventListener('midimessage', onMidiMessage)
        state.activeInput = null
      }
      state.midiAccess = null
      state.isConnected = false
    },
  }
}
