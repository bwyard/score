# Component: Step Grid (PunchcardGrid)

**Status:** ✅ Built
**Package:** `@score/gui`
**Todos:** t148 (color legend / track name labels)

## Purpose

Canvas-rendered step sequencer grid. One row per track, one column per step.
Shows which steps are active and highlights the current playhead position.

## Wireframe

```
┌─ Step Grid ─────────────────────────────────────────┐
│                                                      │
│  🟠  kick  ██░░██░░██░░██░░██░░██░░██░░██░░  ▶      │
│  🔴  snare ░░░░██░░░░░░██░░░░░░██░░░░░░██░░         │
│  🟢  hihat ████████████████████████████████         │
│  🔵  synth ░░░░████░░░░████░░░░████░░░░████         │
│  🟣  arp   ░░██░░░░░░██░░░░░░██░░░░░░██░░░░         │
│                                                      │
│       ↑ color strip   ↑ step cells   ↑ cursor col   │
└──────────────────────────────────────────────────────┘
```

## Track Color Coding

| Type | Color |
|---|---|
| kick | 🟠 `#c05a20` orange |
| snare | 🔴 `#c02040` red |
| hihat | 🟢 `#208060` teal |
| synth | 🔵 `#2060a0` blue |
| arp | 🟣 `#6040a0` purple |
| sample | ⚫ `#606060` grey |

## Behaviour

- Cursor column advances on every `engine:step` IPC event (per-step, not per-bar)
- Beat flash: cursor overlay pulses brighter on step 0 (downbeat), 80ms duration
- Empty state: shows "Waiting for song…" centred in panel
- Track name displayed left of color strip (t148 — pending)

## Props

- `tracks` — array of `{ name, type, pattern }`
- `currentStep` — zero-based index of current step
- `stepCount` — total steps per bar (typically 16)
