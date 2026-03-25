// Mock factories for BackendProvider/BackendContext
// Used across all @score/* package tests — no real AudioContext required

import type {
  BackendAudioParam,
  BackendBuffer,
  BackendBufferSourceNode,
  BackendCompressorNode,
  BackendContext,
  BackendDelayNode,
  BackendFilterNode,
  BackendGainNode,
  BackendNode,
  BackendNoiseNode,
  BackendOscillatorNode,
  BackendProvider,
  BackendWaveShaperNode,
  BackendStereoPannerNode,
} from '../../src/backend/types.js'

// --- Track calls for assertions ---

export type MockConnectCall = { readonly destination: BackendNode }
export type MockDisconnectCall = { readonly destination: BackendNode | undefined }

export type MockBackendNode = BackendNode & {
  readonly connectCalls: Array<MockConnectCall>
  readonly disconnectCalls: Array<MockDisconnectCall>
}

export type MockBackendOscillatorNode = MockBackendNode & BackendOscillatorNode & {
  readonly startCalls: Array<{ readonly time: number | undefined }>
  readonly stopCalls: Array<{ readonly time: number | undefined }>
}

export type MockBackendGainNode = MockBackendNode & BackendGainNode

export type MockBackendNoiseNode = MockBackendNode & BackendNoiseNode & {
  readonly startCalls: Array<{ readonly time: number | undefined }>
  readonly stopCalls: Array<{ readonly time: number | undefined }>
}

export type MockBackendBufferSourceNode = MockBackendNode & BackendBufferSourceNode & {
  readonly startCalls: Array<{ readonly time: number | undefined; readonly offset: number | undefined; readonly duration: number | undefined }>
  readonly stopCalls: Array<{ readonly time: number | undefined }>
}

export type MockBackendFilterNode = MockBackendNode & BackendFilterNode

export type MockBackendDelayNode = MockBackendNode & BackendDelayNode

export type MockBackendCompressorNode = MockBackendNode & BackendCompressorNode

export type MockBackendWaveShaperNode = MockBackendNode & BackendWaveShaperNode

export type MockBackendStereoPannerNode = MockBackendNode & BackendStereoPannerNode

export type MockBackendContext = BackendContext & {
  readonly createdOscillators: Array<MockBackendOscillatorNode>
  readonly createdGains: Array<MockBackendGainNode>
  readonly createdNoises: Array<MockBackendNoiseNode>
  readonly createdBufferSources: Array<MockBackendBufferSourceNode>
  readonly createdFilters: Array<MockBackendFilterNode>
  readonly createdDelays: Array<MockBackendDelayNode>
  readonly createdCompressors: Array<MockBackendCompressorNode>
  readonly createdWaveShapers: Array<MockBackendWaveShaperNode>
  readonly createdStereoPanners: Array<MockBackendStereoPannerNode>
}

// --- Factory functions ---

export const createMockBackendNode = (): MockBackendNode => {
  const connectCalls: Array<MockConnectCall> = []
  const disconnectCalls: Array<MockDisconnectCall> = []

  return {
    connectCalls,
    disconnectCalls,
    connect: (dest: BackendNode) => { connectCalls.push({ destination: dest }) },
    disconnect: (dest?: BackendNode) => { disconnectCalls.push({ destination: dest }) },
  }
}

export const createMockOscillatorNode = (): MockBackendOscillatorNode => {
  const base = createMockBackendNode()
  const startCalls: Array<{ readonly time: number | undefined }> = []
  const stopCalls: Array<{ readonly time: number | undefined }> = []

  return {
    ...base,
    startCalls,
    stopCalls,
    _connectTo: (_destination: unknown) => {},
    frequencyParam: { connectModulator: (_source: unknown) => {}, disconnectModulator: () => {} },
    onended: null,
    start: (time?: number) => { startCalls.push({ time }) },
    stop: (time?: number) => { stopCalls.push({ time }) },
    setFrequency: (_value: number, _time?: number) => {},
    setDetune: (_value: number, _time?: number) => {},
    schedulePitchEnvelope: (_opts: { startFreq: number; endFreq: number; startTime: number; fallTime: number }) => {},
  }
}

const createMockAudioParam = (): BackendAudioParam => ({
  connectModulator: (_source: BackendNode) => {},
  disconnectModulator: () => {},
})

export const createMockGainNode = (initialGain = 1.0): MockBackendGainNode => {
  const base = createMockBackendNode()
  let currentGain = initialGain

  return {
    ...base,
    gainParam: createMockAudioParam(),
    get gain() { return currentGain },
    setGain: (value: number, _time?: number) => { currentGain = value },
    scheduleEnvelope: ({ peak }: { peak: number; attack: number; decay: number; sustain: number; release: number; startTime: number; duration: number }) => { currentGain = peak },
  }
}

export const createMockNoiseNode = (): MockBackendNoiseNode => {
  const base = createMockBackendNode()
  const startCalls: Array<{ readonly time: number | undefined }> = []
  const stopCalls: Array<{ readonly time: number | undefined }> = []

  return {
    ...base,
    startCalls,
    stopCalls,
    onended: null,
    start: (time?: number) => { startCalls.push({ time }) },
    stop: (time?: number) => { stopCalls.push({ time }) },
  }
}

