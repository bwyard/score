// Multiband Compressor effect — three-band crossover compressor for mastering
// Splits signal into low/mid/high bands, compresses each independently, then sums

import type { AudioComponent, ScoreAudioContext, ScoreAudioNode, BackendCompressorNode, BackendGainNode, BackendFilterNode } from '@score/core'
import { uid } from '@score/core'

/**
 * Per-band configuration for the low frequency band of the multiband compressor.
 * Controls dynamics of bass frequencies below the low crossover point.
 */
export type MultibandCompressorBandLow = {
  readonly threshold?: number
  readonly ratio?: number
  readonly attack?: number
  readonly release?: number
  readonly makeupGain?: number
  readonly crossover?: number
}

/**
 * Per-band configuration for the mid frequency band of the multiband compressor.
 * Controls dynamics of mid frequencies between the low and high crossover points.
 */
export type MultibandCompressorBandMid = {
  readonly threshold?: number
  readonly ratio?: number
  readonly attack?: number
  readonly release?: number
  readonly makeupGain?: number
}

/**
 * Per-band configuration for the high frequency band of the multiband compressor.
 * Controls dynamics of high frequencies above the high crossover point.
 */
export type MultibandCompressorBandHigh = {
  readonly threshold?: number
  readonly ratio?: number
  readonly attack?: number
  readonly release?: number
  readonly makeupGain?: number
  readonly crossover?: number
}

/**
 * Configuration props for {@link createMultibandCompressor}.
 *
 * Each band (low/mid/high) is independently compressed before summing.
 * Crossover frequencies define the split points between bands.
 */
export type MultibandCompressorProps = {
  readonly low?: MultibandCompressorBandLow
  readonly mid?: MultibandCompressorBandMid
  readonly high?: MultibandCompressorBandHigh
  readonly mix?: number
}

/**
 * Create a three-band multiband compressor for mastering.
 * Each frequency band is compressed independently before summing.
 * Essential for controlling low-end on festival systems.
 *
 * Signal routing:
 * - Low band: input → lowpass(lowCrossover) → compressor → makeup gain → sum
 * - Mid band: input → highpass(lowCrossover) → lowpass(highCrossover) → compressor → makeup gain → sum
 * - High band: input → highpass(highCrossover) → compressor → makeup gain → sum
 * - All bands sum into a single output, with optional dry/wet mix.
 *
 * @param context - Backend audio context from the Score engine.
 * @param props - Multiband compressor configuration. Defaults produce a transparent mastering preset.
 * @returns AudioComponent with per-band threshold, ratio, and makeupGain setters plus a mix setter.
 *
 * @example
 * ```ts
 * const master = createMultibandCompressor(context, {
 *   low:  { threshold: -24, ratio: 4, crossover: 200 },
 *   mid:  { threshold: -18, ratio: 3 },
 *   high: { threshold: -12, ratio: 2, crossover: 5000 },
 * })
 * // Connect to master bus for festival-ready low-end control
 * master.connect(context.destination)
 * ```
 */
