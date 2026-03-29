// display-tick.ts — Throttled display tick for Score Studio renderer
//
// Decouples the audio engine tick rate from the renderer display rate.
// The audio engine fires onStep at the full sequencer rate (up to ~80/sec at 300 BPM,
// higher still with 32-step patterns). createDisplayTick sets up a setInterval at ~60fps
// (16ms) that sends the latest cached step state to the renderer via both IPC channels:
//
//   - 'display:tick' — used by LiveCode + PerformanceMode visualizers
//   - 'engine:tick'  — used by ConsoleLogPanel (bar boundary detection)
//
// Both channels carry identical payloads and fire from the same throttled loop.
// Sending both ensures no component is forced to choose between them.
//
// Isolation note (t335): this module is intentionally self-contained. It has no deps on
// the rest of main/index.ts beyond the send function and TickCache type. When the
// @ecosystem/tick package is created, this file extracts directly with no structural change.
//
// HARDWARE BOUNDARY: send() crosses the Electron main→renderer IPC boundary.

import type { MainToRenderer } from './ipc-types.js'

// ── Types ──────────────────────────────────────────────────────────────────────

/**
 * Mutable cache of the latest audio tick state.
 *
 * Written by the engine's `onStep` callback at the full audio tick rate.
 * Read by the display loop at ~60fps. The `dirty` flag prevents redundant
 * IPC sends when the engine is paused or the audio rate is below 60fps.
 */
export type TickCache = {
  step:      number
  stepCount: number
  bar:       number
  beat:      number
  bpm:       number
  /** Set to `true` by onStep; reset to `false` after each display send. */
  dirty:     boolean
}

/** Start/stop handle returned by {@link createDisplayTick}. */
export type DisplayTick = {
  /** Start the display tick loop. Safe to call multiple times — no-op if already running. */
  readonly start: () => void
  /** Stop the display tick loop. Safe to call multiple times — no-op if not running. */
  readonly stop:  () => void
}

// ── Constants ──────────────────────────────────────────────────────────────────

/** Display tick interval in ms. Caps renderer updates at ~60fps. */
const DISPLAY_TICK_MS = 16

// ── Factory ────────────────────────────────────────────────────────────────────

/**
 * Create a throttled display tick loop.
 *
 * The audio engine writes step state to `cache.dirty = true` on every sequencer step —
 * no IPC involved. This factory's `start()` creates a `setInterval` at ~60fps that
 * reads the cache and sends `'display:tick'` to the renderer only when new data has arrived.
 *
 * @param send  - Typed IPC send from `main/index.ts`.
 * @param cache - Mutable tick cache shared with the audio engine's `onStep` callback.
 * @returns A `DisplayTick` handle. Call `start()` when engine boots, `stop()` on teardown.
 *
 * @example
 * ```ts
 * // Module level:
 * const tickCache: TickCache = { step: 0, stepCount: 16, bar: 0, beat: 0, bpm: 120, dirty: false }
 * const displayTick = createDisplayTick(send, tickCache)
 *
 * // In boot():
 * displayTick.start()
 *
 * // In teardown():
 * displayTick.stop()
 *
 * // In engine.onStep():
 * tickCache.step      = step
 * tickCache.stepCount = stepCount
 * tickCache.dirty     = true
 * ```
 */
export const createDisplayTick = (
  send:  <K extends keyof MainToRenderer>(channel: K, payload: MainToRenderer[K]) => void,
  cache: TickCache,
): DisplayTick => {
  const handleRef: { value: ReturnType<typeof setInterval> | null } = { value: null }

  const start = (): void => {
    if (handleRef.value !== null) return
    handleRef.value = setInterval(() => {
      if (!cache.dirty) return
      cache.dirty = false
      // HARDWARE BOUNDARY — IPC send to renderer (both channels, same throttled payload)
      const payload = {
        step:      cache.step,
        stepCount: cache.stepCount,
        bar:       cache.bar,
        beat:      cache.beat,
        bpm:       cache.bpm,
      }
      send('display:tick', payload)
      send('engine:tick',  payload)
    }, DISPLAY_TICK_MS)
  }

  const stop = (): void => {
    if (handleRef.value === null) return
    clearInterval(handleRef.value)
    handleRef.value = null
  }

  return { start, stop }
}
