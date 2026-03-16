// Mock factories for Web Audio API objects
// Used across all @score/* package tests — no real AudioContext required

// Track connect/disconnect calls for assertions
export type MockAudioNode = {
  readonly connectCalls: Array<{
    destination: unknown
    output: number | undefined
    input: number | undefined
  }>
  readonly disconnectCalls: Array<{ destination: unknown | undefined }>
  readonly connect: (destination: unknown, output?: number, input?: number) => MockAudioNode
  readonly disconnect: (destination?: unknown) => void
  readonly channelCount: number
  readonly channelCountMode: string
  readonly channelInterpretation: string
  readonly numberOfInputs: number
  readonly numberOfOutputs: number
}

export type MockGainNode = MockAudioNode & {
  readonly gain: { readonly value: number }
}

export type MockOscillatorNode = MockAudioNode & {
  readonly frequency: { readonly value: number }
  readonly type: string
  readonly start: (when?: number) => void
  readonly stop: (when?: number) => void
}

export type MockAudioContext = {
  readonly currentTime: number
  readonly sampleRate: number
  readonly state: string
  readonly destination: MockAudioNode
  readonly resume: () => Promise<void>
  readonly close: () => Promise<void>
  readonly createGain: () => MockGainNode
  readonly createOscillator: () => MockOscillatorNode
}

// --- Factory functions ---

export const createMockAudioNode = (): MockAudioNode => {
  const connectCalls: MockAudioNode['connectCalls'] = []
  const disconnectCalls: MockAudioNode['disconnectCalls'] = []

  const node: MockAudioNode = {
    connectCalls,
    disconnectCalls,
    connect: (destination: unknown, output?: number, input?: number) => {
      connectCalls.push({ destination, output, input })
      return node
    },
    disconnect: (destination?: unknown) => {
      disconnectCalls.push({ destination })
    },
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    numberOfInputs: 1,
    numberOfOutputs: 1,
  }

  return node
}

export const createMockGainNode = (): MockGainNode => ({
  ...createMockAudioNode(),
  gain: { value: 1 },
})

export const createMockOscillatorNode = (): MockOscillatorNode => ({
  ...createMockAudioNode(),
  frequency: { value: 440 },
  type: 'sine',
  start: (_when?: number) => {},
  stop: (_when?: number) => {},
})

export const createMockAudioContext = (): MockAudioContext => ({
  currentTime: 0,
  sampleRate: 44100,
  state: 'running',
  destination: createMockAudioNode(),
  resume: () => Promise.resolve(),
  close: () => Promise.resolve(),
  createGain: () => createMockGainNode(),
  createOscillator: () => createMockOscillatorNode(),
})
