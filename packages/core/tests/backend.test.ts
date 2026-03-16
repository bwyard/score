import { describe, it, expect, afterAll } from 'vitest'
import { webAudioBackend } from '../src/backend/web-audio.js'
import type { BackendContext } from '../src/backend/types.js'
import { runBackendContractTests } from './utils/backendContract.js'

// --- Contract tests (any BackendProvider must pass these) ---
runBackendContractTests(webAudioBackend)

// --- Web Audio-specific tests ---
describe('webAudioBackend (implementation-specific)', () => {
  const contexts: BackendContext[] = []

  const track = <T extends BackendContext>(ctx: T): T => {
    contexts.push(ctx)
    return ctx
  }

  afterAll(async () => {
    await Promise.all(contexts.map((ctx) => ctx.close().catch(() => {})))
  })

  it('throws ScoreError for invalid offline params', () => {
    expect(() => webAudioBackend.createContext({ offline: { length: -1 } })).toThrow()
  })

  it('accepts all noise types without error', () => {
    const ctx = track(webAudioBackend.createContext({ offline: { length: 44100 } }))
    expect(() => ctx.createNoise({ type: 'white' })).not.toThrow()
    expect(() => ctx.createNoise({ type: 'pink' })).not.toThrow()
    expect(() => ctx.createNoise({ type: 'brown' })).not.toThrow()
  })
})
