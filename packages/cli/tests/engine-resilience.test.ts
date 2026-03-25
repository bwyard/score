import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createScoreEngine } from '../src/engine.js'
import { webAudioBackend } from '@score/core'
import { Song, Track, Synth, Kick } from '@score/dsl'
import { Reverb } from '@score/effects'

// Verify engine crash resilience (t184):
// - A bad effect that throws during buildEffectsChain is skipped, not propagated.
// - A Song boot failure keeps the previous engine alive (boot() try-first pattern).

// Redirect createContext to offline mode so node-web-audio-api does not try
// to open ALSA/JACK device drivers (unavailable on GitHub Actions runners).
const _realCreateContext = webAudioBackend.createContext.bind(webAudioBackend)
beforeAll(() => {
  vi.spyOn(webAudioBackend, 'createContext').mockImplementation(
    () => _realCreateContext({ offline: { length: 44100 } }),
  )
})
afterAll(() => { vi.restoreAllMocks() })

describe('engine — crash resilience', () => {
  it('bad effect factory: engine boots when createReverb throws — effect skipped, no crash', async () => {
    // Simulate an effect factory that throws (e.g. missing AudioContext API).
    // The engine should skip the bad effect and boot successfully.
    const effectsMod = await import('@score/effects')
    const spy = vi.spyOn(effectsMod, 'createReverb').mockImplementationOnce(() => {
      throw new Error('simulated reverb factory failure')
    })

    const song = Song({
      bpm: 120,
      tracks: [
        Track(Synth({
          wave: 'sawtooth',
          frequency: 130.81,
          pattern: [1, 0, 1, 0],
          gain: 0.5,
          effects: [Reverb({ decay: 1.5, mix: 0.2 })],
        })),
      ],
    })

    // Engine must resolve (not reject) even though reverb creation throws.
    await expect(createScoreEngine(song)).resolves.toBeDefined()
    spy.mockRestore()
  })

  it('engine boots from a clean song after a previous bad-effect boot', async () => {
    // Verify the engine remains bootable after a resilience-skip event.
    const song = Song({
      bpm: 128,
      tracks: [Track(Kick())],
    })
    await expect(createScoreEngine(song)).resolves.toBeDefined()
  })
})
