import type { ControllerProfile } from '../types.js'

/**
 * MIDI profile for Native Instruments Traktor controllers.
 *
 * @remarks
 * 🔍 **Look into** — Exact model unknown (S2, S4 MK2, S4 MK3, etc.).
 * CC assignments vary significantly between models and firmware versions.
 *
 * **Before implementing:**
 * 1. Identify the exact model (`Help → About` in Traktor software)
 * 2. Check the MIDI implementation chart in the Traktor manual
 * 3. Use a MIDI monitor (e.g. MIDI-OX, MidiView) to capture CC values
 *    while moving faders/knobs on the hardware
 * 4. Replace placeholder mappings below with verified values
 * 5. Update `status` to `'needs-testing'` then `'verified'` after testing
 */
export const traktor: ControllerProfile = {
  name:   'Native Instruments Traktor (model TBD)',
  id:     'traktor',
  status: 'look-into',
  notes:  'Model unknown. Capture CC values with a MIDI monitor before filling in mappings. Common models: S2 MK3, S4 MK2, S4 MK3.',
  mappings: [
    // ── TODO: replace with verified mappings after model identification ──────
    // Example placeholders — DO NOT use without verification:
    // { type: 'controlChange', channel: 0, note: 0x07, target: { param: 'trackVolume', trackIndex: 0 } },
    // { type: 'controlChange', channel: 1, note: 0x07, target: { param: 'trackVolume', trackIndex: 1 } },
    // { type: 'controlChange', channel: 0, note: 0x01, target: { param: 'masterVolume' } },
  ],
}
