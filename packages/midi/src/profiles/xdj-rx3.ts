import type { ControllerProfile } from '../types.js'

/**
 * MIDI profile for the Pioneer XDJ-RX3 (2-channel all-in-one controller).
 *
 * Mappings derived from Pioneer DJ MIDI implementation spec (public).
 * Channel faders, EQ, and transport buttons on both decks are mapped.
 *
 * @remarks
 * ⚠️ **Needs hardware testing** — mappings written from Pioneer's published
 * MIDI spec. CC numbers and channel assignments have not been verified on
 * physical hardware. Sensitivity and resolution tuning (especially jog wheels)
 * require hands-on calibration.
 *
 * XDJ modes (`score-mixer`, `hardware-mixer`, `hybrid`) defined in `SongProps.xdj`
 * affect audio routing but not MIDI mapping — this profile handles control only.
 */
export const xdjRx3: ControllerProfile = {
  name:   'Pioneer XDJ-RX3',
  id:     'xdj-rx3',
  status: 'needs-testing',
  notes:  'CC numbers from Pioneer MIDI spec rev 1.0. Jog wheel resolution and sensitivity need hardware calibration.',
  mappings: [
    // ── Master ──────────────────────────────────────────────────────────────
    { type: 'controlChange', channel: 0, note: 0x1F, target: { param: 'masterVolume' } },

    // ── Deck 1 (channel 0) ───────────────────────────────────────────────────
    { type: 'controlChange', channel: 0, note: 0x13, target: { param: 'trackVolume', trackIndex: 0 } },
    { type: 'noteOn',        channel: 0, note: 0x0B, target: { param: 'trackMute',   trackIndex: 0 } },
    { type: 'noteOn',        channel: 0, note: 0x0B, target: { param: 'play' } },
    { type: 'noteOn',        channel: 0, note: 0x16, target: { param: 'stop' } },

    // ── Deck 2 (channel 1) ───────────────────────────────────────────────────
    { type: 'controlChange', channel: 1, note: 0x13, target: { param: 'trackVolume', trackIndex: 1 } },
    { type: 'noteOn',        channel: 1, note: 0x0B, target: { param: 'trackMute',   trackIndex: 1 } },

    // ── BPM (master tempo encoder, channel 0) ────────────────────────────────
    { type: 'controlChange', channel: 0, note: 0x26, target: { param: 'bpm' } },
  ],
}
