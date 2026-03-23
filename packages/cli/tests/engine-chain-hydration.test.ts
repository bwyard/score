import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createScoreEngine } from '../src/engine.js'
import { webAudioBackend } from '@score/core'
import { Song, Track, createPart } from '@score/dsl'

// Verify that the engine correctly hydrates PartDescriptor (chain API) tracks.
// Chain API instruments return PartDescriptor (_type: 'ChainablePart').
// Old-style instruments return InstrumentDescriptor (_type: 'InstrumentDescriptor').
// Both must coexist and boot cleanly in the same song.
//
// We use createPart() directly so these tests have no dependency on specific
// chain instrument factories (Synth/Arp/Bass303) being exported from @score/dsl.

// Redirect createContext to offline mode so node-web-audio-api does not try
// to open ALSA/JACK device drivers (unavailable on GitHub Actions runners).
const _realCreateContext = webAudioBackend.createContext.bind(webAudioBackend)
beforeAll(() => {
  vi.spyOn(webAudioBackend, 'createContext').mockImplementation(
    () => _realCreateContext({ offline: { length: 44100 } }),
  )
})
afterAll(() => { vi.restoreAllMocks() })

// ── Helpers — chain-API PartDescriptors using known engine instrument types ──

const chainKick = createPart({
  instrumentType: 'kick',
  _pattern: [1, 0, 0, 0, 1, 0, 0, 0],
  _volume: 0.9,
  props: {},
})

const chainSynth = createPart({
  instrumentType: 'synth',
  _pattern: [1, 0, 1, 0, 0, 1, 0, 0],
  _volume: 0.6,
  _notes: ['C2'],
  props: { wave: 'sawtooth' },
})

const chainSnare = createPart({
  instrumentType: 'snare',
  _pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  _volume: 0.7,
  props: {},
})

describe('engine — chain API hydration', () => {
  it('boots with a single PartDescriptor percussion track', async () => {
    const song = Song({
      bpm: 128,
      tracks: [Track(chainKick)],
    })
    await expect(createScoreEngine(song)).resolves.toBeDefined()
  })

  it('boots with a single PartDescriptor melodic track', async () => {
    const song = Song({
      bpm: 128,
      tracks: [Track(chainSynth)],
    })
    await expect(createScoreEngine(song)).resolves.toBeDefined()
  })

  it('boots with multiple PartDescriptor tracks', async () => {
    const song = Song({
      bpm: 128,
      tracks: [
        Track(chainKick),
        Track(chainSynth),
        Track(chainSnare),
      ],
    })
    await expect(createScoreEngine(song)).resolves.toBeDefined()
  })

  it('disposes engine without error after chain API boot', async () => {
    const song = Song({
      bpm: 128,
      tracks: [Track(chainKick), Track(chainSynth)],
    })
    const engine = await createScoreEngine(song)
    expect(() => { engine.dispose() }).not.toThrow()
  })

  it('update() does not throw with PartDescriptor tracks', async () => {
    const chainHiHat = createPart({ instrumentType: 'hihat', _pattern: [1, 1, 1, 1], _volume: 0.4, props: {} })
    const song = Song({
      bpm: 120,
      tracks: [
        Track(chainKick),
        Track(chainSnare),
        Track(chainHiHat),
        Track(chainSynth),
      ],
    })
    const engine = await createScoreEngine(song)
    const nextSong = Song({
      bpm: 130,
      tracks: [
        Track(chainKick),
        Track(chainSnare),
        Track(chainHiHat),
        Track(chainSynth),
      ],
    })
    expect(() => { engine.update(nextSong) }).not.toThrow()
    engine.dispose()
  })
})
