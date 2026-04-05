// =============================================================================
// @score/components — kickHardcore.ts
// Hardcore/gabber kick: short punchy sine body with a high-pass click transient
// and a hard-clip waveshaper applied after the amp envelope so silence stays silent.
// =============================================================================

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid } from '@score/core'

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration for {@link createKickHardcore}.
 */
export type KickHardcoreProps = {
  /** Output gain 0–1. Default `0.9`. */
  readonly gain?: number
  /** Oscillator start frequency in Hz. Default `80`. */
  readonly startFreq?: number
  /** Oscillator end frequency in Hz at the end of the pitch fall. Default `40`. */
  readonly endFreq?: number
  /** Duration of the pitch fall in seconds. Default `0.12`. */
  readonly pitchFall?: number
  /**
   * Hard-clip waveshaper drive amount. Values above `5` approach a square wave.
   * Default `8.0`.
   */
  readonly drive?: number
  /** Amplitude envelope decay time in seconds. Short for fast BPM. Default `0.25`. */
  readonly decay?: number
  /**
   * Level of the high-frequency click transient relative to the body (0–1).
   * Default `0.3`.
   */
  readonly clickGain?: number
}

/**
 * A synthesized percussion component — extends {@link AudioComponent} with a
 * `trigger` method for scheduling one-shot hits.
 */
export type KickHardcoreComponent = AudioComponent & {
  /**
   * Trigger a single kick hit at the given audio context time.
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   */
  readonly trigger: (time?: number) => void
}

// =============================================================================
// Constants
// =============================================================================

/** Attack time for the body amp envelope in seconds. */
const BODY_ATTACK_SECONDS = 0.001

/** Duration of the click noise burst in seconds. */
const CLICK_DURATION_SECONDS = 0.015

/** High-pass filter cutoff for the click transient in Hz. */
const CLICK_HPF_HZ = 3000

/** Number of samples in the hard-clip waveshaper curve table. */
const WAVESHAPER_RESOLUTION = 256

// =============================================================================
// Helpers
// =============================================================================

/**
 * Build a hard-clip waveshaper curve of the given resolution.
 * `curve[i] = Math.min(1, Math.max(-1, drive * x))` where x ∈ [−1, 1].
 * Clamps signal amplitude — produces distortion characteristic of gabber kicks.
 *
 * @param drive      - Clipping drive. `1.0` = unity; `8.0` = heavy gabber clip.
 * @param resolution - Number of samples in the curve table. Default `256`.
 * @returns A `Float32Array` suitable for `BackendWaveShaperNode.setCurve`.
 */
