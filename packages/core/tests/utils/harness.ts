// Test harness — single import for all test infrastructure
// Usage: const h = useHarness() at top of describe, afterAll(() => h.cleanup())

import { createAudioContext } from '../../src/context.js'
import type { BackendContext, BackendBuffer } from '../../src/backend/types.js'
import type { ScoreErrorInstance } from '../../src/errors/ScoreError.js'
import {
  createMockBackendContext,
  createMockBuffer,
  createMockBackendNode,
  createMockBackendProvider,
  type MockBackendContext,
} from './audioTestUtils.js'

export type TestHarness = {
  // Real backend context (integration tests) — auto-tracked for cleanup
  readonly context: (opts?: Parameters<typeof createAudioContext>[0]) => BackendContext
  // Mock backend context (unit tests) — no cleanup needed
  readonly mockContext: () => MockBackendContext
  // Mock buffer factory
  readonly mockBuffer: (opts?: {
    duration?: number
    length?: number
    sampleRate?: number
    numberOfChannels?: number
  }) => BackendBuffer
  // Mock node factory
  readonly mockNode: typeof createMockBackendNode
  // Mock provider factory
  readonly mockProvider: typeof createMockBackendProvider
  // Assert error is ScoreError with fix field
  readonly expectScoreError: (err: unknown) => void
  // Cleanup all tracked contexts — call in afterAll
  readonly cleanup: () => Promise<void>
}

export const useHarness = (): TestHarness => {
  const contexts: BackendContext[] = []

  return {
    context: (opts) => {
      const ctx = createAudioContext({ offline: { length: 44100 }, ...opts })
      contexts.push(ctx)
      return ctx
    },

    mockContext: () => createMockBackendContext(),

    mockBuffer: (opts) => createMockBuffer(opts),

    mockNode: createMockBackendNode,

    mockProvider: createMockBackendProvider,

    expectScoreError: (err: unknown) => {
      if (!(err instanceof Error)) {
        throw new Error(`Expected ScoreError, got ${typeof err}`)
      }
      if (err.name !== 'ScoreError') {
        throw new Error(`Expected ScoreError, got ${err.name}: ${err.message}`)
      }
      const ctx = (err as ScoreErrorInstance).context
      if (!ctx.fix || typeof ctx.fix !== 'string') {
        throw new Error(`ScoreError missing fix field: ${err.message}`)
      }
    },

    cleanup: async () => {
      await Promise.all(contexts.map((ctx) => ctx.close().catch(() => {})))
      contexts.length = 0
    },
  }
}
