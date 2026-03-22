// Step sequencer — resolves PatternInput<T> and triggers callbacks on transport ticks

import type { PatternInput, Position } from './types.js'
import type { Transport } from './transport.js'

/**
 * Configuration props for {@link createStepSequencer}.
 */
export type StepSequencerProps<T = number> = {
  /** The pattern to sequence — either a static array or a `(step, bar) =\> T` function. */
  readonly pattern: PatternInput<T>
  /** Total number of steps before wrapping. Defaults to `pattern.length` for arrays, or `16`. */
  readonly steps?: number
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
 * @param transport - The {@link Transport} whose tick stream drives the sequencer.
 * @param props     - Sequencer configuration: `pattern` and optional `steps` count.
 * @param onStep    - Callback invoked on every tick with the resolved step value,
 *   the current step index (0-based, wrapping at `steps`), and the transport position.
 * @returns A {@link StepSequencer} instance.
 *
 * @example
 * ```ts
 * const seq = createStepSequencer(
 *   transport,
 *   { pattern: [1, 0, 1, 0, 1, 0, 1, 0] },
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
    return state.pattern(currentStep, bar)
  }

  transport.onTick((position: Position): void => {
    const currentStepNumber = state.step % state.steps
    const value = resolvePattern(currentStepNumber, position.bar)
    onStep(value, currentStepNumber, position)
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
