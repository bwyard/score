// BPM-aware tick scheduler using audioContext.currentTime
// Uses the standard Web Audio scheduling pattern:
// setTimeout drives a lookahead loop, actual events are scheduled against currentTime

export type ClockProps = {
  readonly bpm?: number           // default 120
  readonly ticksPerBeat?: number  // default 4 (= 16th notes)
  readonly lookaheadMs?: number   // default 25
  readonly scheduleAheadSec?: number // default 0.1
}

export type Clock = {
  readonly start: () => void
  readonly stop: () => void
  readonly setBPM: (bpm: number) => void
  readonly onTick: (callback: (tickTime: number, tickNumber: number) => void) => void
  readonly currentTick: number
  readonly bpm: number
  readonly isRunning: boolean
  readonly dispose: () => void
}

export type ClockContext = {
  readonly currentTime: number
}

export const createClock = (context: ClockContext, props?: ClockProps): Clock => {
  const ticksPerBeat = props?.ticksPerBeat ?? 4
  const lookaheadMs = props?.lookaheadMs ?? 25
  const scheduleAheadSec = props?.scheduleAheadSec ?? 0.1

  // Mutable state — the one exception to the const rule
  let currentBPM = props?.bpm ?? 120
  let tickDuration = 60 / (currentBPM * ticksPerBeat)
  let running = false
  let tick = 0
  let nextTickTime = 0
  let timerId: ReturnType<typeof setTimeout> | null = null
  const callbacks: Array<(tickTime: number, tickNumber: number) => void> = []

  const schedule = (): void => {
    while (nextTickTime < context.currentTime + scheduleAheadSec) {
      const currentTickNumber = tick
      const currentTickTime = nextTickTime
      for (const cb of callbacks) {
        cb(currentTickTime, currentTickNumber)
      }
      tick += 1
      nextTickTime += tickDuration
    }
  }

  const loop = (): void => {
    if (!running) return
    schedule()
    timerId = setTimeout(loop, lookaheadMs)
  }

  const clock: Clock = {
    start: (): void => {
      if (running) return
      running = true
      nextTickTime = context.currentTime
      tick = 0
      loop()
    },

    stop: (): void => {
      running = false
      if (timerId !== null) {
        clearTimeout(timerId)
        timerId = null
      }
      tick = 0
    },

    setBPM: (bpm: number): void => {
      currentBPM = bpm
      tickDuration = 60 / (currentBPM * ticksPerBeat)
    },

    onTick: (callback: (tickTime: number, tickNumber: number) => void): void => {
      callbacks.push(callback)
    },

    get currentTick() { return tick },
    get bpm() { return currentBPM },
    get isRunning() { return running },

    dispose: (): void => {
      clock.stop()
      callbacks.length = 0
    },
  }

  return clock
}
