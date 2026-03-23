# ADR 013 — Multiple Independent Pattern Streams

## Status
Accepted — architecture locked, implementation pending

## Context

TidalCycles and Strudel both support multiple independent pattern streams (d1, d2, d3...). Each stream has its own pattern, clock phase, and output routing. This is central to how live coders actually perform — layering and removing streams independently without restarting everything.

Score currently supports one `export default Song(...)` per file. All tracks share one clock and one eval cycle. This is simpler but limits live coding expressiveness.

## Decision

Multiple streams use a `set()` wrapper — one file, one default export, multiple named streams inside:

```ts
import { set, Song, Kick808, Synth } from '@score/dsl'

export default set({
  d1: Song({ bpm: 128, tracks: [Kick808({ pattern: euclidean(4, 8) })] }),
  d2: Song({ bpm: 128, tracks: [Synth({ wave: 'sawtooth', frequency: 65 })] }),
  d3: Song({ bpm: 128, tracks: [hihat] }),
})
```

### Why `set()` over named exports or extending Song

- **Named exports** (`export const d1 = Song(...)`) requires the engine to discover and hydrate multiple exports — breaks the single-entry-point eval model and complicates the vm sandbox
- **Extending Song** (tracks ARE streams) conflates track-level and stream-level concerns — tracks already share a clock by design
- **`set()` wrapper** keeps one default export, one eval cycle, one file. The engine receives a `SetDefinition` instead of a `SongDefinition` and runs each stream as an independent engine lane. Clean, composable, Score-like.

### Stream independence

Each stream in `set()`:
- Has its own step sequencer and clock phase
- Evaluates independently — hot-swapping `d1` does not restart `d2`
- Routes to its own output gain node (independent volume/mute)
- Can have a different BPM (streams are not locked to a shared tempo unless explicitly synced)

### Panic behaviour

`set()` streams all stop on panic key (Cmd/Ctrl+.) — silence is total regardless of stream count.

### Engine changes required

- `@score/dsl`: `set(streams)` factory returning `SetDefinition`
- `@score/cli` engine: detect `SetDefinition` vs `SongDefinition` on eval, hydrate multiple engine lanes
- IPC: `engine:state` broadcasts per-stream state, not global
- GUI: stream selector in TransportBar — mute/solo per stream, active stream highlighted in editor

### Codegen (GUI → code)

When a stream is muted via GUI toggle: `codePatcher` comments out the stream key in the `set()` call. When unmuted: uncomments. The `.ts` file always reflects the current stream state.

## Consequences

- Achieves TidalCycles/Strudel parity for the most common live coding pattern
- `set()` is additive — existing `Song(...)` files continue to work unchanged
- Engine must handle both `SongDefinition` and `SetDefinition` — adds a branch to hydration
- Per-stream IPC state is more complex but enables per-stream visualizer panels
- This is a Phase 11 / live coding feature — implement after Monaco (Phase 13f) so the editor can highlight the active stream

## Notes

- Stream count: no hard limit, but 4–8 is the practical range
- BPM sync option: `set({ sync: true, d1: ..., d2: ... })` forces all streams to share the master clock
- This ADR supersedes any prior assumption that Song() is always the top-level export
