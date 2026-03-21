// Offline renderer — renders a SongDefinition to a raw audio buffer.
//
// Uses OfflineAudioContext to schedule all notes upfront and render without
// a real-time audio device. Instruments supported: kick, snare, hihat, synth, arp.
// Theremin and sax (continuous, non-pattern) are skipped in offline mode.
//
// HARDWARE BOUNDARY: offline rendering is inherently time-sequential;
// the step loop here is a controlled boundary exception, not DSL-layer state.

import { readFileSync } from 'node:fs'
import { createOfflineContext } from '@score/core'
import { decodeSample, createSamplePlayer } from '@score/core'
import { createMixer } from '@score/mixer'
import { resolveFreq } from '@score/dsl'
import type {
  SongDefinition, InstrumentDescriptor,
  KickProps, SnareProps, HiHatProps, SynthDSLProps, SampleProps, ArpDSLProps,
} from '@score/dsl'
import {
  isInstrumentDescriptor,
  triggerKick, triggerSnare, triggerHiHat, triggerSynth,
} from './engine.js'

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS_PER_BAR = 16
const LEAD_TIME     = 0.01  // small offset so first event doesn't clip at t=0
const TAIL_SEC      = 0.5   // render a little past the last note for release tails

// ── Pattern evaluation ────────────────────────────────────────────────────────

const evalPattern = <T>(
  pattern: T[] | ((step: number, bar: number) => T),
  step: number,
  bar: number,
): T => {
  if (Array.isArray(pattern)) return pattern[step % pattern.length] as T
  return pattern(step, bar)
}

// ── Arrangement — active track set per bar ────────────────────────────────────

const buildArrangementMap = (song: SongDefinition): Map<number, Set<string>> | null => {
  if (song.arrangement.length === 0) return null

  const result = new Map<number, Set<string>>()
  let cursor = 0
  for (const section of song.arrangement) {
    for (let b = 0; b < section.bars; b++) {
      const activeIds = new Set(
        section.tracks
          .map(t => isInstrumentDescriptor(t) ? t : t.component)
          .filter(isInstrumentDescriptor)
          .map((d: InstrumentDescriptor) => d.id),
      )
      result.set(cursor + b, activeIds)
    }
    cursor += section.bars
  }
  return result
}

// ── WAV encoder ───────────────────────────────────────────────────────────────

/**
 * Encode a rendered audio buffer as a 16-bit PCM WAV binary.
 *
 * @param rendered    - Rendered buffer from `startRendering`.
 * @returns `Buffer` containing a valid WAV file.
 */
export const encodeWav = (rendered: {
  length: number
  sampleRate: number
  numberOfChannels: number
  getChannelData: (channel: number) => Float32Array
}): Buffer => {
  const channels    = rendered.numberOfChannels
  const sampleRate  = rendered.sampleRate
  const numSamples  = rendered.length
  const bitsPerSample = 16
  const blockAlign  = channels * Math.ceil(bitsPerSample / 8)
  const byteRate    = sampleRate * blockAlign
  const dataSize    = numSamples * blockAlign

  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)          // PCM format
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)

  const pcm = Buffer.alloc(dataSize)
  const channelData = Array.from({ length: channels }, (_: unknown, c: number) =>
    rendered.getChannelData(c),
  )
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < channels; c++) {
      const sample   = Math.max(-1, Math.min(1, channelData[c]?.[i] ?? 0))
      const intSample = Math.round(sample * 32767)
      pcm.writeInt16LE(intSample, (i * channels + c) * 2)
    }
  }

  return Buffer.concat([header, pcm])
}

// ── Render ────────────────────────────────────────────────────────────────────

export type RenderOptions = {
  /** Override total bars to render. Default: arrangement length, or 8 if no arrangement. */
  readonly bars?: number
  /** Output sample rate. Default: 44100. */
  readonly sampleRate?: number
  /** Output channel count. Default: 2. */
  readonly channels?: number
}

/**
 * Render a {@link SongDefinition} to an audio buffer using offline processing.
 *
 * All note events are scheduled upfront into an {@link OfflineAudioContext},
 * then rendered to a buffer synchronously. Supported instrument types:
 * `kick`, `snare`, `hihat`, `synth`, `arp`, `sample`.
 * Theremin and Sax (continuous, non-pattern) are not rendered offline.
 *
 * @param song    - Compiled song descriptor.
 * @param options - Render configuration.
 * @returns Rendered audio buffer ready for WAV encoding via {@link encodeWav}.
 *
 * @example
 * ```ts
 * const song = await loadSong('./my-track.js')
 * const buffer = await renderSong(song, { bars: 8 })
 * const wav = encodeWav(buffer)
 * writeFileSync('./my-track.wav', wav)
 * ```
 */
