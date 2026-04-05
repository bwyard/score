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
  /**
   * Stutter repeat count. When > 1, each fired step is repeated N times within the step
   * window, with each repeat evenly spaced. E.g. `stutter: 4` fires the step 4 times.
   * Defaults to `1` (no stutter).
   */
  readonly stutter?: number
  /**
   * Boolean gate pattern — steps where `mask[step]` is falsy are silently skipped.
   * Accepts the same `PatternInput<number>` shape as `pattern`.
   */
  readonly mask?: PatternInput
  /**
   * Per-step probability array — each element is a probability in `[0, 1]`.
   * A seeded PRNG decides whether each step fires. Wraps if shorter than `steps`.
   */
  readonly stepProb?: ReadonlyArray<number>
  /**
   * Every-n-cycle transform — after every `n` completed cycles, `transform` is applied
   * to the live pattern in place (only works on array patterns).
   */
  readonly every?: { readonly n: number; readonly transform: (p: number[]) => number[] }
  /**
   * Stretch factor — integer multiplier that slows the step rate.
   * `2` plays at half speed (each step occupies 2 ticks). Non-integer values are rounded.
   * Defaults to `1` (normal speed).
   */
  readonly stretch?: number
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
  pattern:    PatternInput<T>
  steps:      number
  step:       number
  subTick:    number   // ticks within current step (stretch implementation)
  cycleCount: number   // completed cycles (every-n implementation)
  prbSeed:    number   // running PRNG seed (stepProb implementation)
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
    pattern:    props.pattern,
    steps:      props.steps ?? (Array.isArray(props.pattern) ? props.pattern.length : 16),
    step:       0,
    subTick:    0,
    cycleCount: 0,
    prbSeed:    props.seed ?? 0,
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
    // Stretch — only fire on sub-tick 0 of each step interval
    const ticksPerStep = props.stretch !== undefined ? Math.max(1, Math.round(props.stretch)) : 1
    const isFire = state.subTick === 0
    state.subTick = (state.subTick + 1) % ticksPerStep
    if (!isFire) return

    const currentStepNumber = state.step % state.steps

    // Every — at start of new cycle, apply transform if cycle count is divisible by n
    if (
      props.every !== undefined &&
      currentStepNumber === 0 &&
      state.cycleCount > 0 &&
      state.cycleCount % props.every.n === 0 &&
      Array.isArray(state.pattern)
    ) {
      state.pattern = props.every.transform(state.pattern as number[]) as unknown as PatternInput<T>
    }

    // Degrade — seeded per-step probability drop. Step counter advances even when dropped.
    if (props.degrade !== undefined && props.degrade > 0) {
      const degradeSeed = ((currentStepNumber * 1237 + position.bar * 4567) ^ (props.seed ?? 0)) >>> 0
      const [rand] = prngNext(degradeSeed)
      if (rand < props.degrade) {
        state.step += 1  // ADVANCE — dropped steps still count
        return
      }
    }

    // Mask gate — skip step if mask value is falsy at this step
    const maskAllow = (() => {
      if (props.mask === undefined) return true
      if (Array.isArray(props.mask)) {
        const idx = currentStepNumber % props.mask.length
        return Boolean(props.mask[idx])
      }
      return Boolean(props.mask(currentStepNumber, position.bar, props.seed))
    })()

    // StepProb gate — probabilistic gate; PRNG always advances for determinism
    const probAllow = (() => {
      if (props.stepProb === undefined) return true
      const threshold = props.stepProb[currentStepNumber % props.stepProb.length] ?? 1
      const [rand, nextSeed] = prngNext(state.prbSeed)
      state.prbSeed = nextSeed  // ADVANCE — deterministic mutation
      return rand < threshold
    })()

    if (maskAllow && probAllow) {
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

      // Stutter — repeat N-1 additional times evenly spaced within the step window
      if (props.stutter !== undefined && props.stutter > 1) {
        const tickDuration = 60 / transport.bpm / (props.ticksPerBeat ?? 4)
        const stepDuration = tickDuration * ticksPerStep
        for (let i = 1; i < props.stutter; i++) {
          const stutterOffset = (stepDuration * i) / props.stutter
          onStep(value, currentStepNumber, { ...adjustedPosition, time: adjustedPosition.time + stutterOffset })
        }
      }
    }
    state.step += 1  // ADVANCE — the only forward-time mutation permitted
    if (currentStepNumber + 1 >= state.steps) state.cycleCount += 1
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
      state.step       = 0
      state.subTick    = 0
      state.cycleCount = 0
      state.prbSeed    = props.seed ?? 0
    },
  }

  return sequencer
}