const buildHardClipCurve = (drive: number, resolution = WAVESHAPER_RESOLUTION): Float32Array => {
  const curve = new Float32Array(resolution)
  const half  = resolution / 2
  for (let i = 0; i < resolution; i++) {
    const x = (i - half) / half
    curve[i] = Math.min(1, Math.max(-1, drive * x))
  }
  return curve
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Create a synthesized hardcore/gabber kick drum component.
 *
 * Gabber kicks are characterised by their extreme loudness and distortion —
 * a short sine body is pitch-fallen and hard-clipped, turning the sine wave into
 * something approaching a square wave. A brief high-frequency noise burst layered
 * on top provides the transient click needed for definition at high BPM (160–200).
 *
 * Signal paths:
 * - Body: `sine osc (pitch fall) → body amp env → waveshaper (hard clip) → body gain → sum`
 * - Click: `noise → HPF (3 kHz) → click amp env → sum`
 *
 * Final: `sum → outputGain → (caller connects output)`
 *
 * The waveshaper is placed **after** the body amp envelope so that silence at the
 * tail of the decay stays silent rather than being amplified by the clipper.
 *
 * Each `trigger()` call spawns fresh oscillator + noise + amp nodes for that hit.
 * Nodes auto-disconnect via `onended` to prevent memory leaks.
 *
 * // HARDWARE BOUNDARY: hard-clip waveshaper curve is computed once at factory
 * // init — deterministic, not stochastic. Noise is stochastic at audio-graph
 * // init time inside `context.createNoise()` — acceptable, not per-step.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param props   - Optional hardcore kick configuration. If omitted all defaults apply.
 * @returns A {@link KickHardcoreComponent} with `id` prefixed `kickHardcore` and `type` set to `'kickHardcore'`.
 *
 * @example
 * ```ts
 * const kick = createKickHardcore(context, { drive: 10, decay: 0.2 })
 * kick.connect(context.destination)
 * kick.trigger(context.currentTime)
 * kick.trigger(context.currentTime + 0.375)  // 160 BPM quarter note
 * kick.dispose()
 * ```
 *
 * @see {@link KickHardcoreProps}     — configuration options
 * @see {@link KickHardcoreComponent} — returned component shape
 * @see {@link createKickHardstyle}   — hardstyle variant with tanh soft-clip and reverse-bass pitch
 * @see {@link createKick909}         — 909 kick without distortion
 * @throws \{ScoreError\} Never — invalid props are silently clamped.
 */
export const createKickHardcore = (
  context: ScoreAudioContext,
  props?: KickHardcoreProps,
): KickHardcoreComponent => {
  const startFreq   = props?.startFreq  ?? 80
  const endFreq     = props?.endFreq    ?? 40
  const pitchFall   = props?.pitchFall  ?? 0.12
  const drive       = props?.drive      ?? 8.0
  const decay       = props?.decay      ?? 0.25
  const clickGain   = props?.clickGain  ?? 0.3
  const outputGain  = context.createGain({ gain: props?.gain ?? 0.9 })

  // Hard-clip waveshaper built once at factory init — reused across all triggers.
  // Placed outside trigger() so we do not recreate the curve on every hit.
  const shaperCurve = buildHardClipCurve(drive)
  const waveShaper  = context.createWaveShaper({ curve: shaperCurve, oversample: '2x' })
  waveShaper.connect(outputGain)

  const trigger = (time?: number) => {
    const t = time ?? context.currentTime

    // --- Body: sine + pitch fall → amp env → waveshaper ---
    const osc      = context.createOscillator({ type: 'sine', frequency: startFreq })
    const bodyEnv  = context.createGain({ gain: 0 })

    osc.connect(bodyEnv)
    bodyEnv.connect(waveShaper)

    osc.schedulePitchEnvelope({ startFreq, endFreq, startTime: t, fallTime: pitchFall })
    bodyEnv.scheduleEnvelope({
      peak:      1.0,
      attack:    BODY_ATTACK_SECONDS,
      decay,
      sustain:   0,
      release:   0,
      startTime: t,
      duration:  BODY_ATTACK_SECONDS + decay,
    })

    osc.start(t)
    osc.stop(t + decay + 0.05)

    osc.onended = () => {
      try { osc.disconnect()     } catch { /* ok */ }
      try { bodyEnv.disconnect() } catch { /* ok */ }
    }

    // --- Click: white noise → HPF → short amp decay → outputGain (bypasses clipper) ---
    const noise      = context.createNoise({ type: 'white' })
    const clickHpf   = context.createFilter({ type: 'highpass', frequency: CLICK_HPF_HZ, Q: 1 })
    const clickEnv   = context.createGain({ gain: 0 })

    noise.connect(clickHpf)
    clickHpf.connect(clickEnv)
    clickEnv.connect(outputGain)

    clickEnv.scheduleEnvelope({
      peak:      clickGain,
      attack:    0.001,
      decay:     CLICK_DURATION_SECONDS,
      sustain:   0,
      release:   0,
      startTime: t,
      duration:  0.001 + CLICK_DURATION_SECONDS,
    })

    noise.start(t)
    noise.stop(t + CLICK_DURATION_SECONDS + 0.01)

    noise.onended = () => {
      try { noise.disconnect()    } catch { /* ok */ }
      try { clickHpf.disconnect() } catch { /* ok */ }
      try { clickEnv.disconnect() } catch { /* ok */ }
    }
  }

  // =============================================================================
  // Component
  // =============================================================================

  const component: KickHardcoreComponent = {
    id:   uid('kickHardcore'),
    type: 'kickHardcore' as const,
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
      try { waveShaper.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
