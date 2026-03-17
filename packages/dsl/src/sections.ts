import type { SectionDefinition, SectionType, TrackComponent } from './types.js'

const makeSection = (sectionType: SectionType) =>
  (bars: number, tracks: TrackComponent[]): SectionDefinition => ({
    _type: 'SectionDefinition',
    sectionType,
    bars,
    tracks,
  })

export const Intro     = makeSection('intro')
export const Buildup   = makeSection('buildup')
export const Drop      = makeSection('drop')
export const Breakdown = makeSection('breakdown')
export const Outro     = makeSection('outro')
