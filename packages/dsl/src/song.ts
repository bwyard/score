import { ScoreError } from '@score/core'
import type { SongProps, SongDefinition } from './types.js'

/**
 * Define a complete song — the top-level DSL entry point.
 * Returns a {@link SongDefinition} that the engine renders to audio.
 *
 * Validates that `bpm` is positive and that at least one track is provided.
 * All other fields are optional — `arrangement` defaults to an empty array
 * (the engine loops all tracks indefinitely).
 *
 * @param props - Song configuration including bpm, tracks, and optional arrangement,
 *   key, genre, backend, and XDJ routing.
 * @returns A validated {@link SongDefinition}.
 * @throws `ScoreError` if `bpm` is missing or non-positive.
 * @throws `ScoreError` if `tracks` is empty.
 *
 * @example
 * ```ts
 * export default Song({
 *   bpm: 128,
 *   key: 'Am',
 *   tracks: [kick, snare, hihat, bass],
 *   arrangement: [Intro(4, [kick]), Drop(16, [kick, snare, hihat, bass])],
 * })
 * ```
 *
 * @see {@link Kick}, {@link Snare}, {@link HiHat}, {@link Synth} — instrument factories
 * @see {@link Track} — wrap an instrument with mix settings before passing to tracks
 * @see {@link Intro}, {@link Drop}, {@link Outro} — section factories for arrangement
 */
export const Song = (props: SongProps): SongDefinition => {
  if (!props.bpm || props.bpm <= 0) {
    throw ScoreError('Song bpm must be a positive number', {
      received: props.bpm,
      fix: 'Provide a positive bpm — e.g. Song({ bpm: 140, tracks: [...] })',
      docs: 'https://score.dev/docs/dsl/song',
    })
  }
  if (props.tracks.length === 0) {
    throw ScoreError('Song requires at least one track', {
      received: props.tracks,
      fix: 'Provide an array of tracks — e.g. Song({ bpm: 140, tracks: [kick] })',
      docs: 'https://score.dev/docs/dsl/song',
    })
  }
  return {
    _type: 'SongDefinition',
    bpm: props.bpm,
    tracks: props.tracks,
    arrangement: props.arrangement ?? [],
    ...(props.key     !== undefined && { key:     props.key }),
    ...(props.genre   !== undefined && { genre:   props.genre }),
    ...(props.backend !== undefined && { backend: props.backend }),
    ...(props.xdj     !== undefined && { xdj:     props.xdj }),
  }
}
