// Test harness for @score/sequencer
// Provides mock BackendContext with mutable currentTime for timing tests

import type { BackendContext } from '@score/core'

// MockContext adds a mutable currentTime via setter
// BackendContext declares currentTime as readonly, but we need to advance it in tests
export type MockContext = Omit<BackendContext, 'currentTime'> & {
  currentTime: number
}

const createMockNode = () => ({
  connect: (_dest: unknown) => {},
  disconnect: (_dest?: unknown) => {},
})

export const mockContext = (): MockContext => {
  let time = 0

  const ctx = {
    get currentTime() { return time },
    set currentTime(value: number) { time = value },
    sampleRate: 44100,
    state: 'running' as const,
    destination: createMockNode(),
    createOscillator: (_props?: {
      type?: 'sine' | 'square' | 'sawtooth' | 'triangle'
      frequency?: number
      detune?: number
    }) => ({
      ...createMockNode(),
      _connectTo: (_destination: unknown) => {},
      frequencyParam: { connectModulator: (_source: unknown) => {}, disconnectModulator: () => {} },
      onended: null,
      start: (_time?: number) => {},
      stop: (_time?: number) => {},
      setFrequency: (_value: number, _time?: number) => {},
      setDetune: (_value: number, _time?: number) => {},
        schedulePitchEnvelope: (_opts: { startFreq: number; endFreq: number; startTime: number; fallTime: number }) => {},
    }),
    createGain: (_props?: { gain?: number }) => ({
      ...createMockNode(),
      gainParam: { connectModulator: (_source: unknown) => {}, disconnectModulator: () => {} },
      gain: _props?.gain ?? 1.0,
      setGain: (_value: number, _time?: number) => {},
      scheduleFade: (_from: number, _to: number, _startTime: number, _endTime: number) => {},
      scheduleEnvelope: (_opts: { peak: number; attack: number; decay: number; sustain: number; release: number; startTime: number; duration: number }) => {},
    }),
    createNoise: (_props?: { type?: 'white' | 'pink' | 'brown' }) => ({
      ...createMockNode(),
      onended: null,
      start: (_time?: number) => {},
      stop: (_time?: number) => {},
    }),
    decodeAudio: (_data: ArrayBuffer) => Promise.resolve({
      duration: 1.0,
      length: 44100,
      sampleRate: 44100,
      numberOfChannels: 1,
    }),
    createBufferSource: (_buffer: unknown, _props?: {
      loop?: boolean
      playbackRate?: number
    }) => ({
      ...createMockNode(),
      start: (_time?: number, _offset?: number, _duration?: number) => {},
      stop: (_time?: number) => {},
      loop: false,
      setLoop: (_loop: boolean) => {},
      setPlaybackRate: (_rate: number, _time?: number) => {},
    }),
    createFilter: (_props?: {
      type?: 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'allpass' | 'peaking' | 'lowshelf' | 'highshelf'
      frequency?: number
      Q?: number
      gain?: number
    }) => ({
      ...createMockNode(),
      frequencyParam: { connectModulator: (_source: unknown) => {}, disconnectModulator: () => {} },
      setFrequency: (_value: number, _time?: number) => {},
      setQ: (_value: number, _time?: number) => {},
      setFilterGain: (_value: number, _time?: number) => {},
      scheduleFilterEnvelope: (_opts: unknown) => {},
      scheduleFilterRelease: (_opts: unknown) => {},
    }),
    createDelay: (_props?: {
      delayTime?: number
      maxDelayTime?: number
    }) => ({
      ...createMockNode(),
      setDelayTime: (_value: number, _time?: number) => {},
    }),
    createCompressor: (_props?: {
      threshold?: number
      ratio?: number
      knee?: number
      attack?: number
      release?: number
    }) => ({
      ...createMockNode(),
      setThreshold: (_value: number, _time?: number) => {},
      setRatio: (_value: number, _time?: number) => {},
      setKnee: (_value: number, _time?: number) => {},
      setAttack: (_value: number, _time?: number) => {},
      setRelease: (_value: number, _time?: number) => {},
    }),
    createWaveShaper: (_props?: {
      curve?: Float32Array
      oversample?: 'none' | '2x' | '4x'
    }) => ({
      ...createMockNode(),
      setCurve: (_curve: Float32Array) => {},
      setOversample: (_value: 'none' | '2x' | '4x') => {},
    }),
    createStereoPanner: (_props?: { pan?: number }) => ({
      ...createMockNode(),
      setPan: (_value: number, _time?: number) => {},
    }),
    createAnalyser: (_props?: { fftSize?: number }) => ({
      connect: (_dest: unknown) => {},
      disconnect: (_dest?: unknown) => {},
      frequencyBinCount: 1024,
      getFloatTimeDomainData: (_array: Float32Array) => {},
    }),
    suspend: () => Promise.resolve(),
    resume: () => Promise.resolve(),
    close: () => Promise.resolve(),
  } satisfies MockContext

  return ctx
}

export const advanceTime = (ctx: MockContext, seconds: number): void => {
  ctx.currentTime = ctx.currentTime + seconds
}

export const cleanup = async (): Promise<void> => {
  // noop — mock contexts don't need cleanup
}
