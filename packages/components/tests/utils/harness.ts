// Test harness for @score/components
// Provides mock context and buffer from @score/core's backend types

import type {
  BackendBuffer,
  BackendBufferSourceNode,
  BackendContext,
  BackendGainNode,
  BackendNode,
  BackendOscillatorNode,
} from '@score/core'

// --- Mock types ---

export type MockBackendNode = BackendNode & {
  readonly connectCalls: Array<{ readonly destination: BackendNode }>
  readonly disconnectCalls: Array<{ readonly destination: BackendNode | undefined }>
}

export type MockBackendOscillatorNode = MockBackendNode & BackendOscillatorNode & {
  readonly startCalls: Array<{ readonly time: number | undefined }>
  readonly stopCalls: Array<{ readonly time: number | undefined }>
}

export type MockBackendGainNode = MockBackendNode & BackendGainNode

export type MockBackendBufferSourceNode = MockBackendNode & BackendBufferSourceNode & {
  readonly startCalls: Array<{ readonly time: number | undefined; readonly offset: number | undefined; readonly duration: number | undefined }>
  readonly stopCalls: Array<{ readonly time: number | undefined }>
}

export type MockBackendContext = BackendContext & {
  readonly createdOscillators: Array<MockBackendOscillatorNode>
  readonly createdGains: Array<MockBackendGainNode>
  readonly createdBufferSources: Array<MockBackendBufferSourceNode>
}

// --- Mock factories ---

const createMockNode = (): MockBackendNode => {
  const connectCalls: MockBackendNode['connectCalls'] = []
  const disconnectCalls: MockBackendNode['disconnectCalls'] = []

  return {
    connectCalls,
    disconnectCalls,
    connect: (dest: BackendNode) => { connectCalls.push({ destination: dest }) },
    disconnect: (dest?: BackendNode) => { disconnectCalls.push({ destination: dest }) },
  }
}

const createMockOscillatorNode = (): MockBackendOscillatorNode => {
  const base = createMockNode()
  const startCalls: MockBackendOscillatorNode['startCalls'] = []
  const stopCalls: MockBackendOscillatorNode['stopCalls'] = []

  return {
    ...base,
    startCalls,
    stopCalls,
    start: (time?: number) => { startCalls.push({ time }) },
    stop: (time?: number) => { stopCalls.push({ time }) },
    setFrequency: (_value: number, _time?: number) => {},
    setDetune: (_value: number, _time?: number) => {},
  }
}

const createMockGainNode = (initialGain = 1.0): MockBackendGainNode => {
  const base = createMockNode()
  let currentGain = initialGain

  return {
    ...base,
    get gain() { return currentGain },
    setGain: (value: number, _time?: number) => { currentGain = value },
  }
}

const createMockBufferSourceNode = (): MockBackendBufferSourceNode => {
  const base = createMockNode()
  const startCalls: MockBackendBufferSourceNode['startCalls'] = []
  const stopCalls: MockBackendBufferSourceNode['stopCalls'] = []
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

export const createMockContext = (): MockBackendContext => {
  const createdOscillators: Array<MockBackendOscillatorNode> = []
  const createdGains: Array<MockBackendGainNode> = []
  const createdBufferSources: Array<MockBackendBufferSourceNode> = []

  return {
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    destination: createMockNode(),
    createdOscillators,
    createdGains,
    createdBufferSources,

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
      const base = createMockNode()
      return {
        ...base,
        start: (_time?: number) => {},
        stop: (_time?: number) => {},
      }
    },

    decodeAudio: (_data: ArrayBuffer) => Promise.resolve(createMockBuffer()),

    createBufferSource: (_buffer, _props) => {
      const node = createMockBufferSourceNode()
      createdBufferSources.push(node)
      return node
    },

    suspend: () => Promise.resolve(),
    resume: () => Promise.resolve(),
    close: () => Promise.resolve(),
  }
}

export type TestHarness = {
  readonly mockContext: () => MockBackendContext
  readonly mockBuffer: (opts?: {
    duration?: number
    length?: number
    sampleRate?: number
    numberOfChannels?: number
  }) => BackendBuffer
  readonly mockNode: () => MockBackendNode
}

export const useHarness = (): TestHarness => ({
  mockContext: () => createMockContext(),
  mockBuffer: (opts) => createMockBuffer(opts),
  mockNode: () => createMockNode(),
})
