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

/**
 * A modulatable audio parameter — wraps a Web Audio API AudioParam.
 * Allows LFO and other modulation sources to connect directly to parameter values.
 *
 * @example
 * ```ts
 * const lfo = createLFO(context, { rate: 0.5, shape: 'sine', depth: 200 })
 * const filter = context.createFilter({ type: 'lowpass', frequency: 1000 })
 * lfo.connect(filter.frequencyParam)  // modulates 1000±200Hz
 * ```
 */
export type BackendAudioParam = {
  readonly connectModulator: (source: BackendNode) => void
  readonly disconnectModulator: () => void
}

export type BackendOscillatorNode = BackendNode & {
  /** @internal For modulation routing — connects the native oscillator to an AudioParam destination. */
  readonly _connectTo: (destination: unknown) => void
  /**
   * Modulatable frequency parameter. Connect an LFO to this for vibrato.
   * @example `lfo.connect(osc.frequencyParam)`
   */
  readonly frequencyParam: BackendAudioParam
  readonly start: (time?: number) => void
  readonly stop: (time?: number) => void
  readonly setFrequency: (value: number, time?: number) => void
  readonly setDetune: (value: number, time?: number) => void
  /**
   * Schedule an exponential-style pitch envelope — sets startFreq at startTime,
   * ramps linearly to endFreq by startTime + fallTime.
   * Use for kick drum pitch falls and other pitch sweeps.
   */
  readonly schedulePitchEnvelope: (opts: {
    readonly startFreq: number
    readonly endFreq: number
    readonly startTime: number
    readonly fallTime: number
  }) => void
}

export type BackendGainNode = BackendNode & {
  readonly gainParam: BackendAudioParam
  readonly gain: number
  readonly setGain: (value: number, time?: number) => void
  // ADSR envelope — schedules attack→decay→sustain→release without anchor conflicts
  readonly scheduleEnvelope: (opts: {
    peak: number
    attack: number   // seconds
    decay: number    // seconds
    sustain: number  // 0-1 fraction of peak
    release: number  // seconds
    startTime: number
    duration: number // total note duration (attack + decay + hold + release)
  }) => void
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

export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'allpass' | 'peaking' | 'lowshelf' | 'highshelf'

export type BackendFilterNode = BackendNode & {
  readonly frequencyParam: BackendAudioParam
  readonly setFrequency: (value: number, time?: number) => void
  readonly setQ: (value: number, time?: number) => void
  readonly setFilterGain: (value: number, time?: number) => void
  /**
   * Schedule a filter cutoff ADSR envelope — avoids anchor-value conflicts.
   * Sets baseFreq at startTime, ramps to baseFreq+envDepth over attack,
   * decays to baseFreq+envDepth*sustain over decay, holds at sustain.
   */
  readonly scheduleFilterEnvelope: (opts: {
    readonly baseFreq: number
    readonly envDepth: number
    readonly sustain: number  // 0-1 fraction of envDepth
    readonly attack: number
    readonly decay: number
    readonly startTime: number
  }) => void
  /**
   * Schedule the release phase of a filter envelope.
   * Cancels any pending automation at `time`, anchors at `sustainFreq`,
   * then ramps to `baseFreq` over `release` seconds.
   */
  readonly scheduleFilterRelease: (opts: {
    readonly sustainFreq: number
    readonly baseFreq: number
    readonly release: number
    readonly time: number
  }) => void
}

export type BackendDelayNode = BackendNode & {
  readonly setDelayTime: (value: number, time?: number) => void
}

export type BackendCompressorNode = BackendNode & {
  readonly setThreshold: (value: number, time?: number) => void
  readonly setRatio: (value: number, time?: number) => void
  readonly setKnee: (value: number, time?: number) => void
  readonly setAttack: (value: number, time?: number) => void
  readonly setRelease: (value: number, time?: number) => void
}

export type OversampleType = 'none' | '2x' | '4x'

export type BackendWaveShaperNode = BackendNode & {
  readonly setCurve: (curve: Float32Array) => void
  readonly setOversample: (value: OversampleType) => void
}

export type BackendStereoPannerNode = BackendNode & {
  readonly setPan: (value: number, time?: number) => void
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
  readonly createFilter: (props?: {
    type?: FilterType
    frequency?: number
    Q?: number
    gain?: number
  }) => BackendFilterNode
  readonly createDelay: (props?: {
    delayTime?: number
    maxDelayTime?: number
  }) => BackendDelayNode
  readonly createCompressor: (props?: {
    threshold?: number
    ratio?: number
    knee?: number
    attack?: number
    release?: number
  }) => BackendCompressorNode
  readonly createWaveShaper: (props?: {
    curve?: Float32Array
    oversample?: OversampleType
  }) => BackendWaveShaperNode
  readonly createStereoPanner: (props?: {
    pan?: number
  }) => BackendStereoPannerNode
  readonly suspend: () => Promise<void>
  readonly resume: () => Promise<void>
  readonly close: () => Promise<void>
  /**
   * Create a BackendAnalyserNode for reading waveform or frequency data from the audio graph.
   * The returned node implements BackendNode so it can be inserted into the signal path,
   * and also exposes `frequencyBinCount` and `getFloatTimeDomainData` for data reads.
   *
   * @example
   * ```ts
   * const analyser = context.createAnalyser({ fftSize: 2048 })
   * masterOut.connect(analyser)
   * analyser.connect(context.destination)
   * const buf = new Float32Array(analyser.frequencyBinCount)
   * analyser.getFloatTimeDomainData(buf)
   * ```
   */
  readonly createAnalyser: (props?: { fftSize?: number }) => BackendAnalyserNode
}

/**
 * A BackendNode that wraps a Web Audio AnalyserNode.
 * Implements BackendNode for signal routing and exposes the minimal set of
 * read methods needed for waveform visualisation — no DOM types required.
 */
export type BackendAnalyserNode = BackendNode & {
  /** Number of data values that `getFloatTimeDomainData` will populate — half of `fftSize`. */
  readonly frequencyBinCount: number
  /** Copies the current waveform (time-domain) data into the provided Float32Array. */
  readonly getFloatTimeDomainData: (array: Float32Array) => void
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
