// AutoPan effect — LFO-driven panning via scheduled parameter automation
// Uses StereoPannerNode + linearRampToValueAtTime to approximate LFO pan movement
// NOTE: True LFO modulation requires Phase 9a. This implementation pre-schedules
// 64 ramp points covering ~8 seconds of sinusoidal or triangular pan movement.

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendStereoPannerNode } from '@score/core'
import { uid } from '@score/core'

/**
 * LFO waveform shape for the auto-pan modulation.
 *
 * - `'sine'` — smooth sinusoidal sweep, classic panning effect
 * - `'triangle'` — linear ramp between left/right, sharper transitions
 */
export type AutoPanShape = 'sine' | 'triangle'

/**
 * Configuration props for {@link createAutoPan}.
 *
 * AutoPan creates rhythmic stereo movement by scheduling a series of
 * pan position ramps that approximate a continuous LFO modulation.
 */
export type AutoPanProps = {
  /** LFO rate in Hz. `0.5` = one full cycle per 2 seconds. Default `0.5`. */
  readonly rate?: number
  /** Pan depth `0–1`. `0` = no movement, `1` = full left-to-right swing. Default `0.8`. */
  readonly depth?: number
  /** LFO waveform shape. Default `'sine'`. */
  readonly shape?: AutoPanShape
}

/**
 * Hardware-boundary exception: engine-layer mutable state.
 * `const` binding — identity never changes, only properties are mutated by setters.
 */
type AutoPanState = {
  rate: number
  depth: number
  shape: AutoPanShape
  scheduled: boolean
}

const SCHEDULE_STEPS = 64
const SCHEDULE_DURATION = 8 // seconds of pre-scheduled automation

const schedulePan = (
  panner: BackendStereoPannerNode,
  baseTime: number,
  rate: number,
  depth: number,
  shape: AutoPanShape,
): void => {
  const period = 1 / Math.max(0.001, rate)
  const stepDuration = SCHEDULE_DURATION / SCHEDULE_STEPS

  for (let i = 0; i <= SCHEDULE_STEPS; i++) {
    const t = i * stepDuration
    const phase = (t / period) * Math.PI * 2
    const normalized = (t / period) % 1
    const triangleVal = normalized < 0.5 ? normalized * 4 - 1 : 3 - normalized * 4
    const panValue = shape === 'triangle' ? triangleVal * depth : Math.sin(phase) * depth

    panner.setPan(Math.max(-1, Math.min(1, panValue)), baseTime + t)
  }
}

/**
 * Create an LFO-driven auto-pan effect using scheduled parameter automation.
 * Produces rhythmic left-right stereo movement — a classic dub, reggae, and
 * electronic music spatial effect. Since true LFO modulation requires Phase 9a,
 * this implementation pre-schedules 64 ramp steps covering 8 seconds of movement.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - AutoPan configuration.
 * @returns AudioComponent with `setRate`, `setDepth`, and `setShape` setters.
 *
 * @example
 * ```ts
 * const pan = createAutoPan(context, { rate: 0.25, depth: 0.7 })
 * // Slow, wide pan sweep — classic dub/house effect
 * ```
 *
 * @example
 * ```ts
 * // Fast triangle pan for gated, chopped feel at 140 BPM
 * const chop = createAutoPan(context, { rate: 2.33, depth: 0.9, shape: 'triangle' })
 * ```
 */
export const createAutoPan = (
  context: ScoreAudioContext,
  props?: AutoPanProps,
) => {
  const state: AutoPanState = {
    rate: Math.max(0.001, props?.rate ?? 0.5),
    depth: Math.max(0, Math.min(props?.depth ?? 0.8, 1.0)),
    shape: props?.shape ?? 'sine',
    scheduled: false,
  }

  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const panner: BackendStereoPannerNode = context.createStereoPanner({ pan: 0 })

  // Route: input → panner → output
  inputGain.connect(panner)
  panner.connect(outputGain)

  const reschedule = (): void => {
    const baseTime = context.currentTime
    schedulePan(panner, baseTime, state.rate, state.depth, state.shape)
  }

  const component: AudioComponent & {
    readonly setRate: (hz: number) => void
    readonly setDepth: (depth: number) => void
    readonly setShape: (shape: AutoPanShape) => void
  } = {
    id: uid('autopan'),
    type: 'autopan' as const,

    /**
     * Set the LFO rate and reschedule pan automation.
     * Affects the speed of left-right movement — lower values = slower sweeps.
     *
     * @param hz - LFO rate in Hz. Must be \> 0.
     */
    setRate: (hz: number) => {
      state.rate = Math.max(0.001, hz)
      if (state.scheduled) reschedule()
    },

    /**
     * Set the pan depth and reschedule pan automation.
     * Controls the width of the stereo sweep — `0` = center, `1` = full swing.
     *
     * @param depth - Pan depth `0–1`.
     */
    setDepth: (depth: number) => {
      state.depth = Math.max(0, Math.min(depth, 1.0))
      if (state.scheduled) reschedule()
    },

    /**
     * Set the LFO waveform shape and reschedule pan automation.
     *
     * @param shape - `'sine'` for smooth sweeps, `'triangle'` for linear ramps.
     */
    setShape: (shape: AutoPanShape) => {
      state.shape = shape
      if (state.scheduled) reschedule()
    },

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      if (!state.scheduled) {
        state.scheduled = true
        reschedule()
      }
      return component
    },

    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      try { inputGain.disconnect() } catch { /* already disconnected */ }
      try { panner.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
