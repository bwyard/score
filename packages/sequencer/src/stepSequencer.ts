// Step sequencer — resolves PatternInput<T> and triggers callbacks on transport ticks

import type { PatternInput, Position } from './types.js'
import type { Transport } from './transport.js'

// Mulberry32 PRNG — inlined to avoid a cross-package dep on @score/pattern.
// Same algorithm used in @score/pattern/transforms.ts and @prime/prime-random.
// Returns [randomValue 0–1, nextSeed].
const prngNext = (seed: number): [number, number] => {
  const s = (seed + 0x6D2B79F5) >>> 0
  let t = Math.imul(s ^ (s >>> 15), 1 | s)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0
  return [((t ^ (t >>> 14)) >>> 0) / 0x100000000, s]
}

/**
 * Configuration props for {@link createStepSequencer}.
 */
export type StepSequencerProps<T = number> = {
  /** The pattern to sequence — either a static array or a `(step, bar) =\> T` function. */
  readonly pattern: PatternInput<T>
  /** Total number of steps before wrapping. Defaults to `pattern.length` for arrays, or `16`. */
  readonly steps?: number
  /**
   * Song seed — passed to `PatternFn` as the third argument so stochastic transforms
   * produce song-specific variation. Sourced from `Song({ seed })`.
   */
  readonly seed?: number
  /**
   * Swing amount 0–1. Odd steps are delayed by `swing × (60 / bpm / ticksPerBeat) × 0.5`
   * seconds, producing a shuffle feel. Defaults to `0` (straight timing).
   */
  readonly swing?: number
  /**
   * Timing jitter in seconds. Each step is shifted by a seeded `±humanize` offset,
   * creating subtle timing variation that prevents a mechanical feel. Defaults to `0`.
   */
  readonly humanize?: number
  /**
   * Per-step drop probability 0–1. When set, each step is tested against a seeded
   * random value — if `rand < degrade`, the `onStep` callback is skipped for that step.
   * The step counter still advances. Defaults to `0` (no drops).
   */
  readonly degrade?: number
  /**
   * Ticks per beat — used to convert BPM into a per-tick duration for the swing
   * offset calculation. Should match the transport's `ticksPerBeat`. Defaults to `4`.
   */
  readonly ticksPerBeat?: number
}

/**
 * A step sequencer that fires an `onStep` callback on every transport tick,
 * advancing through a {@link PatternInput} and wrapping at `steps`.
 */
export type StepSequencer<T = number> = {
  /** Replace the active pattern at any time. Takes effect on the next tick. */
  readonly setPattern: (pattern: PatternInput<T>) => void
  /** The total number of ticks that have fired since the sequencer was created. */
  readonly currentStep: number
  /** Reset the step counter to zero. The transport subscription remains active. */
  readonly dispose: () => void
}

// HARDWARE BOUNDARY — step sequencer drives transport ticks. let is replaced with
// const state per the no-let rule; property mutation is the boundary exception.
type SequencerState<T> = {
  pattern: PatternInput<T>
  steps: number
  step: number
}

/**
 * Create a step sequencer that advances through a pattern on every transport tick.
 * The sequencer registers an `onTick` listener on the supplied transport and resolves
 * each step value via the pattern — either by index into an array or by calling the
 * generator function — before invoking `onStep`.
 *
 * Supports optional timing controls:
 * - `swing` — delays odd steps for a shuffle feel
 * - `humanize` — adds seeded per-step timing jitter
 * - `degrade` — randomly drops steps using a seeded PRNG
 *
 * @param transport - The {@link Transport} whose tick stream drives the sequencer.
 * @param props     - Sequencer configuration: `pattern`, optional `steps` count,
 *   and optional timing controls (`swing`, `humanize`, `degrade`, `ticksPerBeat`).
 * @param onStep    - Callback invoked on every (non-degraded) tick with the resolved
 *   step value, the current step index (0-based, wrapping at `steps`), and the
 *   transport position (with swing/humanize offsets applied to `position.time`).
 * @returns A {@link StepSequencer} instance.
 *
 * @example
 * ```ts
 * const seq = createStepSequencer(
 *   transport,
 *   { pattern: [1, 0, 1, 0, 1, 0, 1, 0], swing: 0.5, humanize: 0.002 },
 *   (value, step) => { if (value) kick.start(transport.position.time) },
 * )
 * transport.play()
 * ```
 */
export const createStepSequencer = <T = number>(
  transport: Transport,
  props: StepSequencerProps<T>,
  onStep: (value: T, step: number, position: Position) => void,
): StepSequencer<T> => {
  const state: SequencerState<T> = {
    pattern: props.pattern,
    steps: props.steps ?? (Array.isArray(props.pattern) ? props.pattern.length : 16),
    step: 0,
  }

  const resolvePattern = (currentStep: number, bar: number): T => {
    if (Array.isArray(state.pattern)) {
      // Guard clause: ensure safe array access
      const index = currentStep % state.pattern.length
      const value = state.pattern[index]
      // Safe: index is always within bounds due to modulo with non-zero length
      return value as T
    }
    return state.pattern(currentStep, bar, props.seed)
  }

  transport.onTick((position: Position): void => {
    const currentStepNumber = state.step % state.steps

    // Degrade — seeded per-step probability drop. Step counter advances even when dropped.
    if (props.degrade !== undefined && props.degrade > 0) {
      const degradeSeed = ((currentStepNumber * 1237 + position.bar * 4567) ^ (props.seed ?? 0)) >>> 0
      const [rand] = prngNext(degradeSeed)
      if (rand < props.degrade) {
        state.step += 1  // ADVANCE — dropped steps still count
        return
      }
    }

    const value = resolvePattern(currentStepNumber, position.bar)

    // Swing — delay odd steps by a fraction of a tick duration
    const ticksPerBeat = props.ticksPerBeat ?? 4
    const swingOffset = (props.swing !== undefined && props.swing > 0 && currentStepNumber % 2 === 1)
      ? props.swing * (60 / transport.bpm / ticksPerBeat) * 0.5
      : 0

    // Humanize — seeded ±humanize timing jitter in seconds
    const humanizeOffset = (props.humanize !== undefined && props.humanize > 0)
      ? (() => {
          const humanizeSeed = (((currentStepNumber * 7919 + position.bar * 3571) ^ (currentStepNumber << 4)) ^ (props.seed ?? 0)) >>> 0
          const [rand] = prngNext(humanizeSeed)
          return (rand * 2 - 1) * props.humanize
        })()
      : 0

    const rawTime = position.time + swingOffset + humanizeOffset
    const adjustedPosition: Position = (swingOffset === 0 && humanizeOffset === 0)
      ? position
      : { ...position, time: rawTime < 0 ? 0 : rawTime }

    onStep(value, currentStepNumber, adjustedPosition)
    state.step += 1  // ADVANCE — the only forward-time mutation permitted
  })

  const sequencer: StepSequencer<T> = {
    setPattern: (pattern: PatternInput<T>): void => {
      state.pattern = pattern
      if (Array.isArray(pattern)) {
        state.steps = props.steps ?? pattern.length
      }
    },

    get currentStep() { return state.step },

    dispose: (): void => {
      // Reset state — transport owns the tick subscription lifecycle
      state.step = 0
    },
  }

  return sequencer
}
