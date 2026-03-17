import { ScoreError } from '@score/core'
import type { SongProps, SongDefinition } from './types.js'

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
