export class WIPError extends Error {
  constructor(
    message: string,
    public readonly context: {
      received?: unknown
      fix?: string
      docs?: string
      code?: string
    } = {},
  ) {
    super(message)
    this.name = 'WIPError'
  }
}
