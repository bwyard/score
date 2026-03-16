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

export const createStepSequencer = <T = number>(
  transport: Transport,
  props: StepSequencerProps<T>,
  onStep: (value: T, step: number, position: Position) => void,
): StepSequencer<T> => {
  // Mutable state
  let currentPattern: PatternInput<T> = props.pattern
  let steps = props.steps ?? (Array.isArray(props.pattern) ? props.pattern.length : 16)
  let step = 0

  const resolvePattern = (currentStep: number, bar: number): T => {
    if (Array.isArray(currentPattern)) {
      // Guard clause: ensure safe array access
      const index = currentStep % currentPattern.length
      const value = currentPattern[index]
      // Safe: index is always within bounds due to modulo with non-zero length
      return value as T
    }
    return currentPattern(currentStep, bar)
  }

  transport.onTick((position: Position): void => {
    const currentStepNumber = step % steps
    const value = resolvePattern(currentStepNumber, position.bar)
    onStep(value, currentStepNumber, position)
    step += 1
  })

  const sequencer: StepSequencer<T> = {
    setPattern: (pattern: PatternInput<T>): void => {
      currentPattern = pattern
      if (Array.isArray(pattern)) {
        steps = props.steps ?? pattern.length
      }
    },

    get currentStep() { return step },

    dispose: (): void => {
      // Reset state — transport owns the tick subscription lifecycle
      step = 0
    },
  }

  return sequencer
}
