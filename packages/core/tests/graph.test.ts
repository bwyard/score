import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { createAudioGraph } from '../src/graph.js'

const h = useHarness()
afterAll(() => h.cleanup())

describe('createAudioGraph', () => {
  it('returns an AudioGraph with expected methods', () => {
    const graph = createAudioGraph(h.context())
    expect(typeof graph.addNode).toBe('function')
    expect(typeof graph.removeNode).toBe('function')
    expect(typeof graph.connect).toBe('function')
    expect(typeof graph.disconnect).toBe('function')
    expect(typeof graph.getNode).toBe('function')
    expect(typeof graph.dispose).toBe('function')
    graph.dispose()
  })

  it('exposes the BackendContext as context property', () => {
    const ctx = h.context()
    const graph = createAudioGraph(ctx)
    expect(graph.context).toBe(ctx)
    graph.dispose()
  })

  it('auto-registers "destination" node', () => {
    const ctx = h.context()
    const graph = createAudioGraph(ctx)
    expect(graph.getNode('destination')).toBe(ctx.destination)
    graph.dispose()
  })

  describe('addNode', () => {
    it('registers a node retrievable via getNode', () => {
      const ctx = h.context()
      const graph = createAudioGraph(ctx)
      const gain = ctx.createGain()
      graph.addNode('gain1', gain)
      expect(graph.getNode('gain1')).toBe(gain)
      graph.dispose()
    })

    it('throws ScoreError for duplicate id', () => {
      const ctx = h.context()
      const graph = createAudioGraph(ctx)
      graph.addNode('gain', ctx.createGain())
      try {
        graph.addNode('gain', ctx.createGain())
        expect.unreachable('should have thrown')
      } catch (err) {
        h.expectScoreError(err)
      }
      graph.dispose()
    })
  })

  describe('removeNode', () => {
    it('removes the node', () => {
      const ctx = h.context()
      const graph = createAudioGraph(ctx)
      graph.addNode('gain1', ctx.createGain())
      graph.removeNode('gain1')
      expect(graph.getNode('gain1')).toBeUndefined()
      graph.dispose()
    })

    it('throws ScoreError for unknown id', () => {
      const graph = createAudioGraph(h.context())
      try {
        graph.removeNode('nonexistent')
        expect.unreachable('should have thrown')
      } catch (err) {
        h.expectScoreError(err)
      }
      graph.dispose()
    })

    it('throws ScoreError for "destination"', () => {
      const graph = createAudioGraph(h.context())
      try {
        graph.removeNode('destination')
        expect.unreachable('should have thrown')
      } catch (err) {
        h.expectScoreError(err)
      }
      graph.dispose()
    })

    it('disconnects all connections involving the removed node', () => {
      const ctx = h.context()
      const graph = createAudioGraph(ctx)
      graph.addNode('gain1', ctx.createGain())
      graph.addNode('gain2', ctx.createGain())
      graph.connect('gain1', 'gain2')
      graph.connect('gain2', 'destination')
      graph.removeNode('gain2')
      expect(graph.getNode('gain2')).toBeUndefined()
      graph.dispose()
    })
  })

  describe('connect', () => {
    it('connects nodes without throwing', () => {
      const ctx = h.context()
      const graph = createAudioGraph(ctx)
      graph.addNode('gain1', ctx.createGain())
      graph.connect('gain1', 'destination')
      graph.dispose()
    })

    it('throws ScoreError for unknown source', () => {
      const graph = createAudioGraph(h.context())
      try {
        graph.connect('unknown', 'destination')
        expect.unreachable('should have thrown')
      } catch (err) {
        h.expectScoreError(err)
      }
      graph.dispose()
    })

    it('throws ScoreError for unknown destination', () => {
      const ctx = h.context()
      const graph = createAudioGraph(ctx)
      graph.addNode('gain1', ctx.createGain())
      try {
        graph.connect('gain1', 'unknown')
        expect.unreachable('should have thrown')
      } catch (err) {
        h.expectScoreError(err)
      }
      graph.dispose()
    })
  })

  describe('disconnect', () => {
    it('disconnects a specific pair', () => {
      const ctx = h.context()
      const graph = createAudioGraph(ctx)
      graph.addNode('gain1', ctx.createGain())
      graph.addNode('gain2', ctx.createGain())
      graph.connect('gain1', 'gain2')
      graph.connect('gain1', 'destination')
      graph.disconnect('gain1', 'gain2')
      graph.dispose()
    })

    it('disconnects all from source when destId omitted', () => {
      const ctx = h.context()
      const graph = createAudioGraph(ctx)
      graph.addNode('gain1', ctx.createGain())
      graph.addNode('gain2', ctx.createGain())
      graph.connect('gain1', 'gain2')
      graph.connect('gain1', 'destination')
      graph.disconnect('gain1')
      graph.dispose()
    })

    it('throws ScoreError for unknown source', () => {
      const graph = createAudioGraph(h.context())
      try {
        graph.disconnect('unknown')
        expect.unreachable('should have thrown')
      } catch (err) {
        h.expectScoreError(err)
      }
      graph.dispose()
    })
  })

  describe('fan-out and fan-in', () => {
    it('one source to multiple destinations', () => {
      const ctx = h.context()
      const graph = createAudioGraph(ctx)
      graph.addNode('src', ctx.createGain())
      graph.addNode('d1', ctx.createGain())
      graph.addNode('d2', ctx.createGain())
      graph.connect('src', 'd1')
      graph.connect('src', 'd2')
      graph.dispose()
    })

    it('multiple sources to one destination', () => {
      const ctx = h.context()
      const graph = createAudioGraph(ctx)
      graph.addNode('s1', ctx.createGain())
      graph.addNode('s2', ctx.createGain())
      graph.connect('s1', 'destination')
      graph.connect('s2', 'destination')
      graph.dispose()
    })
  })

  describe('dispose', () => {
    it('clears all nodes', () => {
      const ctx = h.context()
      const graph = createAudioGraph(ctx)
      graph.addNode('gain1', ctx.createGain())
      graph.connect('gain1', 'destination')
      graph.dispose()
      expect(graph.getNode('gain1')).toBeUndefined()
      expect(graph.getNode('destination')).toBeUndefined()
    })

    it('addNode throws after dispose', () => {
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

    it('connect throws after dispose', () => {
      const graph = createAudioGraph(h.context())
      graph.dispose()
      try {
        graph.connect('destination', 'destination')
        expect.unreachable('should have thrown')
      } catch (err) {
        h.expectScoreError(err)
      }
    })
  })
})
