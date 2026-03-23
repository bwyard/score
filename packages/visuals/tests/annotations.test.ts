// annotations.test.ts — Default annotation source tests

import { describe, it, expect } from 'vitest'
import { defaultAnnotationSource } from '../src/annotations/default-annotations.js'
import type { AudioVisualState } from '../src/types.js'

const makeState = (tracks: AudioVisualState['tracks'] = [], step = 0): AudioVisualState => ({
  waveform: [],
  bins:     [],
  step,
  bar:      0,
  bpm:      128,
  rms:      0,
  tracks,
})

describe('defaultAnnotationSource', () => {
  it('returns empty array when varMap is empty', () => {
    const state = makeState([{ name: 'kick', type: 'kick', active: false, rms: 0, pattern: [1, 0] }])
    expect(defaultAnnotationSource(state, [])).toEqual([])
  })

  it('returns empty array when no tracks have patterns', () => {
    const state = makeState([{ name: 'kick', type: 'kick', active: false, rms: 0 }])
    const varMap = [{ name: 'kick', lineNumber: 5 }]
    expect(defaultAnnotationSource(state, varMap)).toEqual([])
  })

  it('returns empty array when tracks array is empty', () => {
    const state = makeState([])
    const varMap = [{ name: 'kick', lineNumber: 5 }]
    expect(defaultAnnotationSource(state, varMap)).toEqual([])
  })

  it('returns one annotation for one matched track', () => {
    const state = makeState([
      { name: 'kick', type: 'kick', active: true, rms: 0.5, pattern: [1, 0, 1, 0] },
    ])
    const varMap = [{ name: 'kick', lineNumber: 3 }]
    const result = defaultAnnotationSource(state, varMap)
    expect(result).toHaveLength(1)
  })

  it('annotation has correct variableName and lineNumber', () => {
    const state = makeState([
      { name: 'bass', type: 'synth', active: false, rms: 0, pattern: [1, 1] },
    ])
    const varMap = [{ name: 'bass', lineNumber: 7 }]
    const ann = defaultAnnotationSource(state, varMap)[0]!
    expect(ann.variableName).toBe('bass')
    expect(ann.lineNumber).toBe(7)
  })

  it('annotation reflects current step', () => {
    const state = makeState(
      [{ name: 'kick', type: 'kick', active: false, rms: 0, pattern: [1, 0] }],
      4,
    )
    const varMap = [{ name: 'kick', lineNumber: 1 }]
    const ann = defaultAnnotationSource(state, varMap)[0]!
    expect(ann.step).toBe(4)
  })

  it('annotation stores pattern correctly', () => {
    const pat = [1, 0, 1, 1, 0, 0, 1, 0]
    const state = makeState([
      { name: 'kick', type: 'kick', active: false, rms: 0, pattern: pat },
    ])
    const varMap = [{ name: 'kick', lineNumber: 2 }]
    const ann = defaultAnnotationSource(state, varMap)[0]!
    expect(ann.pattern).toEqual(pat)
  })

  it('skips track not present in varMap', () => {
    const state = makeState([
      { name: 'kick', type: 'kick', active: false, rms: 0, pattern: [1, 0] },
      { name: 'bass', type: 'synth', active: false, rms: 0, pattern: [0, 1] },
    ])
    const varMap = [{ name: 'kick', lineNumber: 1 }]
    const result = defaultAnnotationSource(state, varMap)
    expect(result).toHaveLength(1)
    expect(result[0]!.variableName).toBe('kick')
  })

  it('returns annotation for each matched track', () => {
    const state = makeState([
      { name: 'kick', type: 'kick', active: false, rms: 0, pattern: [1, 0] },
      { name: 'snare', type: 'snare', active: false, rms: 0, pattern: [0, 1] },
    ])
    const varMap = [
      { name: 'kick',  lineNumber: 1 },
      { name: 'snare', lineNumber: 2 },
    ]
    const result = defaultAnnotationSource(state, varMap)
    expect(result).toHaveLength(2)
  })

  it('annotation has a color string', () => {
    const state = makeState([
      { name: 'kick', type: 'kick', active: false, rms: 0, pattern: [1] },
    ])
    const varMap = [{ name: 'kick', lineNumber: 1 }]
    const ann = defaultAnnotationSource(state, varMap)[0]!
    expect(typeof ann.color).toBe('string')
    expect(ann.color.startsWith('#')).toBe(true)
  })

  it('skips track with empty pattern', () => {
    const state = makeState([
      { name: 'kick', type: 'kick', active: false, rms: 0, pattern: [] },
    ])
    const varMap = [{ name: 'kick', lineNumber: 1 }]
    expect(defaultAnnotationSource(state, varMap)).toEqual([])
  })
})
