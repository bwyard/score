# ADR 027 — Conductor: Shared Temporal Clock

**Status:** Accepted
**Date:** 2026-03-23

## Context

Score is one tool in a coordinated ecosystem: SCORE (audio), FORM (SDF graphics), STAGE (game runtime), and PRIME (math primitives). The thesis is that FP, Reactive, and Event-driven are the same paradigm at different temporal resolutions. To demonstrate this end-to-end, all tools must share a single canonical notion of time.

Currently, each package that needs timing information derives it independently:

- `@score/sequencer` owns `Transport` and `Clock` — the authoritative audio clock
- `@score/visuals` will consume `AudioVisualState` with `step`, `bar`, `bpm`, `time`
- `@score/gui` uses `engine:step` IPC for per-step UI updates
- FORM (planned) will need animation frame timing tied to audio bars
- STAGE (planned) will need game tick timing tied to the same clock

Without a shared contract, each consumer creates its own time model. When the cross-tool Conductor is built, every consumer gets refactored. The time shape must be locked down now.

## Decision

### 1. `@score/sequencer` is the authoritative clock for Score

`@score/sequencer` already owns `Transport` and `Clock`. It is the single source of canonical time within the Score ecosystem. No other package defines time independently.

### 2. Canonical tick shape — `TemporalTick`

All consumers of time receive a `TemporalTick`:

```ts
export type TemporalTick = {
  readonly bar:        number    // 1-indexed bar count since playback start
  readonly beat:       number    // 1-indexed beat within bar (1..timeSignatureNumerator)
  readonly step:       number    // 0-indexed sequencer step (0..stepsPerBar-1)
  readonly bpm:        number    // current BPM (may change via automation)
  readonly time:       number    // audioContext.currentTime — never Date.now()
  readonly elapsed:    number    // seconds since playback start
  readonly progress:   number    // 0–1 position within current bar
}
```

### 3. `AudioVisualState` embeds `TemporalTick`

`@score/visuals` `AudioVisualState` includes the full tick:

```ts
export type AudioVisualState = {
  readonly tick:       TemporalTick
  readonly waveform:   readonly number[]
  readonly bins:       readonly number[]
  readonly rms:        number
  readonly tracks:     readonly TrackVisualState[]
  readonly math:       MathVisualState      // Lorenz x/y/z, logisticR, ouDrift
  readonly song:       SongVisualMeta       // theme, palette, key, genre
  readonly section:    FormVisualState      // current arrangement section + intensity
}
```

Consumers never destructure individual timing fields from separate sources — they read from `state.tick`.

### 4. `TemporalTick` is exported from `@score/sequencer`

The type lives in `@score/sequencer` as the authoritative source. `@score/visuals` imports it. When `@score/conductor` is built, it re-exports `TemporalTick` unchanged — no migration.

### 5. `@score/conductor` — future cross-tool sync layer

When FORM and STAGE need to consume Score time, a new `@score/conductor` package will:
- Wrap `@score/sequencer` and re-export `TemporalTick`
- Provide a `subscribe(listener: (tick: TemporalTick) => void): () => void` interface
- Broadcast tick events to all registered cross-tool consumers
- Be the integration point for WebSocket sync (ADR 021) when real-time collaboration lands

`@score/conductor` does **not** exist yet. Do not build against it — build against `@score/sequencer` directly until it is needed. When it is created, the migration is: replace `import { TemporalTick } from '@score/sequencer'` with `import { TemporalTick } from '@score/conductor'` everywhere — one find/replace.

### 6. IPC channel `engine:tick` replaces `engine:step`

The existing `engine:step` IPC channel (ADR 009) carries a partial payload. It is superseded by `engine:tick` which carries the full `TemporalTick`. `engine:step` is deprecated and will be removed when all consumers are migrated.

### 7. Audio data stays in renderer — no IPC for waveform/FFT

High-frequency audio analysis data (waveform, FFT bins) is sampled in the renderer via `AnalyserNode` on `requestAnimationFrame`. It does **not** travel through Electron IPC — IPC is not designed for 60fps data streams. The `useAudioVisualState` hook assembles `AudioVisualState` entirely within the renderer by combining:
- `TemporalTick` from the engine reference
- Waveform/FFT from `AnalyserNode.getByteTimeDomainData` / `getByteFrequencyData`
- Math state from `@score/math` chaos function refs (Lorenz, logistic, OUProcess)
- Track state from the last evaluated `SongDefinition`

## Consequences

**Positive:**
- Every consumer of time reads from `TemporalTick` — one shape, one migration path when Conductor lands
- `@score/visuals` `AudioVisualState` is complete and self-consistent — themes receive everything they need in one argument
- No 60fps IPC traffic — audio data stays in the renderer where it lives
- `@score/conductor` is a clean seam, not a rewrite

**Negative:**
- `engine:step` IPC channel is deprecated — existing consumers must migrate to `engine:tick`
- `useAudioVisualState` hook must know about `AnalyserNode`, sequencer step ref, and math refs — three dependencies instead of one. Acceptable at the hook layer (React, not framework code)

## Cross-tool note

The SCORE→FORM bridge (planned, see HANDOFF.md) uses `AudioVisualState` as the message format. FORM's visual fields will be driven by `state.tick`, `state.math`, and `state.tracks`. The `TemporalTick` shape established here is the contract that FORM will receive. Do not change `TemporalTick` without considering the FORM bridge impact.

## ADRs updated by this decision

- **ADR 009** — `engine:tick` supersedes `engine:step`. IPC channel list updated.
- **ADR 026** — `AudioVisualState` now embeds `TemporalTick` rather than individual timing fields.
