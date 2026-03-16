// Backend abstraction layer — allows Score to work with multiple audio engines
// Default: Web Audio API via node-web-audio-api
// Future: scsynth (SuperCollider), custom user-built backends

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle'

export type NoiseType = 'white' | 'pink' | 'brown'

// --- Backend node types ---

export type BackendNode = {
  readonly connect: (dest: BackendNode) => void
  readonly disconnect: (dest?: BackendNode) => void
}

export type BackendOscillatorNode = BackendNode & {
  readonly start: (time?: number) => void
  readonly stop: (time?: number) => void
  readonly setFrequency: (value: number, time?: number) => void
  readonly setDetune: (value: number, time?: number) => void
}

export type BackendGainNode = BackendNode & {
  readonly gain: number
  readonly setGain: (value: number, time?: number) => void
}

export type BackendNoiseNode = BackendNode & {
  readonly start: (time?: number) => void
  readonly stop: (time?: number) => void
}

// Decoded audio buffer — holds sample data
export type BackendBuffer = {
  readonly duration: number
  readonly length: number
  readonly sampleRate: number
  readonly numberOfChannels: number
}

// Buffer source — plays a BackendBuffer (one-shot or looped)
export type BackendBufferSourceNode = BackendNode & {
  readonly start: (time?: number, offset?: number, duration?: number) => void
  readonly stop: (time?: number) => void
  readonly loop: boolean
  readonly setLoop: (loop: boolean) => void
  readonly setPlaybackRate: (rate: number, time?: number) => void
}

// --- Backend context ---

export type BackendContext = {
  readonly currentTime: number
  readonly sampleRate: number
  readonly state: 'running' | 'suspended' | 'closed'
  readonly destination: BackendNode
  readonly createOscillator: (props?: {
    type?: OscillatorType
    frequency?: number
    detune?: number
  }) => BackendOscillatorNode
  readonly createGain: (props?: { gain?: number }) => BackendGainNode
  readonly createNoise: (props?: { type?: NoiseType }) => BackendNoiseNode
  readonly decodeAudio: (data: ArrayBuffer) => Promise<BackendBuffer>
  readonly createBufferSource: (buffer: BackendBuffer, props?: {
    loop?: boolean
    playbackRate?: number
  }) => BackendBufferSourceNode
  readonly suspend: () => Promise<void>
  readonly resume: () => Promise<void>
  readonly close: () => Promise<void>
}

// --- Backend provider ---

export type BackendProvider = {
  readonly name: string
  readonly createContext: (options?: {
    sampleRate?: number
    latencyHint?: 'interactive' | 'balanced' | 'playback'
    offline?: { length: number; numberOfChannels?: number }
  }) => BackendContext
}
