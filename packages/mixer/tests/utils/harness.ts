// Mixer test harness — self-contained mock context for @score/mixer tests
// Usage: const h = useHarness() at top of describe, afterAll(() => h.cleanup())

import type {
  BackendAudioParam,
  BackendCompressorNode,
  BackendContext,
  BackendDelayNode,
  BackendFilterNode,
  BackendGainNode,
  BackendNode,
  BackendStereoPannerNode,
  BackendWaveShaperNode,
} from '@score/core'

// --- Mock node factories ---

type MockNode = BackendNode & {
  readonly connectCalls: Array<{ readonly destination: BackendNode }>
  readonly disconnectCalls: Array<{ readonly destination: BackendNode | undefined }>
}

const createMockNode = (shouldThrowOnDisconnect = false): MockNode => {
  const connectCalls: Array<{ readonly destination: BackendNode }> = []
  const disconnectCalls: Array<{ readonly destination: BackendNode | undefined }> = []

  return {
    connectCalls,
    disconnectCalls,
    connect: (dest: BackendNode) => { connectCalls.push({ destination: dest }) },
    disconnect: (dest?: BackendNode) => {
      if (shouldThrowOnDisconnect) { throw new Error('Already disconnected') }
      disconnectCalls.push({ destination: dest })
    },
  }
}

const createMockAudioParam = (): BackendAudioParam => ({
  connectModulator: (_source: BackendNode) => {},
  disconnectModulator: () => {},
})

const createMockGainNode = (initialGain = 1.0, shouldThrowOnDisconnect = false): MockNode & BackendGainNode => {
  const base = createMockNode(shouldThrowOnDisconnect)
  let currentGain = initialGain

  return {
    ...base,
    gainParam: createMockAudioParam(),
    get gain() { return currentGain },
    setGain: (value: number, _time?: number) => { currentGain = value },
    scheduleEnvelope: ({ peak }: { peak: number; attack: number; decay: number; sustain: number; release: number; startTime: number; duration: number }) => { currentGain = peak },
  }
}

const createMockFilterNode = (shouldThrowOnDisconnect = false): MockNode & BackendFilterNode => {
  const base = createMockNode(shouldThrowOnDisconnect)

  return {
    ...base,
    frequencyParam: createMockAudioParam(),
    setFrequency: (_value: number, _time?: number) => {},
    setQ: (_value: number, _time?: number) => {},
    setFilterGain: (_value: number, _time?: number) => {},
  }
}

const createMockDelayNode = (shouldThrowOnDisconnect = false): MockNode & BackendDelayNode => {
  const base = createMockNode(shouldThrowOnDisconnect)

  return {
    ...base,
    setDelayTime: (_value: number, _time?: number) => {},
  }
}

const createMockCompressorNode = (shouldThrowOnDisconnect = false): MockNode & BackendCompressorNode => {
  const base = createMockNode(shouldThrowOnDisconnect)

  return {
    ...base,
    setThreshold: (_value: number, _time?: number) => {},
    setRatio: (_value: number, _time?: number) => {},
    setKnee: (_value: number, _time?: number) => {},
    setAttack: (_value: number, _time?: number) => {},
    setRelease: (_value: number, _time?: number) => {},
  }
}

const createMockWaveShaperNode = (shouldThrowOnDisconnect = false): MockNode & BackendWaveShaperNode => {
  const base = createMockNode(shouldThrowOnDisconnect)

  return {
    ...base,
    setCurve: (_curve: Float32Array | null) => {},
    setOversample: (_value: 'none' | '2x' | '4x') => {},
  }
}

const createMockStereoPannerNode = (shouldThrowOnDisconnect = false): MockNode & BackendStereoPannerNode => {
  const base = createMockNode(shouldThrowOnDisconnect)

  return {
    ...base,
    setPan: (_value: number, _time?: number) => {},
  }
}

// --- Mock context ---

export type MixerMockContext = BackendContext & {
  readonly createdGains: Array<MockNode & BackendGainNode>
  readonly createdFilters: Array<MockNode & BackendFilterNode>
  readonly createdDelays: Array<MockNode & BackendDelayNode>
  readonly createdCompressors: Array<MockNode & BackendCompressorNode>
  readonly createdWaveShapers: Array<MockNode & BackendWaveShaperNode>
  readonly createdStereoPanners: Array<MockNode & BackendStereoPannerNode>
}

