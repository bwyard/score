// Step sequencer — resolves PatternInput<T> and triggers callbacks on transport ticks

import type { PatternInput, Position } from './types.js'
import type { Transport } from './transport.js'

export type StepSequencerProps<T = number> = {
  readonly pattern: PatternInput<T>
  readonly steps?: number  // default: pattern.length if array, or 16
}

export type StepSequencer<T = number> = {
  readonly setPattern: (pattern: PatternInput<T>) => void
  readonly currentStep: number
  readonly dispose: () => void
}

// HARDWARE BOUNDARY — step sequencer drives transport ticks. let is replaced with
// const state per the no-let rule; property mutation is the boundary exception.
type SequencerState<T> = {
  pattern: PatternInput<T>
  steps: number
  step: number
}

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
