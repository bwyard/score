import type { ControllerProfile } from '../types.js'

/**
 * MIDI profile for Serato DJ controllers.
 *
 * @remarks
 * 🔍 **Look into** — Exact model unknown. Serato is software; the hardware
 * varies widely (Pioneer DDJ series, Rane, Denon, etc.). CC assignments
 * are hardware-specific, not Serato-specific.
 *
 * **Before implementing:**
 * 1. Identify the hardware model (printed on the unit or in device manager)
 * 2. Find the MIDI implementation chart for that specific model
 * 3. Use a MIDI monitor to capture CC values from faders/knobs
 * 4. Replace placeholder mappings below with verified values
 * 5. Rename this profile to match the actual hardware (e.g. `ddj-sb3.ts`)
 * 6. Update `status` to `'needs-testing'` then `'verified'` after testing
 *
 * Common Serato-compatible controllers: Pioneer DDJ-SB3, DDJ-400, DDJ-REV5,
 * Rane One, Denon MC7000.
 */
export const serato: ControllerProfile = {
  name:   'Serato DJ Controller (model TBD)',
  id:     'serato',
  status: 'look-into',
  notes:  'Model unknown. Serato is software — the hardware model determines CC values. Identify the unit and capture CC values before filling in mappings.',
  mappings: [
    // ── TODO: replace with verified mappings after model identification ──────
  ],
}
