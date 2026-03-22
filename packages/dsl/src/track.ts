import type { AudioComponent } from '@score/core'
import type { TrackComponent, TrackProps } from './types.js'

/**
 * Wrap an instrument (or any {@link AudioComponent}) in a track with mix settings.
 *
 * `Track` is optional — instrument descriptors can be passed directly to `Song.tracks`
 * without wrapping. Use `Track` when you need to set volume, pan, mute, or solo for
 * a specific instrument without touching the instrument descriptor itself.
 *
 * @param component - The instrument or audio component to wrap.
 * @param props - Optional mix settings: volume, pan, mute, solo.
 * @returns A {@link TrackComponent} combining the component with its mix settings.
 *
 * @example
 * ```ts
 * const kick = Kick({ pattern: [1, 0, 0, 0] })
 *
 * // With explicit mix settings
 * const kickTrack = Track(kick, { volume: 0.9, pan: -0.1 })
 *
 * export default Song({ bpm: 128, tracks: [kickTrack] })
 * ```
 *
 * @see {@link Kick}, {@link Snare}, {@link Synth} — instrument descriptor factories
 * @see {@link Song} — pass the resulting TrackComponent in the `tracks` array
 */
export const Track = (component: AudioComponent, props?: TrackProps): TrackComponent => ({
  _type: 'TrackComponent',
  component,
  ...(props?.volume !== undefined && { volume: props.volume }),
  ...(props?.pan    !== undefined && { pan:    props.pan }),
  ...(props?.mute   !== undefined && { mute:   props.mute }),
  ...(props?.solo   !== undefined && { solo:   props.solo }),
})
