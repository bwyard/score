// Play/stop/pause state machine with position tracking
// Uses createClock internally for tick scheduling

import type { TransportState, Position } from './types.js'
import { createClock } from './clock.js'
import type { ClockContext } from './clock.js'

export type TransportProps = {
  readonly bpm?: number           // default 120
  readonly timeSignature?: readonly [number, number]  // default [4, 4]
  readonly ticksPerBeat?: number  // default 4
}

export type Transport = {
  readonly play: () => void
  readonly stop: () => void
  readonly pause: () => void
  readonly seek: (bar: number, beat?: number, tick?: number) => void
  readonly position: Position
  readonly state: TransportState
  readonly bpm: number
  readonly setBPM: (bpm: number) => void
  readonly onBeat: (callback: (position: Position) => void) => void
  readonly onBar: (callback: (position: Position) => void) => void
  readonly onTick: (callback: (position: Position) => void) => void
  readonly dispose: () => void
}

export const createTransport = (context: ClockContext, props?: TransportProps): Transport => {
  const ticksPerBeat = props?.ticksPerBeat ?? 4
  const beatsPerBar = props?.timeSignature?.[0] ?? 4

  // Mutable state
  let currentState: TransportState = 'stopped'
  let pos: Position = { bar: 0, beat: 0, tick: 0 }

  const tickCallbacks: Array<(position: Position) => void> = []
  const beatCallbacks: Array<(position: Position) => void> = []
  const barCallbacks: Array<(position: Position) => void> = []

  const clock = createClock(context, {
    bpm: props?.bpm ?? 120,
    ticksPerBeat,
  })

  clock.onTick((_tickTime: number, _tickNumber: number): void => {
    const prevBeat = pos.beat
    const prevBar = pos.bar

    let nextTick = pos.tick + 1
    let nextBeat = pos.beat
    let nextBar = pos.bar

    if (nextTick >= ticksPerBeat) {
      nextTick = 0
      nextBeat += 1
    }

    if (nextBeat >= beatsPerBar) {
      nextBeat = 0
      nextBar += 1
    }

    pos = { bar: nextBar, beat: nextBeat, tick: nextTick }

    const snapshot = { ...pos }

    for (const cb of tickCallbacks) {
      cb(snapshot)
    }

    if (pos.beat !== prevBeat || pos.bar !== prevBar) {
      for (const cb of beatCallbacks) {
        cb(snapshot)
      }
    }

    if (pos.bar !== prevBar) {
      for (const cb of barCallbacks) {
        cb(snapshot)
      }
    }
  })

  const transport: Transport = {
    play: (): void => {
      if (currentState === 'playing') return
      currentState = 'playing'
      clock.start()
    },

    stop: (): void => {
      if (currentState === 'stopped') return
      currentState = 'stopped'
      clock.stop()
      pos = { bar: 0, beat: 0, tick: 0 }
    },

    pause: (): void => {
      if (currentState !== 'playing') return
      currentState = 'paused'
      clock.stop()
    },

    seek: (bar: number, beat?: number, tick?: number): void => {
      pos = { bar, beat: beat ?? 0, tick: tick ?? 0 }
    },

    get position() { return { ...pos } },
    get state() { return currentState },
    get bpm() { return clock.bpm },

    setBPM: (bpm: number): void => {
      clock.setBPM(bpm)
    },

    onBeat: (callback: (position: Position) => void): void => {
      beatCallbacks.push(callback)
    },

    onBar: (callback: (position: Position) => void): void => {
      barCallbacks.push(callback)
    },

    onTick: (callback: (position: Position) => void): void => {
      tickCallbacks.push(callback)
    },

    dispose: (): void => {
      if (currentState === 'playing') {
        currentState = 'stopped'
      }
      clock.dispose()
      tickCallbacks.length = 0
      beatCallbacks.length = 0
      barCallbacks.length = 0
    },
  }

  return transport
}
