import { describe, it, expect } from 'vitest'
import { Intro, Buildup, Drop, Breakdown, Outro } from '../src/sections.js'
import { Track } from '../src/track.js'
import { createMockComponent } from './utils.js'

describe('Section factories', () => {
  const makeTrack = () => Track(createMockComponent())

  it.each([
    ['Intro',     Intro,     'intro'    ],
    ['Buildup',   Buildup,   'buildup'  ],
    ['Drop',      Drop,      'drop'     ],
    ['Breakdown', Breakdown, 'breakdown'],
    ['Outro',     Outro,     'outro'    ],
  ] as const)('%s sets correct sectionType', (_name, factory, expectedType) => {
    const section = factory(8, [makeTrack()])
    expect(section._type).toBe('SectionDefinition')
    expect(section.sectionType).toBe(expectedType)
    expect(section.bars).toBe(8)
  })

  it('preserves track references (no copies)', () => {
    const track = makeTrack()
    const section = Drop(16, [track])
    expect(section.tracks[0]).toBe(track)
  })

  // Memory leak check: sections are plain data, no retained closures
  it('section holds no closures or hidden state', () => {
    const tracks = [makeTrack(), makeTrack()]
    const section = Drop(32, tracks)
    expect(Object.keys(section)).toEqual(['_type', 'sectionType', 'bars', 'tracks'])
  })
})
