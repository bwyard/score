/**
 * Generate a unique ID for an AudioComponent instance.
 *
 * Uses `globalThis.crypto.randomUUID()` — available in Node.js 19+ and all
 * modern browsers. This keeps `@score/core` isomorphic: no Node.js built-ins
 * in the import graph, so the renderer bundle compiles cleanly.
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
export const uid = (type: string): string => `${type}-${globalThis.crypto.randomUUID()}`
