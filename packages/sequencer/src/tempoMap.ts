// Tempo map — BPM changes over time + swing/groove

/**
 * A single BPM change event anchored to a bar number.
 */
export type TempoChange = {
  /** The bar (zero-indexed) at which the BPM change takes effect. */
  readonly bar: number
  /** The new beats-per-minute value from this bar onward. */
  readonly bpm: number
}

/**
 * Configuration props for {@link createTempoMap}.
 */
export type TempoMapProps = {
  /** Starting BPM before any changes. Defaults to `120`. */
  readonly initialBPM?: number
  /** Pre-seeded list of BPM change events, sorted or unsorted. */
  readonly changes?: ReadonlyArray<TempoChange>
  /** Swing amount 0–1 (0 = straight, 1 = full triplet feel). Defaults to `0`. */
  readonly swing?: number
}

/**
 * A lookup table mapping bar positions to BPM values with optional swing offset.
 * Supports incremental edits — changes can be added or removed while a song is running.
 */
export type TempoMap = {
  /** Returns the BPM in effect at the given bar, falling back to `initialBPM`. */
  readonly getBPMAtBar: (bar: number) => number
  /**
   * Returns the swing time offset (in seconds) for a given tick.
   * Odd ticks are delayed by `swing × tickDuration × 0.5`; even ticks return `0`.
   *
   * @param tick         - The tick number (0-based).
   * @param tickDuration - Duration of one tick in seconds.
   */
  readonly getSwingOffset: (tick: number, tickDuration: number) => number
  /**
   * Insert or replace a BPM change at the given bar.
   * @param bar - The bar number (zero-indexed).
   * @param bpm - The new BPM value.
   */
  readonly addChange: (bar: number, bpm: number) => void
  /**
   * Remove the BPM change at the given bar, if present.
   * @param bar - The bar number to remove.
   */
  readonly removeChange: (bar: number) => void
  /**
   * Update the global swing amount.
   * @param amount - Clamped to `[0, 1]`.
   */
  readonly setSwing: (amount: number) => void
  /** Current swing amount (clamped `[0, 1]`). */
  readonly swing: number
  /** The baseline BPM used when no change precedes the requested bar. */
  readonly initialBPM: number
  /** A read-only snapshot of all registered BPM change events, sorted by bar. */
  readonly changes: ReadonlyArray<TempoChange>
  /** Clear all BPM changes. Does not reset `initialBPM` or swing. */
  readonly dispose: () => void
}

/**
 * Create a tempo map that resolves BPM at any bar position and computes swing offsets.
 * Changes can be added or removed at runtime, making it suitable for songs with
 * mid-track tempo shifts or live tempo automation.
 *
 * @param props - Optional initial configuration: `initialBPM`, `changes`, and `swing`.
 * @returns A {@link TempoMap} instance.
 *
 * @example
 * ```ts
 * const tempoMap = createTempoMap({ initialBPM: 128, swing: 0.3 })
 * tempoMap.addChange(8, 140)   // jump to 140 BPM at bar 8
 * const bpm = tempoMap.getBPMAtBar(8)  // 140
 * ```
 */
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
