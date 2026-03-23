import { describe, it, expect } from 'vitest'
import { createScoreEngine } from '../src/engine.js'
import { Song, Track, Kick, Synth, Arp } from '@score/dsl'
import { Reverb, Delay } from '@score/effects'

// This test verifies that the engine boots without throwing when effects are
// present in the song. It exercises the real node-web-audio-api audio graph
// — specifically the fix for the createEffectsChain BackendNode cast bug.
// Run at the CLI level (not jsdom) so the real WebAudio path executes.

describe('engine — effects chain integration', () => {
  it('boots without error when Synth has Reverb effect', async () => {
    const song = Song({
      bpm: 128,
      tracks: [
        Track(Synth({
          wave: 'sawtooth', frequency: 65.41,
          pattern: [1, 0, 1, 0],
          effects: [Reverb({ decay: 1.5, mix: 0.25 })],
          gain: 0.6,
        })),
      ],
    })
    await expect(createScoreEngine(song)).resolves.toBeDefined()
  })

  it('boots without error when Arp has Delay effect', async () => {
    const song = Song({
      bpm: 128,
      tracks: [
        Track(Arp({
          notes: ['C3', 'E3', 'G3', 'B3'],
          mode: 'up', rate: 2, wave: 'triangle', gain: 0.4,
          effects: [Delay({ time: 0.25, feedback: 0.35, mix: 0.3 })],
        })),
      ],
    })
    await expect(createScoreEngine(song)).resolves.toBeDefined()
  })

  it('boots without error with full STARTER song (Kick+Synth+Arp with effects)', async () => {
    const song = Song({
      bpm: 128,
      tracks: [
        Track(Kick({ pattern: [1, 0, 0, 0, 1, 0, 0, 0], volume: 0.9 })),
        Track(Synth({
          wave: 'sawtooth', frequency: 65.41,
          pattern: [1, 0, 1, 0, 0, 1, 0, 0],
          effects: [Reverb({ decay: 1.5, mix: 0.25 })],
          gain: 0.6,
        })),
        Track(Arp({
          notes: ['C3', 'E3', 'G3', 'B3'],
          mode: 'up', rate: 2, wave: 'triangle', gain: 0.4,
          effects: [Delay({ time: 0.25, feedback: 0.35, mix: 0.3 })],
        })),
      ],
    })
    await expect(createScoreEngine(song)).resolves.toBeDefined()
  })

  it('disposes engine without error after boot', async () => {
    const song = Song({
      bpm: 128,
      tracks: [
        Track(Synth({
          wave: 'sawtooth', frequency: 440,
          effects: [Reverb({ decay: 1.0, mix: 0.3 })],
          gain: 0.5,
        })),
      ],
    })
    const engine = await createScoreEngine(song)
    expect(() => { engine.dispose(); }).not.toThrow()
  })
})
