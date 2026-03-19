import { randomUUID } from 'node:crypto'

/**
 * Generate a unique ID for an AudioComponent instance.
 *
 * @param type - Component type prefix (e.g. `'kick'`, `'delay'`, `'channel'`).
 * @returns A unique string of the form `"type-<uuid>"`.
 *
 * @example
 * ```ts
 * uid('kick')    // → 'kick-a1b2c3d4-e5f6-...'
 * uid('delay')   // → 'delay-9f8e7d6c-...'
 * ```
 */
export const uid = (type: string): string => `${type}-${randomUUID()}`
