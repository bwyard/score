// Web Audio API backend — default BackendProvider for Score
// Uses node-web-audio-api for Node.js, native Web Audio in browsers (Phase 13)

import {
  AudioContext,
  OfflineAudioContext,
} from 'node-web-audio-api'
import type {
  AnalyserNode as WebAnalyserNode,
  AudioNode as WebAudioNode,
  BaseAudioContext,
  AudioBufferSourceNode as WebBufferSourceNode,
  BiquadFilterNode as WebBiquadFilterNode,
  DelayNode as WebDelayNode,
  DynamicsCompressorNode as WebDynamicsCompressorNode,
  GainNode as WebGainNode,
  OscillatorNode as WebOscillatorNode,
  WaveShaperNode as WebWaveShaperNode,
  StereoPannerNode as WebStereoPannerNode,
} from 'node-web-audio-api'
import { ScoreError } from '../errors/ScoreError.js'
import type {
  BackendAnalyserNode,
  BackendBuffer,
  BackendContext,
  BackendNode,
  BackendProvider,
  NoiseType,
} from './types.js'

// --- Raw node access ---
// Symbol-keyed property to retrieve the underlying Web Audio node
// when connecting two BackendNodes together

// Web Audio API BiquadFilterType — not always exported by node-web-audio-api types
type BiquadFilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'allpass' | 'peaking' | 'lowshelf' | 'highshelf'

const MIN_RAMP = 0.01 // 10ms minimum ramp time for all parameter changes

const RAW = Symbol('web-audio-raw')
const BUFFER = Symbol('web-audio-buffer')

type WithRaw = { readonly [RAW]: WebAudioNode }
type WithBuffer = { readonly [BUFFER]: AudioBuffer }

const getRaw = (node: BackendNode): WebAudioNode =>
  (node as unknown as WithRaw)[RAW]

const getRawBuffer = (buf: BackendBuffer): AudioBuffer =>
  (buf as unknown as WithBuffer)[BUFFER]

// --- Noise buffer generation (pure functions) ---

const fillWhiteNoise = (data: Float32Array): void => {
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1
  }
}

const fillPinkNoise = (data: Float32Array): void => {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.969 * b2 + white * 0.153852
    b3 = 0.8665 * b3 + white * 0.3104856
    b4 = 0.55 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.016898
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
    b6 = white * 0.115926
  }
}

const fillBrownNoise = (data: Float32Array): void => {
  let lastOut = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    lastOut = (lastOut + white * 0.02) / 1.02
    data[i] = lastOut * 3.5
  }
}

const noiseFiller: Readonly<Record<NoiseType, (d: Float32Array) => void>> = {
  white: fillWhiteNoise,
  pink: fillPinkNoise,
  brown: fillBrownNoise,
}

// --- Wrap a raw Web Audio node as a BackendNode ---

const wrapNode = (raw: WebAudioNode): BackendNode & WithRaw => ({
  [RAW]: raw,
  connect: (dest: BackendNode) => {
    raw.connect(getRaw(dest))
  },
  disconnect: (dest?: BackendNode) => {
    if (dest) {
      raw.disconnect(getRaw(dest))
    } else {
      raw.disconnect()
    }
  },
})

// --- Backend context factory ---

