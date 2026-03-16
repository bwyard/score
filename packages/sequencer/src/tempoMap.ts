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

  // Mutable state
  let swingAmount = Math.max(0, Math.min(1, props?.swing ?? 0))
  let changeList: Array<TempoChange> = props?.changes
    ? [...props.changes].sort((a, b) => a.bar - b.bar)
    : []

  const tempoMap: TempoMap = {
    getBPMAtBar: (bar: number): number => {
      // Find the last tempo change at or before this bar
      let bpm = startBPM
      for (const change of changeList) {
        if (change.bar <= bar) {
          bpm = change.bpm
        } else {
          break
        }
      }
      return bpm
    },

    getSwingOffset: (tick: number, tickDuration: number): number => {
      // Even ticks (0, 2, 4...) are on the grid
      if (tick % 2 === 0) return 0
      // Odd ticks are delayed by swing amount
      return swingAmount * tickDuration * 0.5
    },

    addChange: (bar: number, bpm: number): void => {
      // Remove any existing change at this bar
      changeList = changeList.filter((c) => c.bar !== bar)
      changeList.push({ bar, bpm })
      changeList.sort((a, b) => a.bar - b.bar)
    },

    removeChange: (bar: number): void => {
      changeList = changeList.filter((c) => c.bar !== bar)
    },

    setSwing: (amount: number): void => {
      swingAmount = Math.max(0, Math.min(1, amount))
    },

    get swing() { return swingAmount },
    get initialBPM() { return startBPM },
    get changes(): ReadonlyArray<TempoChange> { return [...changeList] },

    dispose: (): void => {
      changeList.length = 0
    },
  }

  return tempoMap
}
