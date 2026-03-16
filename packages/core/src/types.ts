// Core type definitions for @score/core
// All audio types flow through the BackendProvider abstraction

import type { BackendContext, BackendNode } from './backend/types.js'

// Re-export backend types as Score's public API types
export type ScoreAudioContext = BackendContext
export type ScoreAudioNode = BackendNode

// AudioComponent — every component in @score/components, @score/effects, @score/mixer must conform
export type AudioComponent = {
  readonly id: string
  readonly type: string
  readonly connect: (destination: BackendNode) => AudioComponent
  readonly disconnect: () => AudioComponent
  readonly dispose: () => void
}

// GraphNode — an entry in the AudioGraphManager's registry
export type GraphNode = {
  readonly id: string
  readonly node: BackendNode
  readonly connections: ReadonlyArray<string>
}

// AudioGraph — return type of createAudioGraph
export type AudioGraph = {
  readonly context: BackendContext
  readonly addNode: (id: string, node: BackendNode) => void
  readonly removeNode: (id: string) => void
  readonly connect: (sourceId: string, destinationId: string) => void
  readonly disconnect: (sourceId: string, destinationId?: string) => void
  readonly getNode: (id: string) => BackendNode | undefined
  readonly dispose: () => void
}
