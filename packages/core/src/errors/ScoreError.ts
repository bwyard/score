export const ScoreError = (
  message: string,
  context: {
    received?: unknown
    fix?: string
    docs?: string
    code?: string
  } = {},
) => {
  const error = new Error(message)
  error.name = 'ScoreError'
  ;(error as any).context = context
  return error
}
