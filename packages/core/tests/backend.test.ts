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

  it('createWaveShaper returns a node with setCurve and setOversample', () => {
    const ctx = h.context()
    const shaper = ctx.createWaveShaper()
    expect(typeof shaper.connect).toBe('function')
    expect(typeof shaper.disconnect).toBe('function')
    expect(typeof shaper.setCurve).toBe('function')
    expect(typeof shaper.setOversample).toBe('function')
  })

  it('createWaveShaper accepts curve and oversample props', () => {
    const ctx = h.context()
    const curve = new Float32Array([-1, 0, 1])
    expect(() => ctx.createWaveShaper({ curve, oversample: '4x' })).not.toThrow()
  })

  it('WaveShaperNode setCurve does not throw', () => {
    const ctx = h.context()
    const shaper = ctx.createWaveShaper()
    expect(() => { shaper.setCurve(new Float32Array([0, 1])) }).not.toThrow()
  })

  it('createStereoPanner returns a node with setPan', () => {
    const ctx = h.context()
    const panner = ctx.createStereoPanner()
    expect(typeof panner.connect).toBe('function')
    expect(typeof panner.disconnect).toBe('function')
    expect(typeof panner.setPan).toBe('function')
  })

  it('createStereoPanner accepts pan prop', () => {
    const ctx = h.context()
    expect(() => ctx.createStereoPanner({ pan: -0.5 })).not.toThrow()
  })

  it('StereoPannerNode setPan does not throw with optional time', () => {
    const ctx = h.context()
    const panner = ctx.createStereoPanner()
    expect(() => { panner.setPan(0.5) }).not.toThrow()
    expect(() => { panner.setPan(-1, 1.0) }).not.toThrow()
  })
})
