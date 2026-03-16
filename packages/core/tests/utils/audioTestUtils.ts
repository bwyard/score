// Mock factories for BackendProvider/BackendContext
// Used across all @score/* package tests — no real AudioContext required

import type {
  BackendBuffer,
  BackendBufferSourceNode,
  BackendContext,
  BackendGainNode,
  BackendNode,
  BackendNoiseNode,
  BackendOscillatorNode,
  BackendProvider,
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

export type MockBackendContext = BackendContext & {
  readonly createdOscillators: Array<MockBackendOscillatorNode>
  readonly createdGains: Array<MockBackendGainNode>
  readonly createdNoises: Array<MockBackendNoiseNode>
  readonly createdBufferSources: Array<MockBackendBufferSourceNode>
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
    start: (time?: number) => { startCalls.push({ time }) },
    stop: (time?: number) => { stopCalls.push({ time }) },
    setFrequency: (_value: number, _time?: number) => {},
    setDetune: (_value: number, _time?: number) => {},
  }
}

export const createMockGainNode = (initialGain = 1.0): MockBackendGainNode => {
  const base = createMockBackendNode()
  let currentGain = initialGain

  return {
    ...base,
    get gain() { return currentGain },
    setGain: (value: number, _time?: number) => { currentGain = value },
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

export const createMockBackendContext = (): MockBackendContext => {
  const createdOscillators: Array<MockBackendOscillatorNode> = []
  const createdGains: Array<MockBackendGainNode> = []
  const createdNoises: Array<MockBackendNoiseNode> = []
  const createdBufferSources: Array<MockBackendBufferSourceNode> = []

  return {
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    destination: createMockBackendNode(),
    createdOscillators,
    createdGains,
    createdNoises,
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