const createBackendContext = (ctx: BaseAudioContext): BackendContext => {
  const destination = wrapNode(ctx.destination as unknown as WebAudioNode)

  return {
    get currentTime() { return ctx.currentTime },
    get sampleRate() { return ctx.sampleRate },
    get state() { return ctx.state as 'running' | 'suspended' | 'closed' },
    destination,

    createOscillator: (props) => {
      const osc: WebOscillatorNode = ctx.createOscillator()
      osc.type = props?.type ?? 'sine'
      osc.frequency.value = props?.frequency ?? 440
      osc.detune.value = props?.detune ?? 0
      const base = wrapNode(osc as unknown as WebAudioNode)

      return {
        ...base,
        _connectTo: (destination: unknown) => {
          osc.connect(destination as WebAudioNode)
        },
        frequencyParam: {
          connectModulator: (source: BackendNode) => {
            const s = source as unknown as { _connectTo?: (dest: unknown) => void }
            if (s._connectTo) s._connectTo(osc.frequency)
          },
          disconnectModulator: () => {},
        },
        start: (time?: number) => { osc.start(time ?? ctx.currentTime) },
        stop: (time?: number) => { osc.stop(time ?? ctx.currentTime) },
        setFrequency: (value: number, time?: number) => {
          const t = time ?? ctx.currentTime
          osc.frequency.setValueAtTime(osc.frequency.value, t)
          osc.frequency.linearRampToValueAtTime(value, t + MIN_RAMP)
        },
        setDetune: (value: number, time?: number) => {
          const t = time ?? ctx.currentTime
          osc.detune.setValueAtTime(osc.detune.value, t)
          osc.detune.linearRampToValueAtTime(value, t + MIN_RAMP)
        },
        schedulePitchEnvelope: ({ startFreq, endFreq, startTime, fallTime }) => {
          osc.frequency.setValueAtTime(startFreq, startTime)
          osc.frequency.linearRampToValueAtTime(endFreq, startTime + fallTime)
        },
      }
    },

    createGain: (props) => {
      const gainNode: WebGainNode = ctx.createGain()
      gainNode.gain.value = props?.gain ?? 1.0
      const base = wrapNode(gainNode as unknown as WebAudioNode)

      return {
        ...base,
        gainParam: {
          connectModulator: (source: BackendNode) => {
            const s = source as unknown as { _connectTo?: (dest: unknown) => void }
            if (s._connectTo) s._connectTo(gainNode.gain)
          },
          disconnectModulator: () => {
            try { gainNode.gain.value = gainNode.gain.value } catch { /* noop */ }
          },
        },
        get gain() { return gainNode.gain.value },
        setGain: (value: number, time?: number) => {
          const t = time ?? ctx.currentTime
          gainNode.gain.setValueAtTime(gainNode.gain.value, t)
          gainNode.gain.linearRampToValueAtTime(value, t + MIN_RAMP)
        },
        scheduleEnvelope: ({ peak, attack, decay, sustain, release, startTime }) => {
          const g = gainNode.gain
          g.cancelScheduledValues(startTime)
          g.setValueAtTime(0, startTime)
          g.linearRampToValueAtTime(peak, startTime + attack)
          g.linearRampToValueAtTime(peak * sustain, startTime + attack + decay)
          g.linearRampToValueAtTime(0, startTime + attack + decay + release)
        },
      }
    },

    createNoise: (props) => {
      const noiseType = props?.type ?? 'white'
      const bufferSize = ctx.sampleRate * 2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      noiseFiller[noiseType](buffer.getChannelData(0))

      const outputGain: WebGainNode = ctx.createGain()
      const outputBase = wrapNode(outputGain as unknown as WebAudioNode)
      let source: WebBufferSourceNode | null = null

      return {
        ...outputBase,
        start: (time?: number) => {
          // Clean up previous source to prevent memory leak
          if (source) {
            try { source.stop() } catch { /* already stopped */ }
            try { source.disconnect() } catch { /* already disconnected */ }
          }
          source = ctx.createBufferSource() as unknown as WebBufferSourceNode
          source.buffer = buffer as unknown as AudioBuffer
          source.loop = true
          source.connect(outputGain as unknown as WebAudioNode)
          source.start(time)
        },
        stop: (time?: number) => {
          if (source) {
            source.stop(time)
            source.disconnect()
            source = null
          }
        },
      }
    },

    decodeAudio: async (data: ArrayBuffer): Promise<BackendBuffer> => {
      try {
        const audioBuffer = await (ctx as unknown as { decodeAudioData: (d: ArrayBuffer) => Promise<AudioBuffer> })
          .decodeAudioData(data)
        return {
          [BUFFER]: audioBuffer,
          duration: audioBuffer.duration,
          length: audioBuffer.length,
          sampleRate: audioBuffer.sampleRate,
          numberOfChannels: audioBuffer.numberOfChannels,
        } as unknown as BackendBuffer
      } catch (err) {
        throw ScoreError('Failed to decode audio data', {
          fix: 'Ensure the file is a valid audio format (WAV, MP3, OGG, FLAC)',
          received: err instanceof Error ? err.message : String(err),
          docs: 'https://score.dev/docs/core#sample',
        })
      }
    },

    createBufferSource: (buffer: BackendBuffer, props) => {
      const rawBuffer = getRawBuffer(buffer)
      const source = ctx.createBufferSource() as unknown as WebBufferSourceNode
      source.buffer = rawBuffer as unknown as AudioBuffer
      source.loop = props?.loop ?? false
      if (props?.playbackRate !== undefined) {
        source.playbackRate.value = props.playbackRate
      }
      const base = wrapNode(source as unknown as WebAudioNode)
      let loopState = props?.loop ?? false

      return {
        ...base,
        get loop() { return loopState },
        setLoop: (loop: boolean) => {
          loopState = loop
          source.loop = loop
        },
        setPlaybackRate: (rate: number, time?: number) => {
          const t = time ?? ctx.currentTime
          source.playbackRate.setValueAtTime(source.playbackRate.value, t)
          source.playbackRate.linearRampToValueAtTime(rate, t + MIN_RAMP)
        },
        start: (time?: number, offset?: number, duration?: number) => {
          source.start(time, offset, duration)
        },
        stop: (time?: number) => {
          source.stop(time)
        },
      }
    },

    createFilter: (props) => {
      const filter = (ctx as unknown as { createBiquadFilter: () => WebBiquadFilterNode }).createBiquadFilter()
      filter.type = (props?.type ?? 'lowpass') as BiquadFilterType
      filter.frequency.value = props?.frequency ?? 1000
      filter.Q.value = props?.Q ?? 1
      filter.gain.value = props?.gain ?? 0
      const base = wrapNode(filter as unknown as WebAudioNode)

      return {
        ...base,
        frequencyParam: {
          connectModulator: (source: BackendNode) => {
            const s = source as unknown as { _connectTo?: (dest: unknown) => void }
            if (s._connectTo) s._connectTo(filter.frequency)
          },
          disconnectModulator: () => {
            try { filter.frequency.value = filter.frequency.value } catch { /* noop */ }
          },
        },
        setFrequency: (value: number, time?: number) => {
          const t = time ?? ctx.currentTime
          filter.frequency.setValueAtTime(filter.frequency.value, t)
          filter.frequency.linearRampToValueAtTime(value, t + MIN_RAMP)
        },
        setQ: (value: number, time?: number) => {
          const t = time ?? ctx.currentTime
          filter.Q.setValueAtTime(filter.Q.value, t)
          filter.Q.linearRampToValueAtTime(value, t + MIN_RAMP)
        },
        setFilterGain: (value: number, time?: number) => {
          const t = time ?? ctx.currentTime
          filter.gain.setValueAtTime(filter.gain.value, t)
          filter.gain.linearRampToValueAtTime(value, t + MIN_RAMP)
        },
      }
    },

    createDelay: (props) => {
      const maxDelay = props?.maxDelayTime ?? 5.0
      const delay = (ctx as unknown as { createDelay: (max: number) => WebDelayNode }).createDelay(maxDelay)
      delay.delayTime.value = props?.delayTime ?? 0
      const base = wrapNode(delay as unknown as WebAudioNode)

      return {
        ...base,
        setDelayTime: (value: number, time?: number) => {
          const t = time ?? ctx.currentTime
          delay.delayTime.setValueAtTime(delay.delayTime.value, t)
          delay.delayTime.linearRampToValueAtTime(value, t + MIN_RAMP)
        },
      }
    },

    createCompressor: (props) => {
      const comp = (ctx as unknown as { createDynamicsCompressor: () => WebDynamicsCompressorNode }).createDynamicsCompressor()
      comp.threshold.value = props?.threshold ?? -24
      comp.ratio.value = props?.ratio ?? 12
      comp.knee.value = props?.knee ?? 30
      comp.attack.value = props?.attack ?? 0.003
      comp.release.value = props?.release ?? 0.25
      const base = wrapNode(comp as unknown as WebAudioNode)

      return {
        ...base,
        setThreshold: (value: number, time?: number) => {
          const t = time ?? ctx.currentTime
          comp.threshold.setValueAtTime(comp.threshold.value, t)
          comp.threshold.linearRampToValueAtTime(value, t + MIN_RAMP)
        },
        setRatio: (value: number, time?: number) => {
          const t = time ?? ctx.currentTime
          comp.ratio.setValueAtTime(comp.ratio.value, t)
          comp.ratio.linearRampToValueAtTime(value, t + MIN_RAMP)
        },
        setKnee: (value: number, time?: number) => {
          const t = time ?? ctx.currentTime
          comp.knee.setValueAtTime(comp.knee.value, t)
          comp.knee.linearRampToValueAtTime(value, t + MIN_RAMP)
        },
        setAttack: (value: number, time?: number) => {
          const t = time ?? ctx.currentTime
          comp.attack.setValueAtTime(comp.attack.value, t)
          comp.attack.linearRampToValueAtTime(value, t + MIN_RAMP)
        },
        setRelease: (value: number, time?: number) => {
          const t = time ?? ctx.currentTime
          comp.release.setValueAtTime(comp.release.value, t)
          comp.release.linearRampToValueAtTime(value, t + MIN_RAMP)
        },
      }
    },

    createWaveShaper: (props) => {
      const shaper = (ctx as unknown as { createWaveShaper: () => WebWaveShaperNode }).createWaveShaper()
      if (props?.curve) {
        (shaper as unknown as { curve: unknown }).curve = props.curve
      }
      shaper.oversample = (props?.oversample ?? 'none') as WebWaveShaperNode['oversample']
      const base = wrapNode(shaper as unknown as WebAudioNode)

      return {
        ...base,
        setCurve: (curve: Float32Array) => {
          (shaper as unknown as { curve: unknown }).curve = curve
        },
        setOversample: (value: 'none' | '2x' | '4x') => {
          shaper.oversample = value as WebWaveShaperNode['oversample']
        },
      }
    },

    createStereoPanner: (props) => {
      const panner = (ctx as unknown as { createStereoPanner: () => WebStereoPannerNode }).createStereoPanner()
      panner.pan.value = props?.pan ?? 0
      const base = wrapNode(panner as unknown as WebAudioNode)

      return {
        ...base,
        setPan: (value: number, time?: number) => {
          const t = time ?? ctx.currentTime
          panner.pan.setValueAtTime(panner.pan.value, t)
          panner.pan.linearRampToValueAtTime(value, t + MIN_RAMP)
        },
      }
    },

    createAnalyser: (props) => {
      const analyser = (ctx as unknown as { createAnalyser: () => WebAnalyserNode }).createAnalyser()
      if (props?.fftSize !== undefined) analyser.fftSize = props.fftSize
      const base = wrapNode(analyser as unknown as WebAudioNode)
      return {
        ...base,
        get frequencyBinCount() { return analyser.frequencyBinCount },
        getFloatTimeDomainData: (array: Float32Array) => { analyser.getFloatTimeDomainData(array as Float32Array<ArrayBuffer>); },
      } satisfies BackendAnalyserNode
    },

    suspend: () => (ctx as unknown as { suspend: () => Promise<void> }).suspend(),
    resume: () => (ctx as unknown as { resume: () => Promise<void> }).resume(),
    close: () => {
      const maybeCloseable = ctx as unknown as { close?: () => Promise<void> }
      return typeof maybeCloseable.close === 'function'
        ? maybeCloseable.close()
        : Promise.resolve()
    },
  }
}
// --- Renderable context (offline) ---

