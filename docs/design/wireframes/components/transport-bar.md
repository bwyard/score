# Component: TransportBar

**Status:** ✅ Built
**Package:** `@score/gui`

## Purpose

Persistent top bar present in all modes. Controls playback and displays engine state.
Always pinned to top — never draggable or hideable.

## Wireframe

```
┌──────────────────────────────────────────────────────┐
│ ← Score  [Mode Name]  ●140bpm  ▶ Play  ■ Stop  Bar:4 │
└──────────────────────────────────────────────────────┘
```

## Elements

| Element | Description |
|---|---|
| `← Score` | Home button — returns to splash screen |
| `[Mode Name]` | Current mode label (Live Code / Produce / DJ Set / Jam) |
| `●140bpm` | Live BPM display — editable on click |
| `▶ Play` | Evals code then starts engine (Live Code mode) |
| `■ Stop` | Stops engine, resets bar counter |
| `Bar:4` | Current bar count |

## Props

- `onHome` — callback to return to splash
- `mode` — current mode label
- `bpm` — current BPM
- `bars` — current bar count
- `playing` — boolean
- `onPlay` / `onStop`
- `onBpmChange`