export const renderSong = async (
  song: SongDefinition,
  options: RenderOptions = {},
): Promise<{
  length: number
  sampleRate: number
  numberOfChannels: number
  getChannelData: (channel: number) => Float32Array
}> => {
  const sampleRate = options.sampleRate ?? 44100
  const channels   = options.channels   ?? 2

  const arrangementBars = song.arrangement.reduce((sum, s) => sum + s.bars, 0)
  const totalBars  = options.bars ?? (arrangementBars > 0 ? arrangementBars : 8)
  const stepSec    = 60 / song.bpm / 4  // 16th note duration
  const totalSteps = totalBars * STEPS_PER_BAR
  const durationSec = totalSteps * stepSec + TAIL_SEC
  const length     = Math.ceil(durationSec * sampleRate)

  const ctx = createOfflineContext({ length, sampleRate, numberOfChannels: channels })
  const mixer = createMixer(ctx, { masterVolume: 0.85 })

  const descriptors = song.tracks
    .map(t => isInstrumentDescriptor(t) ? t : t.component)
    .filter(isInstrumentDescriptor)

  // Pre-decode sample buffers before scheduling
  type RenderedBuffer = Awaited<ReturnType<typeof decodeSample>>
  const sampleBuffers = new Map<string, RenderedBuffer>()
  await Promise.all(
    descriptors
      .filter(d => d.instrumentType === 'sample')
      .map(async (d) => {
        const props = d.props as SampleProps
        const raw = readFileSync(props.path)
        const arrayBuffer = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)
        sampleBuffers.set(d.id, await decodeSample(ctx, arrayBuffer))
      }),
  )

  // Per-track channel inputs
  type GainNode = ReturnType<typeof ctx.createGain>
  const channelInputs: GainNode[] = descriptors.map(comp => {
    const channel = mixer.addChannel({ name: comp.instrumentType, effects: [] })
    return channel.input as unknown as GainNode
  })

  // Build arrangement map for mute logic
  const arrangementMap = buildArrangementMap(song)

  const isTrackActive = (descriptor: InstrumentDescriptor, bar: number): boolean => {
    if (!arrangementMap) return true
    const activeIds = arrangementMap.get(bar % totalBars)
    return activeIds ? activeIds.has(descriptor.id) : true
  }

  // Schedule all steps upfront — hardware boundary (sequential time loop)
  for (let absStep = 0; absStep < totalSteps; absStep++) {
    const bar     = Math.floor(absStep / STEPS_PER_BAR)
    const barStep = absStep % STEPS_PER_BAR
    const time    = absStep * stepSec + LEAD_TIME

    descriptors.forEach((desc, i) => {
      const dest = channelInputs[i]
      if (!dest) return
      if (!isTrackActive(desc, bar)) return

      switch (desc.instrumentType) {
        case 'kick': {
          const props = desc.props as KickProps
          const pattern = props.pattern ?? [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
          const hit = evalPattern(pattern, barStep, bar)
          if (hit) triggerKick(ctx, time, props, dest)
          break
        }
        case 'snare': {
          const props = desc.props as SnareProps
          const pattern = props.pattern ?? [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
          const hit = evalPattern(pattern, barStep, bar)
          if (hit) triggerSnare(ctx, time, props, dest)
          break
        }
        case 'hihat': {
          const props = desc.props as HiHatProps
          const pattern = props.pattern ?? [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
          const hit = evalPattern(pattern, barStep, bar)
          if (hit) triggerHiHat(ctx, time, props, dest)
          break
        }
        case 'synth': {
          const props = desc.props as SynthDSLProps
          const rawPattern = props.pattern ?? props.sequence ?? [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0]
          const pattern: (number | string)[] = Array.isArray(rawPattern) ? rawPattern : []
          const val = evalPattern(pattern, barStep, bar)
          const freq = resolveFreq(val)
          if (freq > 0) triggerSynth(ctx, time, props, freq, dest)
          break
        }
        case 'arp': {
          const props = desc.props as ArpDSLProps
          const notes = props.notes
          if (notes.length === 0) break
          const noteIdx = absStep % notes.length
          const note = notes[noteIdx] ?? notes[0] ?? 'C4'
          const freq = resolveFreq(note)
          if (freq > 0) triggerSynth(ctx, time, {
            wave: props.wave ?? 'triangle',
            gain: props.gain ?? 0.3,
            envelope: props.envelope,
          } as SynthDSLProps, freq, dest)
          break
        }
        case 'sample': {
          const props = desc.props as SampleProps
          const buf = sampleBuffers.get(desc.id)
          if (!buf) break
          const pattern = props.pattern ?? [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          const hit = evalPattern(pattern, barStep, bar)
          if (hit) {
            const player = createSamplePlayer(ctx, buf, {
              loop: props.loop ?? false,
              playbackRate: props.rate ?? 1.0,
              gain: props.volume ?? 1.0,
            })
            player.connect(dest)
            player.start(time)
          }
          break
        }
        // theremin and sax are continuous instruments — not rendered offline
        default:
          break
      }
    })
  }

  return ctx.startRendering()
}
