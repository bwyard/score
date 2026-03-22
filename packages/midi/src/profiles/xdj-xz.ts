import type { ControllerProfile } from '../types.js'

/**
 * MIDI profile for the Pioneer XDJ-XZ (4-channel all-in-one controller).
 *
 * Extends the RX3 layout with 4 decks (channels 0–3) and additional
 * performance pads, FX sends, and a dedicated booth output control.
 *
 * @remarks
 * ⚠️ **Needs hardware testing** — mappings written from Pioneer's published
 * MIDI spec. CC numbers and channel assignments have not been verified on
 * physical hardware. The XZ uses the same MIDI implementation as the RX3
 * for decks 1 and 2; decks 3 and 4 mappings are inferred from the spec.
 */
export const xdjXz: ControllerProfile = {
  name:   'Pioneer XDJ-XZ',
  id:     'xdj-xz',
  status: 'needs-testing',
  notes:  'Decks 3 and 4 mappings inferred from spec — verify CC numbers on hardware.',
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

    // ── Deck 3 (channel 2) ───────────────────────────────────────────────────
    { type: 'controlChange', channel: 2, note: 0x13, target: { param: 'trackVolume', trackIndex: 2 } },
    { type: 'noteOn',        channel: 2, note: 0x0B, target: { param: 'trackMute',   trackIndex: 2 } },

    // ── Deck 4 (channel 3) ───────────────────────────────────────────────────
    { type: 'controlChange', channel: 3, note: 0x13, target: { param: 'trackVolume', trackIndex: 3 } },
    { type: 'noteOn',        channel: 3, note: 0x0B, target: { param: 'trackMute',   trackIndex: 3 } },

    // ── BPM encoder ─────────────────────────────────────────────────────────
    { type: 'controlChange', channel: 0, note: 0x26, target: { param: 'bpm' } },
  ],
}
