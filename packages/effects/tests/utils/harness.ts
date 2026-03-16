// Effects test harness — self-contained mock context for @score/effects tests
// Usage: const h = useHarness() at top of describe, afterAll(() => h.cleanup())

import type {
  BackendCompressorNode,
  BackendContext,
  BackendDelayNode,
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

const createMockGainNode = (initialGain = 1.0, shouldThrowOnDisconnect = false): MockNode & BackendGainNode => {
  const base = createMockNode(shouldThrowOnDisconnect)
  let currentGain = initialGain

  return {
    ...base,
    get gain() { return currentGain },
    setGain: (value: number, _time?: number) => { currentGain = value },
  }
}

const createMockFilterNode = (shouldThrowOnDisconnect = false): MockNode & BackendFilterNode => {
  const base = createMockNode(shouldThrowOnDisconnect)

  return {
    ...base,
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

// --- Mock context ---

export type EffectsMockContext = BackendContext & {
  readonly createdGains: Array<MockNode & BackendGainNode>
  readonly createdFilters: Array<MockNode & BackendFilterNode>
  readonly createdDelays: Array<MockNode & BackendDelayNode>
  readonly createdCompressors: Array<MockNode & BackendCompressorNode>
}

const createMockContext = (shouldThrowOnDisconnect = false): EffectsMockContext => {
  const createdGains: Array<MockNode & BackendGainNode> = []
  const createdFilters: Array<MockNode & BackendFilterNode> = []
  const createdDelays: Array<MockNode & BackendDelayNode> = []
  const createdCompressors: Array<MockNode & BackendCompressorNode> = []

  return {
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    destination: createMockNode(),
    createdGains,
    createdFilters,
    createdDelays,
    createdCompressors,

    createOscillator: (_props) => {
      const base = createMockNode()
      return {
        ...base,
        start: (_time?: number) => {},
        stop: (_time?: number) => {},
        setFrequency: (_value: number, _time?: number) => {},
        setDetune: (_value: number, _time?: number) => {},
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

    suspend: () => Promise.resolve(),
    resume: () => Promise.resolve(),
    close: () => Promise.resolve(),
  }
}

// --- Test harness ---

export type TestHarness = {
  readonly mockContext: () => EffectsMockContext
  readonly mockThrowingContext: () => EffectsMockContext
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
