import type { AudioComponent, ScoreAudioContext, ScoreAudioNode } from '@score/core'
import type { BackendBuffer, BackendBufferSourceNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Configuration for {@link Sample}.
 */
export type SampleProps = {
  /**
   * Whether to loop the buffer continuously after the first playthrough.
   * Default `false`.
   */
  readonly loop?: boolean
  /**
   * Playback speed relative to the buffer's native rate. `1.0` = normal speed,
   * `2.0` = double speed (one octave up), `0.5` = half speed (one octave down).
   * Default `1.0`.
   */
  readonly playbackRate?: number
  /** Output gain 0–1. Default `1.0`. */
  readonly gain?: number
}

/**
 * Sample component — extends {@link AudioComponent} with one-shot buffer playback,
 * real-time playback-rate and gain controls, and access to the underlying buffer.
 *
 * Each call to `start` creates a new internal `BufferSourceNode`, replacing any
 * previously active source (Web Audio buffer sources are single-use).
 */
export type SampleComponent = AudioComponent & {
  /**
   * Start playback of the buffer.
   * Creates a fresh buffer source each time — safe to call repeatedly for retriggering.
   *
   * @param time - Schedule time in seconds. Defaults to `context.currentTime`.
   * @param offset - Start offset within the buffer in seconds. Default `0`.
   * @param duration - How many seconds of audio to play. Omit to play to end (or loop).
   */
  readonly start: (time?: number, offset?: number, duration?: number) => void
  /**
   * Stop playback and release the active buffer source.
   * @param time - Optional schedule time to stop. Defaults to `context.currentTime`.
   */
  readonly stop: (time?: number) => void
  /**
   * Set the playback rate of the active buffer source at runtime.
   * Has no effect if no source is currently active.
   *
   * @param rate - Playback speed multiplier. `1.0` = normal.
   * @param time - Optional schedule time. Defaults to `context.currentTime`.
   */
  readonly setPlaybackRate: (rate: number, time?: number) => void
  /**
   * Set the output gain at runtime.
   * @param value - Gain 0–1.
   * @param time - Optional schedule time. Defaults to `context.currentTime`.
   */
  readonly setGain: (value: number, time?: number) => void
  /** The decoded audio buffer passed at construction time. */
  readonly buffer: BackendBuffer
}

/**
 * Create a Sample component — a one-shot (or looping) decoded audio buffer player.
 * Signal path: buffer source → gain → (caller connects output).
 * Each `start()` call creates a new `BackendBufferSourceNode`; the previous source
 * is stopped and released automatically before the new one is created.
 *
 * @param context - Backend audio context providing the Web Audio graph.
 * @param buffer - Pre-decoded audio buffer to play back.
 * @param props - Optional playback configuration. If omitted all defaults apply.
 * @returns A {@link SampleComponent} with `id` prefixed `sample` and `type` set to `'sample'`.
 *
 * @example
 * ```ts
 * const buffer = await context.decodeAudioData(rawAudioData)
 * const sample = Sample(context, buffer, { loop: false, playbackRate: 1.0, gain: 0.9 })
 * sample.connect(context.destination)
 * // Trigger once at the current time
 * sample.start(context.currentTime)
 * // Retrigger 2 seconds later — automatically stops the previous source
 * sample.start(context.currentTime + 2)
 * // Clean up
 * sample.dispose()
 * ```
 *
 * @see {@link SampleProps} — configuration options
 * @see {@link SampleComponent} — returned component shape
 * @see {@link Kick} — kick drum convenience wrapper around Sample
 * @see {@link Snare} — snare drum convenience wrapper around Sample
 * @see {@link HiHat} — hi-hat convenience wrapper around Sample
 */
export const Sample = (
  context: ScoreAudioContext,
  buffer: BackendBuffer,
  props?: SampleProps,
): SampleComponent => {
  const gainNode   = context.createGain({ gain: props?.gain ?? 1.0 })
  const sourceRef  = { value: null as BackendBufferSourceNode | null }

  const component: SampleComponent = {
    id: uid('sample'),
    type: 'sample' as const,
    buffer,

    start: (time?: number, offset?: number, duration?: number) => {
      // Clean up previous source (Web Audio sources are one-shot)
      if (sourceRef.value) {
        try { sourceRef.value.stop() } catch { /* already stopped */ }
        try { sourceRef.value.disconnect() } catch { /* already disconnected */ }
      }
      sourceRef.value = context.createBufferSource(buffer, {
        loop: props?.loop ?? false,
        playbackRate: props?.playbackRate ?? 1.0,
      })
      sourceRef.value.connect(gainNode)
      sourceRef.value.start(time, offset, duration)
    },

    stop: (time?: number) => {
      if (sourceRef.value) {
        try {
          sourceRef.value.stop(time)
        } catch {
          // Already stopped
        }
        sourceRef.value = null
      }
    },

    setPlaybackRate: (rate: number, time?: number) => {
      if (sourceRef.value) {
        sourceRef.value.setPlaybackRate(rate, time)
      }
    },

    setGain: (value: number, time?: number) => {
      gainNode.setGain(value, time)
    },

    connect: (destination: ScoreAudioNode) => {
      gainNode.connect(destination)
      return component
    },

    disconnect: () => {
      try {
        gainNode.disconnect()
      } catch {
        // Already disconnected
      }
      return component
    },

    dispose: () => {
      if (sourceRef.value) {
        try { sourceRef.value.stop() } catch { /* already stopped */ }
        try { sourceRef.value.disconnect() } catch { /* already disconnected */ }
        sourceRef.value = null
      }
      try {
        gainNode.disconnect()
      } catch {
        // Already disconnected
      }
    },
  }

  return component
}
