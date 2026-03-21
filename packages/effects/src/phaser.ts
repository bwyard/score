// Phaser effect — chain of allpass filters for phase-shifting
// Uses chain of allpass FilterNodes with feedback
// NOTE: Initial implementation uses fixed filter frequencies.
// Phase 8b (LFO core primitive) will upgrade to true modulated phaser.

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import { uid, ScoreError } from '@score/core'

/**
 * Configuration props for {@link createPhaser}.
 *
 * A phaser uses allpass filters to shift the phase of frequency bands,
 * creating sweeping comb-filter notches. Classic on synths, guitars, and pads.
 *
 * @remarks
 * This implementation uses fixed logarithmically-spaced filter frequencies.
 * Phase 8b will introduce true LFO modulation for the classic swooping sweep.
 */
export type PhaserProps = {
  /** LFO rate in Hz. Reserved for Phase 8b modulation. Default `0.5`. */
  readonly rate?: number
  /** LFO depth `0–1`. Reserved for Phase 8b modulation. Default `0.5`. */
  readonly depth?: number
  /** Number of allpass filter stages `2–12`. More stages = deeper notches. Default `4`. */
  readonly stages?: number
  /** Feedback amount `0–0.95`. Higher values create more resonant, intense sweeps. Default `0.3`. */
  readonly feedback?: number
}

/**
 * Create a phaser effect using a chain of allpass filters with feedback.
 * Produces the sweeping, whooshing character of classic analogue phasers —
 * from subtle shimmer to dramatic jet-plane swoops.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Phaser configuration.
 * @returns AudioComponent with a `setFeedback` setter.
 *
 * @throws {ScoreError} If the filter stage count falls below 2 after clamping (internal guard — should not occur in practice).
 *
 * @example
 * ```ts
 * // Four-stage phaser on a funk synth chord
 * const phase = createPhaser(context, { stages: 4, feedback: 0.5 })
 * ```
 *
 * @example
 * ```ts
 * // Twelve-stage deep phase on a trance supersaw
 * const deep = createPhaser(context, { stages: 12, feedback: 0.7 })
 * ```
 *
 * @see {@link createFlanger} — for short delay-based comb filtering
 * @see {@link createChorus} — for voice-layering ensemble effects
 */
export const createPhaser = (
  context: ScoreAudioContext,
  props?: PhaserProps,
) => {
  const stageCount = Math.max(2, Math.min(props?.stages ?? 4, 12))
  const feedbackAmount = Math.min(props?.feedback ?? 0.3, 0.95)

  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const wetGain = context.createGain({ gain: 0.5 })
  const feedbackGain = context.createGain({ gain: feedbackAmount })

  // Create allpass filter chain with logarithmically spaced frequencies — declarative, no push
  const filters = Array.from({ length: stageCount }, (_, i) => {
    const freq = 200 * Math.pow(2, (i / stageCount) * 4)
    return context.createFilter({ type: 'allpass', frequency: freq, Q: 0.7 })
  })

  // Chain allpass filters in series — stageCount >= 2, so filters always has elements
  const firstFilter = filters[0]
  const lastFilter = filters[filters.length - 1]
  if (!firstFilter || !lastFilter) {
    throw ScoreError('Phaser requires at least 2 stages', {
      received: String(filters.length),
      fix: 'Set stages to a value between 2 and 12',
      docs: 'https://score.dev/docs/effects#phaser',
    })
  }
  inputGain.connect(firstFilter)
  filters.forEach((current, i) => {
    const next = filters[i + 1]
    if (next) current.connect(next)
  })

  // Wet path from last filter
  lastFilter.connect(wetGain)
  wetGain.connect(outputGain)

  // Dry path
  inputGain.connect(outputGain)

  // Feedback from last filter back to first
  lastFilter.connect(feedbackGain)
  feedbackGain.connect(firstFilter)

  const component: AudioComponent & {
    readonly setFeedback: (value: number, time?: number) => void
  } = {
    id: uid('phaser'),
    type: 'phaser' as const,

    /**
     * Set the phaser feedback amount. Higher feedback creates sharper, more resonant notches.
     * Clamped to `0.95` to prevent instability.
     *
     * @param value - Feedback `0–0.95`.
     * @param time - Optional schedule time in seconds.
     */
    setFeedback: (value: number, time?: number) => {
      feedbackGain.setGain(Math.min(value, 0.95), time)
    },

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },

    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      try { inputGain.disconnect() } catch { /* already disconnected */ }
      try { wetGain.disconnect() } catch { /* already disconnected */ }
      try { feedbackGain.disconnect() } catch { /* already disconnected */ }
      filters.forEach(f => {
        try { f.disconnect() } catch { /* already disconnected */ }
      })
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
