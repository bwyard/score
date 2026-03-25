import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createScoreEngine, partToInstrumentDescriptor } from '../src/engine.js'
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

  it('_filter chain method maps to props.filter for SubSynth (fix: was silently dropped)', () => {
    // SubSynth('A2').filter(600, 2) sets _filter on the PartDescriptor.
    // Before the fix, partToInstrumentDescriptor did not map _filter at all.
    const part = createPart({
      instrumentType: 'subsynth',
      _filter: { frequency: 600, Q: 2 },
      props: {},
    })
    const desc = partToInstrumentDescriptor(part)
    const props = desc.props as Record<string, unknown>
    expect(props['filter']).toEqual({ frequency: 600, Q: 2 })
  })

  it('_filter chain method maps to props.cutoff+resonance for bass-303', () => {
    // If _filter is set on a bass-303 part, it should map to props.cutoff/resonance
    // because the bass-303 engine reads those props, not props.filter.
    const part = createPart({
      instrumentType: 'bass-303',
      _filter: { frequency: 400, Q: 4 },
      props: {},
    })
    const desc = partToInstrumentDescriptor(part)
    const props = desc.props as Record<string, unknown>
    expect(props['cutoff']).toBe(400)
    expect(props['resonance']).toBe(4)
  })

  it('t147: onStep fires with PartDescriptor-only song (cursor advance fix)', async () => {
    // Before the fix, PartDescriptor tracks were dropped from descriptors in
    // createScoreEngine(), so cursorStepCount defaulted to 8 and no instruments
    // played. This test verifies onStep fires when tracks are ChainablePart only.
    const song = Song({
      bpm: 128,
      tracks: [Track(chainKick), Track(chainSnare)],
    })
    const engine = await createScoreEngine(song)
    const steps: number[] = []
    engine.onStep((step, _stepCount) => { steps.push(step) })
    engine.start()
    // Advance transport enough to collect a step
    await new Promise(resolve => { setTimeout(resolve, 200) })
    engine.stop()
    engine.dispose()
    expect(steps.length).toBeGreaterThan(0)
  })
})
