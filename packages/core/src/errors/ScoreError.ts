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

/**
 * Lightweight ScoreError factory for internal engine errors that do not have
 * a user-facing context (received / fix / docs). Use when an error is not caused
 * by song author input — e.g. effect hydration failure, unexpected engine throw.
 *
 * @param message - Human-readable error description.
 * @param cause   - Optional underlying error that caused this one.
 * @returns An `Error` with `name: 'ScoreError'` and optional `cause`.
 */
export const createScoreError = (message: string, cause?: unknown): Error =>
  Object.assign(new Error(message), { name: 'ScoreError', cause })
