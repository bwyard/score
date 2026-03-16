import { describe, it, expect, afterAll } from 'vitest'
import { useHarness } from './utils/harness.js'
import { webAudioBackend } from '../src/backend/web-audio.js'
import { runBackendContractTests } from './utils/backendContract.js'

// --- Contract tests (any BackendProvider must pass these) ---
runBackendContractTests(webAudioBackend)

// --- Web Audio-specific tests ---
const h = useHarness()
afterAll(() => h.cleanup())

describe('webAudioBackend (implementation-specific)', () => {
  it('throws ScoreError for invalid offline params', () => {
    expect(() => webAudioBackend.createContext({ offline: { length: -1 } })).toThrow()
  })

  it('accepts all noise types', () => {
    const ctx = h.context()
    expect(() => ctx.createNoise({ type: 'white' })).not.toThrow()
    expect(() => ctx.createNoise({ type: 'pink' })).not.toThrow()
    expect(() => ctx.createNoise({ type: 'brown' })).not.toThrow()
  })
})
