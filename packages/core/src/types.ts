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

// EffectDescriptor — pure data description of an effect, no AudioContext required.
// The engine hydrates these into AudioComponent instances at play time.
// Song files import descriptor factories (Delay, Reverb, etc.) from @score/effects.
export type EffectDescriptor = {
  readonly _type: 'EffectDescriptor'
  readonly effectType: string
  readonly props: Record<string, unknown>
}

/**
 * Song-level context passed to instrument dispatch functions, pattern transforms,
 * and normalization helpers. Replaces individual `bpm`, `seed`, `bars` params
 * threaded separately through each call site.
 *
 * @example
 * ```ts
 * const songCtx: SongContext = { bpm: 128, seed: 42, bars: 8, timeSignature: [4, 4] }
 * createStepSequencer(transport, { ...props, seed: songCtx.seed }, callback)
 * ```
 */
export type SongContext = {
  /** Song tempo in beats per minute. */
  readonly bpm: number
  /**
   * Deterministic seed for stochastic operations (`degrade`, `humanize`, `stepProb`).
   * Always present — defaults to `Date.now()` in `Song()` when not provided.
   */
  readonly seed: number
  /** Current bar number (0-indexed). Set to `0` at song boot, increments each bar. */
  readonly bars: number
  /** Time signature as `[beats, noteValue]`. Default `[4, 4]`. */
  readonly timeSignature: readonly [number, number]
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
