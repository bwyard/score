export interface ScoreErrorContext {
  received: unknown
  fix: string
  docs: string
  code?: string
}

export interface ScoreErrorInstance extends Error {
  context: ScoreErrorContext
}

export const ScoreError = (
  message: string,
  context: ScoreErrorContext,
): ScoreErrorInstance => {
  const error = new Error(message) as ScoreErrorInstance
  error.name = 'ScoreError'
  error.context = context
  return error
}
