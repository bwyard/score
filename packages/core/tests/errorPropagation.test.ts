import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { webAudioBackend } from '../src/backend/web-audio.js'
import { createAudioContext } from '../src/context.js'
import { createNoise } from '../src/noise.js'
import { decodeSample } from '../src/sample.js'
import { createAudioGraph } from '../src/graph.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('Error propagation — all errors are ScoreError with fix', () => {
  it('webAudioBackend.createContext with invalid params', () => {
    try {
      webAudioBackend.createContext({ offline: { length: -1 } })
      expect.unreachable('should have thrown')
    } catch (err) {
      h.expectScoreError(err)
    }
  })

  it('createAudioContext with invalid params', () => {
    try {
      createAudioContext({ offline: { length: -1 } })
      expect.unreachable('should have thrown')
    } catch (err) {
      h.expectScoreError(err)
    }
  })

  it('createNoise with invalid type', () => {
    try {
      createNoise(h.context(), { type: 'invalid' as never })
      expect.unreachable('should have thrown')
    } catch (err) {
      h.expectScoreError(err)
    }
  })

  it('decodeSample with empty data', async () => {
    try {
      await decodeSample(h.context(), new ArrayBuffer(0))
      expect.unreachable('should have thrown')
    } catch (err) {
      h.expectScoreError(err)
    }
  })

  it('decodeSample with corrupt data', async () => {
    try {
      await decodeSample(h.context(), new Uint8Array([0, 1, 2, 3, 4, 5]).buffer)
      expect.unreachable('should have thrown')
    } catch (err) {
      h.expectScoreError(err)
    }
  })

  it('graph.addNode with duplicate id', () => {
    const ctx = h.context()
    const graph = createAudioGraph(ctx)
    graph.addNode('g', ctx.createGain())
    try {
      graph.addNode('g', ctx.createGain())
      expect.unreachable('should have thrown')
    } catch (err) {
      h.expectScoreError(err)
    }
    graph.dispose()
  })

  it('graph.removeNode with unknown id', () => {
    const graph = createAudioGraph(h.context())
    try {
      graph.removeNode('nonexistent')
      expect.unreachable('should have thrown')
    } catch (err) {
      h.expectScoreError(err)
    }
    graph.dispose()
  })

  it('graph.removeNode("destination")', () => {
    const graph = createAudioGraph(h.context())
    try {
      graph.removeNode('destination')
      expect.unreachable('should have thrown')
    } catch (err) {
      h.expectScoreError(err)
    }
    graph.dispose()
  })

  it('graph.connect with unknown source', () => {
    const graph = createAudioGraph(h.context())
    try {
      graph.connect('unknown', 'destination')
      expect.unreachable('should have thrown')
    } catch (err) {
      h.expectScoreError(err)
    }
    graph.dispose()
  })

  it('graph methods after dispose', () => {
    const ctx = h.context()
    const graph = createAudioGraph(ctx)
    graph.dispose()
    try {
      graph.addNode('g', ctx.createGain())
      expect.unreachable('should have thrown')
    } catch (err) {
      h.expectScoreError(err)
    }
  })
})