export const createMockBuffer = (options?: {
  duration?: number
  length?: number
  sampleRate?: number
  numberOfChannels?: number
}): BackendBuffer => ({
  duration: options?.duration ?? 1.0,
  length: options?.length ?? 44100,
  sampleRate: options?.sampleRate ?? 44100,
  numberOfChannels: options?.numberOfChannels ?? 1,
})

export const createMockBufferSourceNode = (): MockBackendBufferSourceNode => {
  const base = createMockBackendNode()
  const startCalls: MockBackendBufferSourceNode['startCalls'] = []
  const stopCalls: Array<{ readonly time: number | undefined }> = []
  let loopState = false

  return {
    ...base,
    startCalls,
    stopCalls,
    get loop() { return loopState },
    setLoop: (loop: boolean) => { loopState = loop },
    setPlaybackRate: (_rate: number, _time?: number) => {},
    start: (time?: number, offset?: number, duration?: number) => {
      startCalls.push({ time, offset, duration })
    },
    stop: (time?: number) => { stopCalls.push({ time }) },
  }
}

export const createMockFilterNode = (): MockBackendFilterNode => {
  const base = createMockBackendNode()

  return {
    ...base,
    frequencyParam: createMockAudioParam(),
    setFrequency: (_value: number, _time?: number) => {},
    setQ: (_value: number, _time?: number) => {},
    setFilterGain: (_value: number, _time?: number) => {},
    scheduleFilterEnvelope: (_opts) => {},
    scheduleFilterRelease: (_opts) => {},
  }
}

export const createMockDelayNode = (): MockBackendDelayNode => {
  const base = createMockBackendNode()

  return {
    ...base,
    setDelayTime: (_value: number, _time?: number) => {},
  }
}

export const createMockCompressorNode = (): MockBackendCompressorNode => {
  const base = createMockBackendNode()

  return {
    ...base,
    setThreshold: (_value: number, _time?: number) => {},
    setRatio: (_value: number, _time?: number) => {},
    setKnee: (_value: number, _time?: number) => {},
    setAttack: (_value: number, _time?: number) => {},
    setRelease: (_value: number, _time?: number) => {},
  }
}

export const createMockWaveShaperNode = (): MockBackendWaveShaperNode => {
  const base = createMockBackendNode()

  return {
    ...base,
    setCurve: (_curve: Float32Array) => {},
    setOversample: (_value: 'none' | '2x' | '4x') => {},
  }
}

export const createMockStereoPannerNode = (): MockBackendStereoPannerNode => {
  const base = createMockBackendNode()

  return {
    ...base,
    setPan: (_value: number, _time?: number) => {},
  }
}

export const createMockBackendContext = (): MockBackendContext => {
  const createdOscillators: Array<MockBackendOscillatorNode> = []
  const createdGains: Array<MockBackendGainNode> = []
  const createdNoises: Array<MockBackendNoiseNode> = []
  const createdBufferSources: Array<MockBackendBufferSourceNode> = []
  const createdFilters: Array<MockBackendFilterNode> = []
  const createdDelays: Array<MockBackendDelayNode> = []
  const createdCompressors: Array<MockBackendCompressorNode> = []
  const createdWaveShapers: Array<MockBackendWaveShaperNode> = []
  const createdStereoPanners: Array<MockBackendStereoPannerNode> = []

  return {
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    destination: createMockBackendNode(),
    createdOscillators,
    createdGains,
    createdNoises,
    createdBufferSources,
    createdFilters,
    createdDelays,
    createdCompressors,
    createdWaveShapers,
    createdStereoPanners,

    createOscillator: (_props) => {
      const node = createMockOscillatorNode()
      createdOscillators.push(node)
      return node
    },

    createGain: (props) => {
      const node = createMockGainNode(props?.gain ?? 1.0)
      createdGains.push(node)
      return node
    },

    createNoise: (_props) => {
      const node = createMockNoiseNode()
      createdNoises.push(node)
      return node
    },

    decodeAudio: (_data: ArrayBuffer) => Promise.resolve(createMockBuffer()),

    createBufferSource: (_buffer, _props) => {
      const node = createMockBufferSourceNode()
      createdBufferSources.push(node)
      return node
    },

    createFilter: (_props) => {
      const node = createMockFilterNode()
      createdFilters.push(node)
      return node
    },

    createDelay: (_props) => {
      const node = createMockDelayNode()
      createdDelays.push(node)
      return node
    },

    createCompressor: (_props) => {
      const node = createMockCompressorNode()
      createdCompressors.push(node)
      return node
    },

    createWaveShaper: (_props) => {
      const node = createMockWaveShaperNode()
      createdWaveShapers.push(node)
      return node
    },

    createStereoPanner: (_props) => {
      const node = createMockStereoPannerNode()
      createdStereoPanners.push(node)
      return node
    },

    createAnalyser: (_props) => ({
      ...createMockBackendNode(),
      frequencyBinCount: 1024,
      getFloatTimeDomainData: (_array: Float32Array) => { /* no-op in tests */ },
    }),

    suspend: () => Promise.resolve(),
    resume: () => Promise.resolve(),
    close: () => Promise.resolve(),
  }
}

export const createMockBackendProvider = (): BackendProvider & {
  readonly contexts: Array<MockBackendContext>
} => {
  const contexts: Array<MockBackendContext> = []

  return {
    name: 'mock',
    contexts,
    createContext: (_options) => {
      const ctx = createMockBackendContext()
      contexts.push(ctx)
      return ctx
    },
  }
}
