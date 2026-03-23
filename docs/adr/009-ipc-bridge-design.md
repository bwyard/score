# ADR 009 — IPC Bridge Design

**Status:** Accepted
**Date:** 2026-03-22

## Context

The Score Electron application runs the audio engine in the main process and the React GUI in the renderer process. These processes cannot share memory. Communication between them must go through Electron's IPC mechanism.

Without a typed contract, IPC channels are stringly-typed: any typo in a channel name silently fails, payload shapes are undocumented, and the renderer has direct access to `ipcRenderer` — allowing arbitrary channel sends.

## Decision

IPC communication uses a **typed channel registry** exposed via a preload script:

**Main → Renderer channels:**
- `engine:state` — full engine state snapshot
- `engine:step` — per-step sequencer tick (beat, bar, position)
- `engine:analysis` — FFT/waveform analysis data for visualisation
- `engine:notes` — note-on/note-off events for the piano roll display
- `engine:pending` — signals that a hot-swap is queued (see ADR 007)
- `song:update` — song metadata update (title, BPM, key)
- `debug:pop` — error or debug message to surface in the UI

**Renderer → Main channels:**
- `engine:play` — start playback
- `engine:stop` — stop playback
- `engine:eval` — submit song code for evaluation (live-coding REPL)
- `engine:patch` — apply a partial parameter patch without full re-eval

All payloads are **plain JSON-serializable objects** — no class instances, no `Buffer`, no `Uint8Array` in the IPC layer (audio data is handled separately via SharedArrayBuffer where needed).

The preload script exposes only the typed bridge as `window.scoreBridge`. The renderer has **no direct access** to `ipcRenderer`.

## Consequences

- Type-safe IPC: channel names and payload shapes are checked at compile time
- The renderer is fully sandboxed — it cannot send arbitrary IPC channels
- Adding a new channel requires updating the bridge type definition in both `main/ipc/bridge.ts` and `preload/index.ts`, then rebuilding — intentional friction to keep the channel list small
- The `engine:pending` channel is the integration point between the hot-swap system (ADR 007) and the UI amber badge

## Alternatives Considered

- **Direct `ipcRenderer` in renderer** (rejected) — no type safety, renderer can invoke any channel including privileged ones
- **Single `message` channel with a type discriminant** (rejected) — reduces boilerplate but loses named channel semantics and makes TypeScript narrowing awkward
- **Shared memory / SharedArrayBuffer for all data** (deferred) — appropriate for high-frequency audio buffers but not for control messages; hybrid approach (IPC for control, SAB for audio) is the long-term direction
