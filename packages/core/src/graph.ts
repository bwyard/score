import { AudioNode } from 'node-web-audio-api'
import { ScoreError } from './errors/ScoreError.js'
import type { AudioGraph, ScoreAudioContext } from './types.js'

export const createAudioGraph = (context: ScoreAudioContext): AudioGraph => {
  const nodes = new Map<string, AudioNode>()
  // connections: sourceId -> Set of destIds
  const connections = new Map<string, Set<string>>()
  const state = { disposed: false }

  // Auto-register destination
  nodes.set('destination', context.destination as unknown as AudioNode)

  const assertNotDisposed = (method: string): void => {
    if (state.disposed) {
      throw ScoreError(`Cannot call ${method} on a disposed AudioGraph`, {
        fix: 'Create a new AudioGraph with createAudioGraph(context) instead of reusing a disposed one.',
      })
    }
  }

  const getNodeOrThrow = (id: string, label: string): AudioNode => {
    const node = nodes.get(id)
    if (!node) {
      throw ScoreError(`${label} "${id}" not found in AudioGraph`, {
        fix: `Register the node first with addNode("${id}", node) before using it.`,
      })
    }
    return node
  }

  const disconnectSourceFromDest = (sourceId: string, destId: string): void => {
    const sourceNode = nodes.get(sourceId)
    const destNode = nodes.get(destId)
    if (sourceNode && destNode) {
      try {
        sourceNode.disconnect(destNode)
      } catch {
        // Already disconnected — safe to ignore
      }
    }
    const sourceConns = connections.get(sourceId)
    if (sourceConns) {
      sourceConns.delete(destId)
      if (sourceConns.size === 0) {
        connections.delete(sourceId)
      }
    }
  }

  const disconnectAllForNode = (nodeId: string): void => {
    // Disconnect outgoing connections
    const outgoing = connections.get(nodeId)
    if (outgoing) {
      const node = nodes.get(nodeId)
      if (node) {
        for (const destId of outgoing) {
          const destNode = nodes.get(destId)
          if (destNode) {
            try {
              node.disconnect(destNode)
            } catch {
              // Already disconnected
            }
          }
        }
      }
      connections.delete(nodeId)
    }

    // Disconnect incoming connections (where nodeId is a destination)
    for (const [sourceId, dests] of connections) {
      if (dests.has(nodeId)) {
        const sourceNode = nodes.get(sourceId)
        const destNode = nodes.get(nodeId)
        if (sourceNode && destNode) {
          try {
            sourceNode.disconnect(destNode)
          } catch {
            // Already disconnected
          }
        }
        dests.delete(nodeId)
        if (dests.size === 0) {
          connections.delete(sourceId)
        }
      }
    }
  }

  const graph: AudioGraph = Object.freeze({
    context,

    addNode: (id: string, node: AudioNode): void => {
      assertNotDisposed('addNode')
      if (nodes.has(id)) {
        throw ScoreError(`Node "${id}" already exists in AudioGraph`, {
          fix: `Use a unique id or remove the existing node first with removeNode("${id}").`,
        })
      }
      nodes.set(id, node)
    },

    removeNode: (id: string): void => {
      assertNotDisposed('removeNode')
      if (id === 'destination') {
        throw ScoreError('Cannot remove the "destination" node', {
          fix: 'The destination node is required and cannot be removed. Remove other nodes instead.',
        })
      }
      if (!nodes.has(id)) {
        throw ScoreError(`Node "${id}" not found in AudioGraph`, {
          fix: `Check that the node id "${id}" is correct and has been added with addNode().`,
        })
      }
      disconnectAllForNode(id)
      nodes.delete(id)
    },

    connect: (sourceId: string, destinationId: string): void => {
      assertNotDisposed('connect')
      const sourceNode = getNodeOrThrow(sourceId, 'Source node')
      const destNode = getNodeOrThrow(destinationId, 'Destination node')
      sourceNode.connect(destNode)
      const existing = connections.get(sourceId) ?? new Set<string>()
      existing.add(destinationId)
      connections.set(sourceId, existing)
    },

    disconnect: (sourceId: string, destinationId?: string): void => {
      assertNotDisposed('disconnect')
      const sourceNode = getNodeOrThrow(sourceId, 'Source node')
      if (destinationId !== undefined) {
        // Disconnect specific pair
        const destNode = nodes.get(destinationId)
        if (destNode) {
          try {
            sourceNode.disconnect(destNode)
          } catch {
            // Already disconnected
          }
        }
        disconnectSourceFromDest(sourceId, destinationId)
      } else {
        // Disconnect all from source
        const outgoing = connections.get(sourceId)
        if (outgoing) {
          for (const destId of outgoing) {
            const destNode = nodes.get(destId)
            if (destNode) {
              try {
                sourceNode.disconnect(destNode)
              } catch {
                // Already disconnected
              }
            }
          }
          connections.delete(sourceId)
        }
      }
    },

    getNode: (id: string): AudioNode | undefined => {
      return nodes.get(id)
    },

    dispose: (): void => {
      // Disconnect all connections
      for (const [sourceId, dests] of connections) {
        const sourceNode = nodes.get(sourceId)
        if (sourceNode) {
          for (const destId of dests) {
            const destNode = nodes.get(destId)
            if (destNode) {
              try {
                sourceNode.disconnect(destNode)
              } catch {
                // Already disconnected
              }
            }
          }
        }
      }
      connections.clear()
      nodes.clear()
      state.disposed = true
    },
  })

  return graph
}
