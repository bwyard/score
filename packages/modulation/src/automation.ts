// automation — wire a modulation source to a target audio parameter
// Returns a handle to disconnect/dispose without tracking source + param separately

import type { BackendAudioParam } from '@score/core'
import { uid } from '@score/core'
import type { LFOComponent } from './lfo.js'

/**
 * Handle returned by {@link automation}.
 *
 * Call `disconnect()` to stop the modulation while leaving the source running
 * (useful if you want to reconnect later). Call `dispose()` to stop modulation
 * and release all audio nodes.
 */
export type AutomationHandle = {
  /** Unique handle ID. */
  readonly id: string
  /**
   * Disconnect the modulation source from its target.
   * The source LFO is stopped and disconnected but audio nodes are not released.
   */
  readonly disconnect: () => void
  /**
   * Stop the modulation source and release all audio nodes.
   * After dispose the handle is no longer usable.
   */
  readonly dispose: () => void
}

/**
 * Wire an LFO modulation source to a target audio parameter.
 *
 * Connects the source immediately and returns a handle to tear it down later.
 * Use `disconnect()` to pause modulation, or `dispose()` to fully release resources.
 *
 * @param source - LFO component to use as the modulation source.
 * @param param  - Target audio parameter to modulate.
 *   Use `filter.frequencyParam`, `gainNode.gainParam`, etc.
 * @returns {@link AutomationHandle} with `disconnect()` and `dispose()`.
 *
 * @example
 * ```ts
 * import { createLFO, automation } from '@score/modulation'
 *
 * // Filter sweep: LFO wobbles the cutoff frequency
 * const lfo   = createLFO(ctx, { rate: 0.3, shape: 'sine', depth: 800 })
 * const filter = ctx.createFilter({ type: 'lowpass', frequency: 1000 })
 * const auto  = automation(lfo, filter.frequencyParam)
 *
 * // Tremolo: LFO modulates gain
 * const tremolo = createLFO(ctx, { rate: 4, shape: 'sine', depth: 0.4 })
 * const gain    = ctx.createGain({ gain: 1.0 })
 * const tremoloAuto = automation(tremolo, gain.gainParam)
 *
 * // Later — stop the filter sweep:
 * auto.disconnect()
 * ```
 *
 * @see {@link createLFO}   — create the modulation source
 * @see {@link AutomationHandle} — returned handle type
 */
export const automation = (
  source: LFOComponent,
  param:  BackendAudioParam,
): AutomationHandle => {
  source.connect(param)

  return {
    id:         uid('automation'),
    disconnect: () => { source.disconnect() },
    dispose:    () => { source.dispose() },
  }
}
