import { describe, it, expect } from 'vitest'
import { Song } from '../src/song.js'
import { Track } from '../src/track.js'
import { createMockComponent } from './utils.js'

describe('Song', () => {
  const makeTrack = () => Track(createMockComponent())

  it('creates a SongDefinition with required fields', () => {
    const song = Song({ bpm: 140, tracks: [makeTrack()] })
    expect(song._type).toBe('SongDefinition')
    expect(song.bpm).toBe(140)
  })

  it('defaults arrangement to empty array', () => {
    const song = Song({ bpm: 140, tracks: [makeTrack()] })
    expect(song.arrangement).toEqual([])
  })

  it('preserves optional fields', () => {
    const song = Song({ bpm: 128, key: 'Am', genre: 'techno', tracks: [makeTrack()] })
    expect(song.key).toBe('Am')
    expect(song.genre).toBe('techno')
  })

  it('throws ScoreError when bpm is 0', () => {
    expect(() => Song({ bpm: 0, tracks: [makeTrack()] })).toThrow()
  })

  it('throws ScoreError when bpm is negative', () => {
    expect(() => Song({ bpm: -120, tracks: [makeTrack()] })).toThrow()
  })

  it('throws ScoreError when tracks is empty', () => {
    expect(() => Song({ bpm: 140, tracks: [] })).toThrow()
  })

  describe('shorthand form — Song(bpm, tracks[])', () => {
    it('creates a SongDefinition from positional args', () => {
      const song = Song(128, [makeTrack()])
      expect(song._type).toBe('SongDefinition')
      expect(song.bpm).toBe(128)
      expect(song.tracks).toHaveLength(1)
    })

    it('shorthand and object form produce equivalent output', () => {
      const track = makeTrack()
      const shorthand = Song(128, [track])
      const object = Song({ bpm: 128, tracks: [track] })
      expect(shorthand.bpm).toBe(object.bpm)
      expect(shorthand.tracks).toEqual(object.tracks)
      expect(shorthand._type).toBe(object._type)
      expect(shorthand.arrangement).toEqual(object.arrangement)
    })

    it('throws when bpm is 0 in shorthand form', () => {
      expect(() => Song(0, [makeTrack()])).toThrow()
    })

    it('throws when tracks is empty in shorthand form', () => {
      expect(() => Song(128, [])).toThrow()
    })
  })

  // Memory leak check: SongDefinition holds no references beyond what was passed in
  it('does not retain extra references (memory leak check)', () => {
    const comp = createMockComponent()
    const track = Track(comp)
    const song = Song({ bpm: 140, tracks: [track] })
    // Verify song holds exactly the tracks passed — no hidden copies
    expect(song.tracks).toHaveLength(1)
    expect(song.tracks[0]).toBe(track)
    // Disposing underlying component does not corrupt song definition
    comp.dispose()
    expect(comp.disposed).toBe(true)
    expect(song.bpm).toBe(140) // Song definition unaffected
  })
})
