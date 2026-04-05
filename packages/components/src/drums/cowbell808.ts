// =============================================================================
// @score/components — cowbell808.ts
// Roland TR-808 cowbell: two detuned square oscillators through a bandpass
// filter shaped by a fast metallic envelope. Classic in house, electro, and
// 808-influenced genres.
//
// Signal path:
//   osc1 (562 Hz square) ─┐
//                          ├→ mix → bandpass (1.2 kHz) → VCA → outputGain
//   osc2 (839 Hz square) ─┘
//
// The two oscillator frequencies are the classic TR-808 cowbell ratios.
// Bandpass Q controls the metallic ring character — higher Q = more bell-like.
// =============================================================================

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration for {@link createCowbell808}.
 */
export type Cowbell808Props = {
  /** Output gain 0–1. Default `0.7`. */
  readonly gain?: number
  /**
   * Decay time in seconds. Controls the metallic ring length.
   * Short (0.1) = tight click; long (0.8) = open bell.
   * Default `0.3`.
   */
  readonly decay?: number
  /**
   * Bandpass filter centre frequency in Hz.
   * Raising this brightens the tone; lowering it adds body.
   * Default `1200`.
   */
  readonly tone?: number
  /**
   * Bandpass resonance Q. Higher Q = more resonant, bell-like.
   * Default `3`.
   */
  readonly q?: number
}

/**
 * Return type of {@link createCowbell808}.
 */
export type Cowbell808Component = AudioComponent & {
  readonly trigger: (time?: number) => void
}

// =============================================================================
// Constants
// =============================================================================

// TR-808 cowbell oscillator frequencies (Hz)
const OSC1_FREQ = 562
const OSC2_FREQ = 839

// =============================================================================
// Factory
// =============================================================================

/**
 * Creates a Roland TR-808-style cowbell using two detuned square oscillators.
 *
 * The classic 808 cowbell timbre comes from beating between two square waves at
 * 562 Hz and 839 Hz (a ratio of ~3:2), filtered by a bandpass and shaped by a
 * short metallic envelope. Ubiquitous in house, electro, and 808-influenced music.
 *
 * Signal path:
 * `osc1 + osc2 → mix (gain 0.5) → bandpass → VCA envelope → outputGain`
 *
 * Each `trigger()` spawns fresh oscillator nodes scheduled to stop after
 * `decay + 0.05` seconds. Nodes auto-disconnect via `onended`.
 *
 * // HARDWARE BOUNDARY: oscillator nodes are created and started inside trigger()
 * // — this is the intentional audio-graph mutation boundary.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param props   - Optional cowbell configuration. All fields have defaults.
 * @returns A {@link Cowbell808Component} with `id` prefixed `cowbell808` and `type` `'cowbell808'`.
 *
 * @example
 * ```ts
 * const cowbell = createCowbell808(context, { decay: 0.4, tone: 1200 })
 * cowbell.connect(context.destination)
 * cowbell.trigger(context.currentTime)
 * cowbell.trigger(context.currentTime + 0.5)
 * cowbell.dispose()
 * ```
 *
 * @see {@link Cowbell808Props}     — configuration options
 * @see {@link Cowbell808Component} — returned component shape
 * @throws \{ScoreError\} Never — invalid props are silently clamped.
 */
export const createCowbell808 = (
  context: ScoreAudioContext,
  props?: Cowbell808Props,
): Cowbell808Component => {
  const gain     = Math.max(0, Math.min(1, props?.gain  ?? 0.7))
  const decay    = Math.max(0.05, props?.decay ?? 0.3)
  const tone     = Math.max(200, props?.tone  ?? 1200)
  const q        = Math.max(0.1, props?.q     ?? 3)

  const outputGain = context.createGain({ gain })

  const trigger = (time?: number): void => {
    const t = time ?? context.currentTime

    const osc1     = context.createOscillator({ type: 'square', frequency: OSC1_FREQ })
    const osc2     = context.createOscillator({ type: 'square', frequency: OSC2_FREQ })
    const mixGain  = context.createGain({ gain: 0.5 })
    const bandpass = context.createFilter({ type: 'bandpass', frequency: tone, Q: q })
    const vca      = context.createGain({ gain: 0 })

    osc1.connect(mixGain)
    osc2.connect(mixGain)
    mixGain.connect(bandpass)
    bandpass.connect(vca)
    vca.connect(outputGain)

    // Metallic envelope: instant attack, exponential decay
    vca.scheduleEnvelope({
      peak:      1.0,
      attack:    0.002,
      decay,
      sustain:   0,
      release:   0,
      startTime: t,
      duration:  decay + 0.002,
    })

    const stopTime = t + decay + 0.05
    osc1.start(t)
    osc2.start(t)
    osc1.stop(stopTime)
    osc2.stop(stopTime)

    osc2.onended = () => {
      try { osc1.disconnect()     } catch { /* ok */ }
      try { osc2.disconnect()     } catch { /* ok */ }
      try { mixGain.disconnect()  } catch { /* ok */ }
      try { bandpass.disconnect() } catch { /* ok */ }
      try { vca.disconnect()      } catch { /* ok */ }
    }
  }

  // =============================================================================
  // Component
  // =============================================================================

  const component: Cowbell808Component = {
    id:   uid('cowbell808'),
    type: 'cowbell808' as const,
    trigger,

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },

    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
