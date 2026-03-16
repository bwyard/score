// Core type definitions for @score/core
// Re-exports Web Audio types from node-web-audio-api so consumers don't need to import it directly

import type {
  BaseAudioContext as NodeBaseAudioContext,
  AudioNode as NodeAudioNode,
} from 'node-web-audio-api'

// ScoreAudioContext — accepts both AudioContext and OfflineAudioContext
export type ScoreAudioContext = NodeBaseAudioContext

// Re-export AudioNode for use in component interfaces
export type ScoreAudioNode = NodeAudioNode

// AudioComponent — every component in @score/components, @score/effects, @score/mixer must conform
export type AudioComponent = {
  readonly connect: (destination: ScoreAudioNode) => AudioComponent
  readonly disconnect: () => AudioComponent
  readonly dispose: () => void
}

// GraphNode — an entry in the AudioGraphManager's registry
export type GraphNode = {
  readonly id: string
  readonly node: ScoreAudioNode
  readonly connections: ReadonlyArray<string>
}

// AudioGraph — return type of createAudioGraph
export type AudioGraph = {
  readonly context: ScoreAudioContext
  readonly addNode: (id: string, node: ScoreAudioNode) => void
  readonly removeNode: (id: string) => void
  readonly connect: (sourceId: string, destinationId: string) => void
  readonly disconnect: (sourceId: string, destinationId?: string) => void
  readonly getNode: (id: string) => ScoreAudioNode | undefined
  readonly dispose: () => void
}
