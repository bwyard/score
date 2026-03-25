import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { createScoreEngine, partToInstrumentDescriptor } from '../src/engine.js'
import { webAudioBackend } from '@score/core'
import { Song, Track, createPart } from '@score/dsl'

// ── Setup — offline audio context to avoid ALSA/JACK on CI ──────────────────

const _realCreateContext = webAudioBackend.createContext.bind(webAudioBackend)
beforeAll(() => {
  vi.spyOn(webAudioBackend, 'createContext').mockImplementation(
    () => _realCreateContext({ offline: { length: 44100 } }),
  )
})
afterAll(() => { vi.restoreAllMocks() })
beforeEach(() => { vi.clearAllMocks() })

// ── Helpers ───────────────────────────────────────────────────────────────────

type PartOpts = Partial<Omit<Parameters<typeof createPart>[0], 'instrumentType'>>

const makeKick = (overrides: PartOpts = {}) =>
  createPart({
    instrumentType: 'kick' as const,
    _pattern: [1, 0, 0, 0, 1, 0, 0, 0],
    props: {},
    ...overrides,
  })

const makeHat = (overrides: PartOpts = {}) =>
  createPart({
    instrumentType: 'hihat' as const,
    _pattern: [1, 1, 1, 1, 1, 1, 1, 1],
    props: {},
    ...overrides,
  })

// ── partToInstrumentDescriptor — field threading ──────────────────────────────

describe('partToInstrumentDescriptor — arrangement-timing fields', () => {
  it('threads _fromBar', () => {
    const part = makeKick({ _fromBar: 4 })
    expect(partToInstrumentDescriptor(part)._fromBar).toBe(4)
  })

  it('threads _untilBar', () => {
    const part = makeKick({ _untilBar: 8 })
    expect(partToInstrumentDescriptor(part)._untilBar).toBe(8)
  })

  it('threads _fadeInBars', () => {
    const part = makeKick({ _fadeInBars: 2 })
    expect(partToInstrumentDescriptor(part)._fadeInBars).toBe(2)
  })

  it('threads _fadeOutBars', () => {
    const part = makeKick({ _fadeOutBars: 2 })
    expect(partToInstrumentDescriptor(part)._fadeOutBars).toBe(2)
  })

  it('threads _chokeGroup', () => {
    const part = makeHat({ _chokeGroup: 'hat' })
    expect(partToInstrumentDescriptor(part)._chokeGroup).toBe('hat')
  })

  it('omits undefined fields', () => {
    const desc = partToInstrumentDescriptor(makeKick())
    expect(desc._fromBar).toBeUndefined()
    expect(desc._untilBar).toBeUndefined()
    expect(desc._chokeGroup).toBeUndefined()
  })
})

// ── Engine boot — fromBar / untilBar ─────────────────────────────────────────

describe('engine — fromBar / untilBar gating', () => {
  it('boots when a track has _fromBar set', async () => {
    const song = Song({
      bpm: 128,
      tracks: [Track(makeKick({ _fromBar: 4 }))],
    })
    const engine = await createScoreEngine(song)
    expect(engine).toBeDefined()
    engine.dispose()
  })

  it('boots when a track has both _fromBar and _untilBar', async () => {
    const song = Song({
      bpm: 128,
      tracks: [
        Track(makeKick({ _fromBar: 0, _untilBar: 8 })),
        Track(makeHat({ _fromBar: 4, _untilBar: 16 })),
      ],
    })
    const engine = await createScoreEngine(song)
    expect(engine).toBeDefined()
    engine.dispose()
  })

  it('boots when only _untilBar is set (plays from bar 0)', async () => {
    const song = Song({
      bpm: 128,
      tracks: [Track(makeKick({ _untilBar: 8 }))],
    })
    const engine = await createScoreEngine(song)
    expect(engine).toBeDefined()
    engine.dispose()
  })

  it('tracks without bar gating are unaffected when others have it', async () => {
    const song = Song({
      bpm: 128,
      tracks: [
        Track(makeKick({ _fromBar: 4 })),
        Track(makeHat()),
      ],
    })
    const engine = await createScoreEngine(song)
    expect(engine).toBeDefined()
    engine.dispose()
  })
})

// ── Engine boot — fadeIn / fadeOut ───────────────────────────────────────────

describe('engine — fadeIn / fadeOut', () => {
  it('boots when a track has _fadeInBars', async () => {
    const song = Song({
      bpm: 128,
      tracks: [Track(makeKick({ _fromBar: 0, _fadeInBars: 2 }))],
    })
    const engine = await createScoreEngine(song)
    expect(engine).toBeDefined()
    engine.dispose()
  })

  it('boots when a track has _fadeOutBars', async () => {
    const song = Song({
      bpm: 128,
      tracks: [Track(makeKick({ _untilBar: 8, _fadeOutBars: 2 }))],
    })
    const engine = await createScoreEngine(song)
    expect(engine).toBeDefined()
    engine.dispose()
  })

  it('boots when a track has both _fadeInBars and _fadeOutBars', async () => {
    const song = Song({
      bpm: 128,
      tracks: [Track(makeKick({ _fromBar: 0, _untilBar: 8, _fadeInBars: 2, _fadeOutBars: 2 }))],
    })
    const engine = await createScoreEngine(song)
    expect(engine).toBeDefined()
    engine.dispose()
  })
})

// ── Engine boot — chokeGroup ──────────────────────────────────────────────────

describe('engine — chokeGroup', () => {
  it('boots when two hihat tracks share a choke group', async () => {
    const song = Song({
      bpm: 128,
      tracks: [
        Track(makeHat({ _chokeGroup: 'hat', props: { open: false } })),
        Track(makeHat({ _chokeGroup: 'hat', props: { open: true } })),
      ],
    })
    const engine = await createScoreEngine(song)
    expect(engine).toBeDefined()
    engine.dispose()
  })

  it('boots when multiple choke groups coexist', async () => {
    const song = Song({
      bpm: 128,
      tracks: [
        Track(makeHat({ _chokeGroup: 'hat' })),
        Track(makeHat({ _chokeGroup: 'hat' })),
        Track(makeKick({ _chokeGroup: 'kick' })),
        Track(makeKick({ _chokeGroup: 'kick' })),
      ],
    })
    const engine = await createScoreEngine(song)
    expect(engine).toBeDefined()
    engine.dispose()
  })

  it('boots when a track has no choke group alongside tracks that do', async () => {
    const song = Song({
      bpm: 128,
      tracks: [
        Track(makeHat({ _chokeGroup: 'hat' })),
        Track(makeHat({ _chokeGroup: 'hat' })),
        Track(makeKick()),
      ],
    })
    const engine = await createScoreEngine(song)
    expect(engine).toBeDefined()
    engine.dispose()
  })
})
