// useAudioVisualState.test.ts — Unit tests for the rAF-driven audio visual state hook.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioVisualState } from '../src/renderer/hooks/useAudioVisualState.js'
import type { IpcAudioData } from '../src/renderer/hooks/useAudioVisualState.js'
import type { TrackVisualState } from '@score/visuals'
import { createRef } from 'react'

// ── rAF mocking ────────────────────────────────────────────────────────────────

let rafCallbacks: Array<(t: number) => void> = []

beforeEach(() => {
  rafCallbacks = []
  vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => {
    rafCallbacks.push(cb)
    return rafCallbacks.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => { rafCallbacks = [] })
  vi.stubGlobal('performance', { now: () => 1000 })
})

afterEach(() => {
  vi.restoreAllMocks()
})

const flushRaf = (): void => {
  const cbs = [...rafCallbacks]
  rafCallbacks = []
  cbs.forEach(cb => { cb(1000) })
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const makeAudioRef  = (waveform: readonly number[] = []) =>
  Object.assign(createRef<IpcAudioData>(), { current: { waveform } })

const makeStepRef   = (step = 0, stepCount = 16) =>
  Object.assign(createRef<{ step: number; stepCount: number }>(), { current: { step, stepCount } })

const makeBpmRef    = (bpm = 120) =>
  Object.assign(createRef<number>(), { current: bpm })

const makeTracksRef = (tracks: readonly TrackVisualState[] = []) =>
  Object.assign(createRef<readonly TrackVisualState[]>(), { current: tracks })

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useAudioVisualState', () => {
  it('returns EMPTY_STATE before first rAF tick', () => {
    const { result } = renderHook(() =>
      useAudioVisualState(makeAudioRef(), makeStepRef(), makeBpmRef(), makeTracksRef()),
    )
    expect(result.current.waveform).toEqual([])
    expect(result.current.rms).toBe(0)
    expect(result.current.tick.step).toBe(0)
    expect(result.current.tick.bpm).toBe(120)
  })

  it('populates waveform from audioRef after rAF tick', () => {
    const audioRef = makeAudioRef([0.5, -0.5, 0.3])
    const { result } = renderHook(() =>
      useAudioVisualState(audioRef, makeStepRef(), makeBpmRef(), makeTracksRef()),
    )
    act(() => { flushRaf() })
    expect(result.current.waveform).toEqual([0.5, -0.5, 0.3])
  })

  it('computes rms from waveform samples', () => {
    // rms of [1, 1, 1, 1] = 1.0
    const audioRef = makeAudioRef([1, 1, 1, 1])
    const { result } = renderHook(() =>
      useAudioVisualState(audioRef, makeStepRef(), makeBpmRef(), makeTracksRef()),
    )
    act(() => { flushRaf() })
    expect(result.current.rms).toBeCloseTo(1.0, 5)
  })

  it('rms is 0 for silent waveform', () => {
    const audioRef = makeAudioRef([0, 0, 0, 0])
    const { result } = renderHook(() =>
      useAudioVisualState(audioRef, makeStepRef(), makeBpmRef(), makeTracksRef()),
    )
    act(() => { flushRaf() })
    expect(result.current.rms).toBe(0)
  })

  it('populates tick.step from stepRef', () => {
    const stepRef = makeStepRef(7, 16)
    const { result } = renderHook(() =>
      useAudioVisualState(makeAudioRef(), stepRef, makeBpmRef(), makeTracksRef()),
    )
    act(() => { flushRaf() })
    expect(result.current.tick.step).toBe(7)
    expect(result.current.tick.stepCount).toBe(16)
  })

  it('populates tick.bpm from bpmRef', () => {
    const bpmRef = makeBpmRef(140)
    const { result } = renderHook(() =>
      useAudioVisualState(makeAudioRef(), makeStepRef(), bpmRef, makeTracksRef()),
    )
    act(() => { flushRaf() })
    expect(result.current.tick.bpm).toBe(140)
  })

  it('derives tick.bar from step/4', () => {
    const stepRef = makeStepRef(8, 16)
    const { result } = renderHook(() =>
      useAudioVisualState(makeAudioRef(), stepRef, makeBpmRef(), makeTracksRef()),
    )
    act(() => { flushRaf() })
    expect(result.current.tick.bar).toBe(2)
    expect(result.current.tick.beat).toBe(0)
  })

  it('derives tick.beat from step % 4', () => {
    const stepRef = makeStepRef(5, 16)
    const { result } = renderHook(() =>
      useAudioVisualState(makeAudioRef(), stepRef, makeBpmRef(), makeTracksRef()),
    )
    act(() => { flushRaf() })
    expect(result.current.tick.beat).toBe(1)   // 5 % 4 = 1
  })

  it('populates tracks from tracksRef', () => {
    const tracks: readonly TrackVisualState[] = [
      { name: 'kick', type: 'kick808', active: true, rms: 0.9 },
    ]
    const tracksRef = makeTracksRef(tracks)
    const { result } = renderHook(() =>
      useAudioVisualState(makeAudioRef(), makeStepRef(), makeBpmRef(), tracksRef),
    )
    act(() => { flushRaf() })
    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0]?.name).toBe('kick')
  })

  it('bins is always empty (engine:analysis does not send FFT)', () => {
    const { result } = renderHook(() =>
      useAudioVisualState(makeAudioRef([1, 0, -1]), makeStepRef(), makeBpmRef(), makeTracksRef()),
    )
    act(() => { flushRaf() })
    expect(result.current.bins).toEqual([])
  })

  it('reads updated ref values on each rAF tick without re-render', () => {
    const audioRef = makeAudioRef([0, 0])
    const { result } = renderHook(() =>
      useAudioVisualState(audioRef, makeStepRef(), makeBpmRef(), makeTracksRef()),
    )
    act(() => { flushRaf() })
    expect(result.current.rms).toBe(0)

    // Mutate ref directly — no setState, no re-render
    audioRef.current = { waveform: [1, 1, 1, 1] }
    act(() => { flushRaf() })
    expect(result.current.rms).toBeCloseTo(1.0, 5)
  })

  it('cancels rAF on unmount', () => {
    const cancelSpy = vi.fn()
    vi.stubGlobal('cancelAnimationFrame', cancelSpy)
    const { unmount } = renderHook(() =>
      useAudioVisualState(makeAudioRef(), makeStepRef(), makeBpmRef(), makeTracksRef()),
    )
    unmount()
    expect(cancelSpy).toHaveBeenCalled()
  })
})
