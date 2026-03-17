import type { AudioComponent } from '@score/core'
import type { TrackComponent, TrackProps } from './types.js'

export const Track = (component: AudioComponent, props?: TrackProps): TrackComponent => ({
  _type: 'TrackComponent',
  component,
  ...(props?.volume !== undefined && { volume: props.volume }),
  ...(props?.pan    !== undefined && { pan:    props.pan }),
  ...(props?.mute   !== undefined && { mute:   props.mute }),
  ...(props?.solo   !== undefined && { solo:   props.solo }),
})