/**
 * A {@link BackendContext} that supports offline rendering.
 * Created via {@link createOfflineContext} — use it to render a song to an audio buffer
 * without a real-time audio device.
 */
export type RenderableBackendContext = BackendContext & {
  /**
   * Render all scheduled audio and return the resulting buffer.
   * Call this after scheduling all note events.
   */
  readonly startRendering: () => Promise<{
    readonly length: number
    readonly sampleRate: number
    readonly numberOfChannels: number
    readonly getChannelData: (channel: number) => Float32Array
  }>
}

/**
 * Create an offline {@link RenderableBackendContext} for WAV rendering.
 *
 * @param options - Offline render configuration.
 *   - `length` — total number of samples to render.
 *   - `sampleRate` — sample rate in Hz. Defaults to `44100`.
 *   - `numberOfChannels` — channel count. Defaults to `2`.
 * @returns A backend context with `startRendering()` for offline render.
 *
 * @example
 * ```ts
 * const ctx = createOfflineContext({ length: 44100 * 10, sampleRate: 44100 })
 * // schedule audio events...
 * const buffer = await ctx.startRendering()
 * ```
 */
export const createOfflineContext = (options: {
  length: number
  sampleRate?: number
  numberOfChannels?: number
}): RenderableBackendContext => {
  const sampleRate = options.sampleRate ?? 44100
  const raw = new OfflineAudioContext(
    options.numberOfChannels ?? 2,
    options.length,
    sampleRate,
  )
  return {
    ...createBackendContext(raw),
    startRendering: () => raw.startRendering() as Promise<{
      readonly length: number
      readonly sampleRate: number
      readonly numberOfChannels: number
      readonly getChannelData: (channel: number) => Float32Array
    }>,
  }
}

// --- Web Audio BackendProvider ---

export const webAudioBackend: BackendProvider = {
  name: 'web-audio',
  createContext: (options) => {
    try {
      if (options?.offline) {
        const sampleRate = options.sampleRate ?? 44100
        const ctx = new OfflineAudioContext(
          options.offline.numberOfChannels ?? 1,
          options.offline.length,
          sampleRate,
        )
        return createBackendContext(ctx)
      }
      return createBackendContext(new AudioContext(options))
    } catch (err) {
      throw ScoreError('Failed to create AudioContext', {
        fix: 'Ensure node-web-audio-api is installed: pnpm add node-web-audio-api',
        received: err instanceof Error ? err.message : String(err),
        docs: 'https://score.dev/docs/core#audio-context',
      })
    }
  },
}
