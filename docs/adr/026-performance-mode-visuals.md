# ADR 026 — Performance Mode & Algorave-Style Visuals

**Status:** Accepted
**Date:** 2026-03-24

## Context

Score Studio includes a Performance Mode for live sets and algorave-style performances. This mode needs a rich visual layer that is:
- Driven by the audio engine in real time
- Decoupled from the audio thread (no blocking)
- Extensible with multiple visual targets (oscilloscope, spectrum, punchcard, etc.)
- Architecturally consistent with ADR 027's `TemporalTick` model

The visual state must be self-consistent — a theme/renderer should receive everything it needs in a single argument without querying multiple sources.

## Decision

### 1. `AudioVisualState` is the single visual state object

All visual renderers receive an `AudioVisualState` object containing the full picture:

```ts
export type AudioVisualState = {
  readonly tick:       TemporalTick          // bar, beat, step, bpm, time, elapsed, progress
  readonly waveform:   readonly number[]     // time-domain waveform from AnalyserNode
  readonly bins:       readonly number[]     // frequency bins from AnalyserNode FFT
  readonly rms:        number                // root mean square amplitude (0–1)
  readonly tracks:     readonly TrackVisualState[]
  readonly math:       MathVisualState       // Lorenz x/y/z, logisticR, ouDrift
  readonly song:       SongVisualMeta        // theme, palette, key, genre
  readonly section:    FormVisualState       // current section + intensity
}
```

`TemporalTick` is imported from `@score/sequencer` (see ADR 027). `AudioVisualState` embeds it wholesale — no individual timing fields, no parallel time sources.

### 2. Audio analysis stays in the renderer — no IPC for waveform/FFT

`AnalyserNode` data (waveform, FFT bins) is sampled in the renderer process on `requestAnimationFrame`. It does **not** cross the Electron IPC boundary — IPC is not designed for 60fps data streams. The `useAudioVisualState` hook assembles `AudioVisualState` entirely within the renderer by combining:
- `TemporalTick` from the engine ref (via `engine:step` IPC, migrating to `engine:tick` — ADR 027 §6)
- Waveform + bins from `AnalyserNode.getByteTimeDomainData` / `getByteFrequencyData`
- Math state from `@score/math` chaos refs (Lorenz attractor, logistic map, OUProcess)
- Track state from the last evaluated `SongDefinition`

### 3. Visual targets are registered as named themes

`@score/visuals` defines named render targets. The song author selects a theme via `SongProps.theme`. The Performance Mode canvas switches between registered themes at runtime without reload.

Seven initial targets:
- `oscilloscope` — time-domain waveform line
- `spectrum` — frequency bar chart
- `punchcard` — 16-step grid with active step highlight
- `lorenz` — 3D Lorenz attractor driven by audio amplitude
- `lissajous` — L/R channel parametric curve
- `particles` — amplitude-driven particle system
- `minimal` — BPM pulse + track activity only

### 4. Performance canvas uses `requestAnimationFrame` exclusively

The canvas renderer runs entirely on `requestAnimationFrame`. It never uses `setInterval`, `setTimeout`, or direct audio thread callbacks. Each frame reads the latest `AudioVisualState` snapshot assembled by `useAudioVisualState` and renders it synchronously.

### 5. `@score/visuals` is a temporary home

The visual rendering layer belongs long-term to **Form** (the SDF graphics tool) or a standalone package (Trace / Prism / Lens — naming to be decided before Form Phase 1 starts). Do not add Score-specific assumptions to `@score/visuals`. The interface contract is `AudioVisualState` — Form will consume this same shape.

## Consequences

**Positive:**
- Visual renderers are pure functions: `(state: AudioVisualState, canvas: HTMLCanvasElement) => void` — no side effects, fully testable
- No 60fps IPC traffic — waveform/FFT stays in the renderer
- `AudioVisualState` is self-consistent — themes receive everything in one argument
- Form can consume the same `AudioVisualState` contract with no migration

**Negative:**
- `useAudioVisualState` hook has three dependencies (sequencer ref, AnalyserNode, math refs) — acceptable at the hook boundary
- `@score/visuals` will need extraction when Form activates — plan for that seam

## ADRs updated by this decision

- **ADR 027** — `TemporalTick` from `@score/sequencer` is the timing source for `AudioVisualState`.