const createMockContext = (shouldThrowOnDisconnect = false): MixerMockContext => {
  const createdGains: Array<MockNode & BackendGainNode> = []
  const createdFilters: Array<MockNode & BackendFilterNode> = []
  const createdDelays: Array<MockNode & BackendDelayNode> = []
  const createdCompressors: Array<MockNode & BackendCompressorNode> = []
  const createdWaveShapers: Array<MockNode & BackendWaveShaperNode> = []
  const createdStereoPanners: Array<MockNode & BackendStereoPannerNode> = []

  return {
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    destination: createMockNode(),
    createdGains,
    createdFilters,
    createdDelays,
    createdCompressors,
    createdWaveShapers,
    createdStereoPanners,

    createOscillator: (_props) => {
      const base = createMockNode()
      return {
        ...base,
        _connectTo: (_destination: unknown) => {},
        frequencyParam: { connectModulator: (_source: unknown) => {}, disconnectModulator: () => {} },
        start: (_time?: number) => {},
        stop: (_time?: number) => {},
        setFrequency: (_value: number, _time?: number) => {},
        setDetune: (_value: number, _time?: number) => {},
        schedulePitchEnvelope: (_opts: { startFreq: number; endFreq: number; startTime: number; fallTime: number }) => {},
      }
    },

    createGain: (props) => {
      const node = createMockGainNode(props?.gain ?? 1.0, shouldThrowOnDisconnect)
      createdGains.push(node)
      return node
    },

    createNoise: (_props) => {
      const base = createMockNode()
      return {
        ...base,
        start: (_time?: number) => {},
        stop: (_time?: number) => {},
      }
    },

    decodeAudio: (_data: ArrayBuffer) => Promise.resolve({
      duration: 1.0,
      length: 44100,
      sampleRate: 44100,
      numberOfChannels: 1,
    }),

    createBufferSource: (_buffer, _props) => {
      const base = createMockNode()
      let loopState = false
      return {
        ...base,
        get loop() { return loopState },
        setLoop: (loop: boolean) => { loopState = loop },
        setPlaybackRate: (_rate: number, _time?: number) => {},
        start: (_time?: number, _offset?: number, _duration?: number) => {},
        stop: (_time?: number) => {},
      }
    },

    createFilter: (_props) => {
      const node = createMockFilterNode(shouldThrowOnDisconnect)
      createdFilters.push(node)
      return node
    },

    createDelay: (_props) => {
      const node = createMockDelayNode(shouldThrowOnDisconnect)
      createdDelays.push(node)
      return node
    },

    createCompressor: (_props) => {
      const node = createMockCompressorNode(shouldThrowOnDisconnect)
      createdCompressors.push(node)
      return node
    },

    createWaveShaper: (_props) => {
      const node = createMockWaveShaperNode(shouldThrowOnDisconnect)
      createdWaveShapers.push(node)
      return node
    },

    createStereoPanner: (_props) => {
      const node = createMockStereoPannerNode(shouldThrowOnDisconnect)
      createdStereoPanners.push(node)
      return node
    },

    createAnalyser: (_props?: { fftSize?: number }) => ({
      connect: (_dest: unknown) => {},
      disconnect: (_dest?: unknown) => {},
      frequencyBinCount: 1024,
      getFloatTimeDomainData: (_array: Float32Array) => {},
    }),
    suspend: () => Promise.resolve(),
    resume: () => Promise.resolve(),
    close: () => Promise.resolve(),
  }
}

// --- Test harness ---

export type TestHarness = {
  readonly mockContext: () => MixerMockContext
  readonly mockThrowingContext: () => MixerMockContext
  readonly mockNode: () => MockNode
  readonly mockThrowingNode: () => MockNode
  readonly cleanup: () => Promise<void>
}

export const useHarness = (): TestHarness => ({
  mockContext: () => createMockContext(),
  mockThrowingContext: () => createMockContext(true),
  mockNode: () => createMockNode(),
  mockThrowingNode: () => createMockNode(true),
  cleanup: () => Promise.resolve(),
})
