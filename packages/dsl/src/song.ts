import { ScoreError } from '@score/core'
import type { SongProps, SongDefinition, TrackComponent, InstrumentDescriptor } from './types.js'
import type { ChainablePart } from './chain.js'

/** Track types accepted by the `Song()` shorthand positional form. */
type ShorthandTrack = TrackComponent | InstrumentDescriptor | ChainablePart

/**
 * Define a complete song — the top-level DSL entry point.
 * Returns a {@link SongDefinition} that the engine renders to audio.
 *
 * Validates that `bpm` is positive and that at least one track is provided.
 * All other fields are optional — `arrangement` defaults to an empty array
 * (the engine loops all tracks indefinitely).
 *
 * **Two call forms:**
 * ```ts
 * // Object form — full control over all props
 * export default Song({ bpm: 128, key: 'Am', tracks: [kick, snare] })
 *
 * // Shorthand form — bpm + tracks as positional args (live coding)
 * export default Song(128, [kick, snare, hihat, bass])
 * ```
 *
 * @param propsOrBpm - Either a full {@link SongProps} object, or a BPM number for the shorthand form.
 * @param shorthandTracks - When `propsOrBpm` is a number, the tracks array for the shorthand form.
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
export const Song = (
  propsOrBpm: SongProps | number,
  shorthandTracks?: ReadonlyArray<ShorthandTrack>,
): SongDefinition => {
  const props: SongProps = typeof propsOrBpm === 'number'
    ? { bpm: propsOrBpm, tracks: (shorthandTracks ?? []) as ReadonlyArray<TrackComponent | InstrumentDescriptor> }
    : propsOrBpm
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
  const seed = props.seed ?? Date.now()
  if (props.seed === undefined) {
    // BOUNDARY — IO: log resolved seed so artist can replay exact groove
    console.log(`Score: Song loaded — seed: ${String(seed)} (add seed: ${String(seed)} to Song props to replay)`)
  }
  return {
    _type: 'SongDefinition',
    bpm: props.bpm,
    tracks: props.tracks,
    arrangement: props.arrangement ?? [],
    seed,
    ...(props.key     !== undefined && { key:     props.key }),
    ...(props.genre   !== undefined && { genre:   props.genre }),
    ...(props.backend !== undefined && { backend: props.backend }),
    ...(props.xdj     !== undefined && { xdj:     props.xdj }),
    ...(props.theme   !== undefined && { theme:   props.theme }),
    ...(props.palette !== undefined && { palette: props.palette }),
  }
}
