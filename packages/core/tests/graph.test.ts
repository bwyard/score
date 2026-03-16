import { describe, it, expect, beforeEach } from 'vitest'
import { createAudioContext } from '../src/context.js'
import { createAudioGraph } from '../src/graph.js'
import type { BackendContext } from '../src/backend/types.js'

describe('createAudioGraph', () => {
  let context: BackendContext

  beforeEach(() => {
    context = createAudioContext({ offline: { length: 44100 } })
  })

  it('returns an AudioGraph object with the expected methods', () => {
    const graph = createAudioGraph(context)
    expect(graph).toHaveProperty('context')
    expect(graph).toHaveProperty('addNode')
    expect(graph).toHaveProperty('removeNode')
    expect(graph).toHaveProperty('connect')
    expect(graph).toHaveProperty('disconnect')
    expect(graph).toHaveProperty('getNode')
    expect(graph).toHaveProperty('dispose')
    expect(typeof graph.addNode).toBe('function')
    expect(typeof graph.removeNode).toBe('function')
    expect(typeof graph.connect).toBe('function')
    expect(typeof graph.disconnect).toBe('function')
    expect(typeof graph.getNode).toBe('function')
    expect(typeof graph.dispose).toBe('function')
    graph.dispose()
  })

  it('exposes the BackendContext as a readonly context property', () => {
    const graph = createAudioGraph(context)
    expect(graph.context).toBe(context)
    graph.dispose()
  })

  it('auto-registers "destination" node from context.destination', () => {
    const graph = createAudioGraph(context)
    const dest = graph.getNode('destination')
    expect(dest).toBeDefined()
    expect(dest).toBe(context.destination)
    graph.dispose()
  })

  describe('addNode', () => {
    it('registers a node retrievable via getNode', () => {
      const graph = createAudioGraph(context)
      const gain = context.createGain()
      graph.addNode('gain1', gain)
      expect(graph.getNode('gain1')).toBe(gain)
      graph.dispose()
    })

    it('throws ScoreError when adding a duplicate id', () => {
      const graph = createAudioGraph(context)
      const gain1 = context.createGain()
      const gain2 = context.createGain()
      graph.addNode('gain', gain1)
      expect(() => graph.addNode('gain', gain2)).toThrow()
      try {
        graph.addNode('gain', gain2)
      } catch (err) {
        expect((err as Error).name).toBe('ScoreError')
        expect((err as { context: { fix: string } }).context.fix).toBeDefined()
      }
      graph.dispose()
    })
  })

  describe('removeNode', () => {
    it('removes the node so getNode returns undefined', () => {
      const graph = createAudioGraph(context)
      const gain = context.createGain()
      graph.addNode('gain1', gain)
      graph.removeNode('gain1')
      expect(graph.getNode('gain1')).toBeUndefined()
      graph.dispose()
    })

    it('throws ScoreError when removing an unknown id', () => {
      const graph = createAudioGraph(context)
      expect(() => graph.removeNode('nonexistent')).toThrow()
      try {
        graph.removeNode('nonexistent')
      } catch (err) {
        expect((err as Error).name).toBe('ScoreError')
        expect((err as { context: { fix: string } }).context.fix).toBeDefined()
      }
      graph.dispose()
    })

    it('throws ScoreError when trying to remove "destination"', () => {
      const graph = createAudioGraph(context)
      expect(() => graph.removeNode('destination')).toThrow()
      try {
        graph.removeNode('destination')
      } catch (err) {
        expect((err as Error).name).toBe('ScoreError')
        expect((err as { context: { fix: string } }).context.fix).toBeDefined()
      }
      graph.dispose()
    })

    it('disconnects all connections involving the removed node', () => {
      const graph = createAudioGraph(context)
      const gain1 = context.createGain()
      const gain2 = context.createGain()
      graph.addNode('gain1', gain1)
      graph.addNode('gain2', gain2)
      graph.connect('gain1', 'gain2')
      graph.connect('gain2', 'destination')
      graph.removeNode('gain2')
      expect(graph.getNode('gain2')).toBeUndefined()
      graph.dispose()
    })
  })

  describe('connect', () => {
    it('connects nodes without throwing', () => {
      const graph = createAudioGraph(context)
      const gain = context.createGain()
      graph.addNode('gain1', gain)
      graph.connect('gain1', 'destination')
      graph.dispose()
    })

    it('throws ScoreError when sourceId is unknown', () => {
      const graph = createAudioGraph(context)
      expect(() => graph.connect('unknown', 'destination')).toThrow()
      try {
        graph.connect('unknown', 'destination')
      } catch (err) {
        expect((err as Error).name).toBe('ScoreError')
        expect((err as { context: { fix: string } }).context.fix).toBeDefined()
      }
      graph.dispose()
    })

    it('throws ScoreError when destId is unknown', () => {
      const graph = createAudioGraph(context)
      const gain = context.createGain()
      graph.addNode('gain1', gain)
      expect(() => graph.connect('gain1', 'unknown')).toThrow()
      try {
        graph.connect('gain1', 'unknown')
      } catch (err) {
        expect((err as Error).name).toBe('ScoreError')
        expect((err as { context: { fix: string } }).context.fix).toBeDefined()
      }
      graph.dispose()
    })
  })

  describe('disconnect', () => {
    it('disconnects a specific source-destination pair', () => {
      const graph = createAudioGraph(context)
      const gain1 = context.createGain()
      const gain2 = context.createGain()
      graph.addNode('gain1', gain1)
      graph.addNode('gain2', gain2)
      graph.connect('gain1', 'gain2')
      graph.connect('gain1', 'destination')
      graph.disconnect('gain1', 'gain2')
      graph.dispose()
    })

    it('disconnects all connections from source when destId is omitted', () => {
      const graph = createAudioGraph(context)
      const gain1 = context.createGain()
      const gain2 = context.createGain()
      graph.addNode('gain1', gain1)
      graph.addNode('gain2', gain2)
      graph.connect('gain1', 'gain2')
      graph.connect('gain1', 'destination')
      graph.disconnect('gain1')
      graph.dispose()
    })

    it('throws ScoreError when sourceId is unknown', () => {
      const graph = createAudioGraph(context)
      expect(() => graph.disconnect('unknown')).toThrow()
      try {
        graph.disconnect('unknown')
      } catch (err) {
        expect((err as Error).name).toBe('ScoreError')
        expect((err as { context: { fix: string } }).context.fix).toBeDefined()
      }
      graph.dispose()
    })
  })

  describe('fan-out and fan-in', () => {
    it('supports fan-out: one source connects to multiple destinations', () => {
      const graph = createAudioGraph(context)
      const source = context.createGain()
      const dest1 = context.createGain()
      const dest2 = context.createGain()
      graph.addNode('source', source)
      graph.addNode('dest1', dest1)
      graph.addNode('dest2', dest2)
      graph.connect('source', 'dest1')
      graph.connect('source', 'dest2')
      graph.dispose()
    })

    it('supports fan-in: multiple sources connect to one destination', () => {
      const graph = createAudioGraph(context)
      const src1 = context.createGain()
      const src2 = context.createGain()
      graph.addNode('src1', src1)
      graph.addNode('src2', src2)
      graph.connect('src1', 'destination')
      graph.connect('src2', 'destination')
      graph.dispose()
    })
  })

  describe('dispose', () => {
    it('disconnects everything and clears the registry', () => {
      const graph = createAudioGraph(context)
      const gain = context.createGain()
      graph.addNode('gain1', gain)
      graph.connect('gain1', 'destination')
      graph.dispose()
      expect(graph.getNode('gain1')).toBeUndefined()
      expect(graph.getNode('destination')).toBeUndefined()
    })

    it('getNode returns undefined for all nodes after dispose', () => {
      const graph = createAudioGraph(context)
      const gain = context.createGain()
      graph.addNode('gain1', gain)
      graph.dispose()
      expect(graph.getNode('gain1')).toBeUndefined()
      expect(graph.getNode('destination')).toBeUndefined()
    })

    it('addNode throws ScoreError after dispose', () => {
      const graph = createAudioGraph(context)
      graph.dispose()
      const gain = context.createGain()
      expect(() => graph.addNode('gain1', gain)).toThrow()
      try {
        graph.addNode('gain1', gain)
      } catch (err) {
        expect((err as Error).name).toBe('ScoreError')
        expect((err as { context: { fix: string } }).context.fix).toBeDefined()
      }
    })

    it('connect throws ScoreError after dispose', () => {
      const graph = createAudioGraph(context)
      graph.dispose()
      expect(() => graph.connect('destination', 'destination')).toThrow()
      try {
        graph.connect('destination', 'destination')
      } catch (err) {
        expect((err as Error).name).toBe('ScoreError')
        expect((err as { context: { fix: string } }).context.fix).toBeDefined()
      }
    })
  })
})
