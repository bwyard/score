// Tempo map — BPM changes over time + swing/groove

export type TempoChange = {
  readonly bar: number
  readonly bpm: number
}

export type TempoMapProps = {
  readonly initialBPM?: number        // default 120
  readonly changes?: ReadonlyArray<TempoChange>
  readonly swing?: number             // 0-1, default 0
}

export type TempoMap = {
  readonly getBPMAtBar: (bar: number) => number
  readonly getSwingOffset: (tick: number, tickDuration: number) => number
  readonly addChange: (bar: number, bpm: number) => void
  readonly removeChange: (bar: number) => void
  readonly setSwing: (amount: number) => void
  readonly swing: number
  readonly initialBPM: number
  readonly changes: ReadonlyArray<TempoChange>
  readonly dispose: () => void
}

export const createTempoMap = (props?: TempoMapProps): TempoMap => {
  const startBPM = props?.initialBPM ?? 120

  // Hardware-boundary exception: engine-layer mutable state. const binding, property mutation only.
  type TempoMapState = { changes: Array<TempoChange>; swingAmount: number }
  const state: TempoMapState = {
    swingAmount: Math.max(0, Math.min(1, props?.swing ?? 0)),
    changes: props?.changes ? [...props.changes].sort((a, b) => a.bar - b.bar) : [],
  }

  const tempoMap: TempoMap = {
    getBPMAtBar: (bar: number): number =>
      // Reduce over sorted changes — the last change at or before `bar` wins
      state.changes.reduce((bpm, change) => change.bar <= bar ? change.bpm : bpm, startBPM),

    getSwingOffset: (tick: number, tickDuration: number): number => {
      if (tick % 2 === 0) return 0
      return state.swingAmount * tickDuration * 0.5
    },

    addChange: (bar: number, bpm: number): void => {
      // Filter, append, re-sort — no in-place push or sort mutation
      state.changes = [...state.changes.filter((c) => c.bar !== bar), { bar, bpm }]
        .sort((a, b) => a.bar - b.bar)
    },

    removeChange: (bar: number): void => {
      state.changes = state.changes.filter((c) => c.bar !== bar)
    },

    setSwing: (amount: number): void => {
      state.swingAmount = Math.max(0, Math.min(1, amount))
    },

    get swing() { return state.swingAmount },
    get initialBPM() { return startBPM },
    get changes(): ReadonlyArray<TempoChange> { return [...state.changes] },

    dispose: (): void => {
      state.changes = []
    },
  }

  return tempoMap
}
