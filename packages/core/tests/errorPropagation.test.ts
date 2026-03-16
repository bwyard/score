import { describe, it, expect, afterAll } from 'vitest'
import type { BackendContext } from '../src/backend/types.js'
import { webAudioBackend } from '../src/backend/web-audio.js'
import { createAudioContext } from '../src/context.js'
import { createNoise } from '../src/noise.js'
import { decodeSample } from '../src/sample.js'
import { createAudioGraph } from '../src/graph.js'
import type { ScoreErrorInstance } from '../src/errors/ScoreError.js'

// Verify all errors surface as ScoreError with context.fix

const isScoreError = (err: unknown): err is ScoreErrorInstance =>
  err instanceof Error && err.name === 'ScoreError' && 'context' in err

const expectScoreError = (err: unknown): void => {
  expect(isScoreError(err)).toBe(true)
  if (isScoreError(err)) {
    expect(err.context.fix).toBeDefined()
    expect(typeof err.context.fix).toBe('string')
  }
}

describe('Error propagation — all errors are ScoreError with fix', () => {
  const contexts: BackendContext[] = []
  const makeCtx = (): BackendContext => {
    const ctx = createAudioContext({ offline: { length: 44100 } })
    contexts.push(ctx)
    return ctx
  }

  afterAll(async () => {
    await Promise.all(contexts.map((ctx) => ctx.close().catch(() => {})))
  })

  // --- Backend errors ---

  it('webAudioBackend.createContext with invalid params throws ScoreError', () => {
    try {
      webAudioBackend.createContext({ offline: { length: -1 } })
      expect.unreachable('should have thrown')
    } catch (err) {
      expectScoreError(err)
    }
  })

  it('createAudioContext with invalid params throws ScoreError', () => {
    try {
      createAudioContext({ offline: { length: -1 } })
      expect.unreachable('should have thrown')
    } catch (err) {
      expectScoreError(err)
    }
  })

  // --- Noise validation ---

  it('createNoise with invalid type throws ScoreError', () => {
    const ctx = makeCtx()
    try {
      createNoise(ctx, { type: 'invalid' as never })
      expect.unreachable('should have thrown')
    } catch (err) {
      expectScoreError(err)
    }
  })

  // --- Sample decode errors ---

  it('decodeSample with empty data throws ScoreError', async () => {
    const ctx = makeCtx()
    try {
      await decodeSample(ctx, new ArrayBuffer(0))
      expect.unreachable('should have thrown')
    } catch (err) {
      expectScoreError(err)
    }
  })

  it('decodeSample with corrupt data throws ScoreError', async () => {
    const ctx = makeCtx()
    const garbage = new Uint8Array([0, 1, 2, 3, 4, 5]).buffer
    try {
      await decodeSample(ctx, garbage)
      expect.unreachable('should have thrown')
    } catch (err) {
      expectScoreError(err)
    }
  })

  // --- Graph errors ---

  it('graph.addNode with duplicate id throws ScoreError', () => {
    const ctx = makeCtx()
    const graph = createAudioGraph(ctx)
    const gain1 = ctx.createGain()
    const gain2 = ctx.createGain()
    graph.addNode('g', gain1)
    try {
      graph.addNode('g', gain2)
      expect.unreachable('should have thrown')
    } catch (err) {
      expectScoreError(err)
    }
    graph.dispose()
  })

  it('graph.removeNode with unknown id throws ScoreError', () => {
    const ctx = makeCtx()
    const graph = createAudioGraph(ctx)
    try {
      graph.removeNode('nonexistent')
      expect.unreachable('should have thrown')
    } catch (err) {
      expectScoreError(err)
    }
    graph.dispose()
  })

  it('graph.removeNode("destination") throws ScoreError', () => {
    const ctx = makeCtx()
    const graph = createAudioGraph(ctx)
    try {
      graph.removeNode('destination')
      expect.unreachable('should have thrown')
    } catch (err) {
      expectScoreError(err)
    }
    graph.dispose()
  })

  it('graph.connect with unknown source throws ScoreError', () => {
    const ctx = makeCtx()
    const graph = createAudioGraph(ctx)
    try {
      graph.connect('unknown', 'destination')
      expect.unreachable('should have thrown')
    } catch (err) {
      expectScoreError(err)
    }
    graph.dispose()
  })

  it('graph methods after dispose throw ScoreError', () => {
    const ctx = makeCtx()
    const graph = createAudioGraph(ctx)
    graph.dispose()
    const gain = ctx.createGain()

    try {
      graph.addNode('g', gain)
      expect.unreachable('should have thrown')
    } catch (err) {
      expectScoreError(err)
    }

    try {
      graph.connect('destination', 'destination')
      expect.unreachable('should have thrown')
    } catch (err) {
      expectScoreError(err)
    }
  })
})