export const createMultibandCompressor = (
  context: ScoreAudioContext,
  props?: MultibandCompressorProps,
) => {
  const lowCrossover = props?.low?.crossover ?? 200
  const highCrossover = props?.high?.crossover ?? 5000
  const mixAmount = Math.max(0, Math.min(props?.mix ?? 1.0, 1.0))

  // Input and output nodes
  const inputGain = context.createGain({ gain: 1.0 })
  const outputGain = context.createGain({ gain: 1.0 })
  const dryGain = context.createGain({ gain: 1.0 - mixAmount })
  const wetGain = context.createGain({ gain: mixAmount })
  const sumGain = context.createGain({ gain: 1.0 })

  // Low band: lowpass filter → compressor → makeup gain
  const filterLow: BackendFilterNode = context.createFilter({ type: 'lowpass', frequency: lowCrossover, Q: 0.707 })
  const compLow: BackendCompressorNode = context.createCompressor({
    threshold: props?.low?.threshold ?? -24,
    ratio: props?.low?.ratio ?? 4,
    knee: 6,
    attack: props?.low?.attack ?? 0.003,
    release: props?.low?.release ?? 0.25,
  })
  const gainLow: BackendGainNode = context.createGain({ gain: Math.pow(10, (props?.low?.makeupGain ?? 0) / 20) })

  // Mid band: highpass → lowpass (bandpass via two filters in series) → compressor → makeup gain
  const filterMidHp: BackendFilterNode = context.createFilter({ type: 'highpass', frequency: lowCrossover, Q: 0.707 })
  const filterMidLp: BackendFilterNode = context.createFilter({ type: 'lowpass', frequency: highCrossover, Q: 0.707 })
  const compMid: BackendCompressorNode = context.createCompressor({
    threshold: props?.mid?.threshold ?? -18,
    ratio: props?.mid?.ratio ?? 3,
    knee: 6,
    attack: props?.mid?.attack ?? 0.003,
    release: props?.mid?.release ?? 0.25,
  })
  const gainMid: BackendGainNode = context.createGain({ gain: Math.pow(10, (props?.mid?.makeupGain ?? 0) / 20) })

  // High band: highpass filter → compressor → makeup gain
  const filterHigh: BackendFilterNode = context.createFilter({ type: 'highpass', frequency: highCrossover, Q: 0.707 })
  const compHigh: BackendCompressorNode = context.createCompressor({
    threshold: props?.high?.threshold ?? -12,
    ratio: props?.high?.ratio ?? 2,
    knee: 6,
    attack: props?.high?.attack ?? 0.003,
    release: props?.high?.release ?? 0.25,
  })
  const gainHigh: BackendGainNode = context.createGain({ gain: Math.pow(10, (props?.high?.makeupGain ?? 0) / 20) })

  // Wire low band: input → filterLow → compLow → gainLow → sumGain
  inputGain.connect(filterLow)
  filterLow.connect(compLow)
  compLow.connect(gainLow)
  gainLow.connect(sumGain)

  // Wire mid band: input → filterMidHp → filterMidLp → compMid → gainMid → sumGain
  inputGain.connect(filterMidHp)
  filterMidHp.connect(filterMidLp)
  filterMidLp.connect(compMid)
  compMid.connect(gainMid)
  gainMid.connect(sumGain)

  // Wire high band: input → filterHigh → compHigh → gainHigh → sumGain
  inputGain.connect(filterHigh)
  filterHigh.connect(compHigh)
  compHigh.connect(gainHigh)
  gainHigh.connect(sumGain)

  // Wet path: sumGain → wetGain → outputGain
  sumGain.connect(wetGain)
  wetGain.connect(outputGain)

  // Dry path: input → dryGain → outputGain
  inputGain.connect(dryGain)
  dryGain.connect(outputGain)

  const component: AudioComponent & {
    readonly setLowThreshold: (db: number, time?: number) => void
    readonly setLowRatio: (ratio: number, time?: number) => void
    readonly setLowMakeupGain: (db: number, time?: number) => void
    readonly setMidThreshold: (db: number, time?: number) => void
    readonly setMidRatio: (ratio: number, time?: number) => void
    readonly setMidMakeupGain: (db: number, time?: number) => void
    readonly setHighThreshold: (db: number, time?: number) => void
    readonly setHighRatio: (ratio: number, time?: number) => void
    readonly setHighMakeupGain: (db: number, time?: number) => void
    readonly setMix: (mix: number, time?: number) => void
  } = {
    id: uid('multiband-compressor'),
    type: 'multiband-compressor' as const,

    /** Set the low band threshold in dBFS. Negative values — e.g. `-24` means compression starts 24dB below 0. */
    setLowThreshold: (db: number, time?: number) => { compLow.setThreshold(db, time) },
    /** Set the low band compression ratio. `4` means 4:1 compression — 4dB in yields 1dB out above threshold. */
    setLowRatio: (ratio: number, time?: number) => { compLow.setRatio(ratio, time) },
    /** Set the low band makeup gain in dB. Compensates for gain reduction introduced by compression. */
    setLowMakeupGain: (db: number, time?: number) => { gainLow.setGain(Math.pow(10, db / 20), time) },

    /** Set the mid band threshold in dBFS. */
    setMidThreshold: (db: number, time?: number) => { compMid.setThreshold(db, time) },
    /** Set the mid band compression ratio. */
    setMidRatio: (ratio: number, time?: number) => { compMid.setRatio(ratio, time) },
    /** Set the mid band makeup gain in dB. */
    setMidMakeupGain: (db: number, time?: number) => { gainMid.setGain(Math.pow(10, db / 20), time) },

    /** Set the high band threshold in dBFS. */
    setHighThreshold: (db: number, time?: number) => { compHigh.setThreshold(db, time) },
    /** Set the high band compression ratio. */
    setHighRatio: (ratio: number, time?: number) => { compHigh.setRatio(ratio, time) },
    /** Set the high band makeup gain in dB. */
    setHighMakeupGain: (db: number, time?: number) => { gainHigh.setGain(Math.pow(10, db / 20), time) },

    /** Set the overall wet/dry mix. `1` = fully processed, `0` = bypass. */
    setMix: (mix: number, time?: number) => {
      const clamped = Math.max(0, Math.min(mix, 1.0))
      wetGain.setGain(clamped, time)
      dryGain.setGain(1.0 - clamped, time)
    },

    connect: (destination: ScoreAudioNode) => {
      outputGain.connect(destination)
      return component
    },

    disconnect: () => {
      try { outputGain.disconnect() } catch { /* already disconnected */ }
      return component
    },

    dispose: () => {
      try { inputGain.disconnect() } catch { /* already disconnected */ }
      try { filterLow.disconnect() } catch { /* already disconnected */ }
      try { compLow.disconnect() } catch { /* already disconnected */ }
      try { gainLow.disconnect() } catch { /* already disconnected */ }
      try { filterMidHp.disconnect() } catch { /* already disconnected */ }
      try { filterMidLp.disconnect() } catch { /* already disconnected */ }
      try { compMid.disconnect() } catch { /* already disconnected */ }
      try { gainMid.disconnect() } catch { /* already disconnected */ }
      try { filterHigh.disconnect() } catch { /* already disconnected */ }
      try { compHigh.disconnect() } catch { /* already disconnected */ }
      try { gainHigh.disconnect() } catch { /* already disconnected */ }
      try { sumGain.disconnect() } catch { /* already disconnected */ }
      try { wetGain.disconnect() } catch { /* already disconnected */ }
      try { dryGain.disconnect() } catch { /* already disconnected */ }
      try { outputGain.disconnect() } catch { /* already disconnected */ }
    },
  }

  return component
}
