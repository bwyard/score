// useAudioVisualState.ts — React hook: rAF loop → AudioVisualState
//
// Assembles the AudioVisualState expected by @score/visuals themes at ~60fps via
// requestAnimationFrame. Audio data is sourced from IPC refs (engine:analysis,
// engine:step, engine:state, song:update) — no renderer AudioContext is needed
// since the audio engine runs in the main process via node-web-audio-api.
//
// All input refs are populated by IPC handlers in the parent component. The rAF
// loop reads them on every frame — no React re-subscriptions needed when IPC state
// changes. Pure transform: refs → AudioVisualState.

import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { AudioVisualState, TrackVisualState } from '@score/visuals'
import type { TemporalTick } from '@score/sequencer'

// ── Default / empty state ─────────────────────────────────────────────────────

const ZERO_TICK: TemporalTick = {
  step: 0, bar: 0, beat: 0, bpm: 120, time: 0, stepCount: 16,
}

const EMPTY_STATE: AudioVisualState = {
  waveform: [],
  bins:     [],
  tick:     ZERO_TICK,
  rms:      0,
  tracks:   [],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Compute RMS amplitude 0–1 from normalised waveform samples (−1…1). */
const computeRms = (waveform: readonly number[]): number => {
  if (waveform.length === 0) return 0
  const sumSq = waveform.reduce((acc, s) => acc + s * s, 0)
  return Math.sqrt(sumSq / waveform.length)
}

// ── Types ─────────────────────────────────────────────────────────────────────

/** Audio data received from `engine:analysis` IPC. */
export type IpcAudioData = {
  /** Time-domain waveform normalised to −1…1 (already converted from Uint8). */
  readonly waveform: readonly number[]
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Drives a ~60fps rAF loop that reads IPC-sourced audio refs and assembles
 * {@link AudioVisualState} for `@score/visuals` themes.
 *
 * All refs are updated by the parent's IPC handlers; this hook only reads them
 * each animation frame — no re-subscriptions on every state change.
 *
 * @param audioRef  - Ref to latest `{ waveform }` from `engine:analysis` IPC.
 * @param stepRef   - Ref to `{ step, stepCount }` from `engine:step` IPC.
 * @param bpmRef    - Ref to current BPM from `engine:state` IPC.
 * @param tracksRef - Ref to track visual states from `song:update` IPC.
 * @returns Latest {@link AudioVisualState} updated at animation frame rate.
 *
 * @example
 * ```ts
 * const audioRef  = useRef<IpcAudioData>({ waveform: [] })
 * const stepRef   = useRef<{ step: number; stepCount: number }>({ step: 0, stepCount: 16 })
 * const bpmRef    = useRef<number>(120)
 * const tracksRef = useRef<readonly TrackVisualState[]>([])
 *
 * const state = useAudioVisualState(audioRef, stepRef, bpmRef, tracksRef)
 * ```
 */
export const useAudioVisualState = (
  audioRef:  RefObject<IpcAudioData>,
  stepRef:   RefObject<{ step: number; stepCount: number }>,
  bpmRef:    RefObject<number>,
  tracksRef: RefObject<readonly TrackVisualState[]>,
): AudioVisualState => {
  const [state, setState] = useState<AudioVisualState>(EMPTY_STATE)
  const rafRef    = useRef<number>(0)
  const startTime = useRef<number>(performance.now())

  useEffect(() => {
    const tick = (): void => {
      rafRef.current = requestAnimationFrame(tick)

      const waveform = audioRef.current?.waveform  ?? []
      const rms      = computeRms(waveform)

      const { step = 0, stepCount = 16 } = stepRef.current ?? {}
      const bpm     = bpmRef.current     ?? 120
      const elapsed = (performance.now() - startTime.current) / 1000

      const temporalTick: TemporalTick = {
        step,
        stepCount,
        bpm,
        bar:  Math.floor(step / 4),
        beat: step % 4,
        time: elapsed,
      }

      setState({
        waveform,
        bins:   [],     // engine:analysis does not send FFT bins; extend when engine exposes them
        tick:   temporalTick,
        rms,
        tracks: tracksRef.current ?? [],
      })
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafRef.current) }
  }, [audioRef, stepRef, bpmRef, tracksRef])

  return state
}
