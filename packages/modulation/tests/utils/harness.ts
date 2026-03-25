// Modulation test harness — self-contained mock context for @score/modulation tests
// Usage: const h = useHarness() at top of describe, afterAll(() => h.cleanup())

import type {
  BackendAudioParam,
  BackendContext,
  BackendFilterNode,
  BackendGainNode,
  BackendNode,
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

const createMockAudioParamInternal = (): BackendAudioParam => {
  return {
    connectModulator: (_source: BackendNode) => {},
    disconnectModulator: () => {},
  }
}

const createMockGainNode = (initialGain = 1.0, shouldThrowOnDisconnect = false): MockNode & BackendGainNode => {
  const base = createMockNode(shouldThrowOnDisconnect)
  let currentGain = initialGain

  return {
    ...base,
    gainParam: createMockAudioParamInternal(),
    get gain() { return currentGain },
    setGain: (value: number, _time?: number) => { currentGain = value },
    cancelScheduledValues: (_atTime: number) => {},
    scheduleFade: (_from: number, to: number, _startTime: number, _endTime: number) => { currentGain = to },
    scheduleEnvelope: ({ peak }: { peak: number; attack: number; decay: number; sustain: number; release: number; startTime: number; duration: number }) => { currentGain = peak },
  }
}

const createMockFilterNode = (shouldThrowOnDisconnect = false): MockNode & BackendFilterNode => {
  const base = createMockNode(shouldThrowOnDisconnect)

  return {
    ...base,
    frequencyParam: createMockAudioParamInternal(),
    setFrequency: (_value: number, _time?: number) => {},
    setQ: (_value: number, _time?: number) => {},
    setFilterGain: (_value: number, _time?: number) => {},
    scheduleFilterEnvelope: (_opts) => {},
    scheduleFilterRelease: (_opts) => {},
  }
}

// --- Mock AudioParam with tracking ---

/**
 * Create a mock BackendAudioParam that tracks connect and disconnect calls.
 */
export const createMockAudioParam = (): BackendAudioParam & { connectCount: number; disconnectCount: number } => {
  let connectCount = 0
  let disconnectCount = 0
  return {
    connectModulator: (_source: BackendNode) => { connectCount++ },
    disconnectModulator: () => { disconnectCount++ },
    get connectCount() { return connectCount },
    get disconnectCount() { return disconnectCount },
  }
}

// --- Mock context ---

export type ModulationMockContext = BackendContext & {
  readonly createdGains: Array<MockNode & BackendGainNode>
  readonly createdFilters: Array<MockNode & BackendFilterNode>
  readonly oscillatorStartCalls: number[]
}

const createMockContext = (shouldThrowOnDisconnect = false): ModulationMockContext => {
  const createdGains: Array<MockNode & BackendGainNode> = []
  const createdFilters: Array<MockNode & BackendFilterNode> = []
  const oscillatorStartCalls: number[] = []

  return {
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    destination: createMockNode(),
    createdGains,
    createdFilters,
    oscillatorStartCalls,

    createOscillator: (_props) => {
      const base = createMockNode()
      return {
        ...base,
        _connectTo: (destination: unknown) => {
          void destination
        },
        frequencyParam: { connectModulator: (_source: unknown) => {}, disconnectModulator: () => {} },
        onended: null,
        start: (time?: number) => { oscillatorStartCalls.push(time ?? 0) },
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
        onended: null,
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
      const base = createMockNode()
      return {
        ...base,
        setDelayTime: (_value: number, _time?: number) => {},
      }
    },

    createCompressor: (_props) => {
      const base = createMockNode()
      return {
        ...base,
        setThreshold: (_value: number, _time?: number) => {},
        setRatio: (_value: number, _time?: number) => {},
        setKnee: (_value: number, _time?: number) => {},
        setAttack: (_value: number, _time?: number) => {},
        setRelease: (_value: number, _time?: number) => {},
      }
    },

    createWaveShaper: (_props) => {
      const base = createMockNode()
      return {
        ...base,
        setCurve: (_curve: Float32Array) => {},
        setOversample: (_value: 'none' | '2x' | '4x') => {},
      }
    },

    createStereoPanner: (_props) => {
      const base = createMockNode()
      return {
        ...base,
        setPan: (_value: number, _time?: number) => {},
      }
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
  readonly mockContext: () => ModulationMockContext
  readonly mockThrowingContext: () => ModulationMockContext
  readonly cleanup: () => Promise<void>
}

export const useHarness = (): TestHarness => ({
  mockContext: () => createMockContext(),
  mockThrowingContext: () => createMockContext(true),
  cleanup: () => Promise.resolve(),
})
