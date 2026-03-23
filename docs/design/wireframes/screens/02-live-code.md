# Screen: Live Code Mode

**Status:** ✅ In scope — tester release
**Phase:** 13 / 11b
**Route:** Entered from splash → Live Code

## Purpose

Primary creative surface. Artist writes JS song code in the editor,
evals it, and sees the audio visualized in real time.

## Wireframe

```
┌──────────────────────────────────────────────────────┐
│ ← Score   [Live Code]  ●140bpm  ▶ Play  ■ Stop  Bar:4│  ← TransportBar (pinned)
├──────────────┬───────────────────────────────────────┤
│              │  ┌─ Step Grid ──────────────────────┐ │
│  CODE        │  │ 🟠 kick  ██░░██░░██░░██░░  ▶     │ │
│  EDITOR      │  │ 🔴 snare ░░██░░██░░██░░██        │ │
│  (Monaco)    │  │ 🟢 hihat ████████████████        │ │
│              │  │ 🔵 synth ░░░░████░░░░████        │ │
│              │  └──────────────────────────────────┘ │
│              │  ┌─ Waveform ───────────────────────┐ │
│              │  │  ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿               │ │
│              │  └──────────────────────────────────┘ │
│ ─────────── │  ┌─ Spectrum ───────────────────────┐ │
│  REPL        │  │  ▁▂▄▇█▇▄▂▁                      │ │
│  > eval ok   │  └──────────────────────────────────┘ │
│  > bar: 4    │  ┌─ Piano Roll ─────────────────────┐ │
│  > error: …  │  │  C4 ██░░░░██░░                   │ │
│              │  │  G3 ░░██░░░░██                   │ │
│              │  └──────────────────────────────────┘ │
└──────────────┴───────────────────────────────────────┘
```

## Layout

| Zone | Content | Resizable |
|---|---|---|
| Left — top | Monaco code editor | ✅ |
| Left — bottom | REPL output log | ✅ |
| Right | Visualizer panels (draggable) | ✅ |
| Top | TransportBar | ❌ pinned |

## Play Flow (TidalCycles-style)

1. Artist writes song code in editor
2. Clicks Play (or shortcut) — evals code first, then starts engine
3. Engine plays, visualizers update in real time
4. Artist edits code live — changes apply on next bar boundary (hot reload)

## Visualizer Panels (default layout, right column top→bottom)

1. **Step Grid** — per-track step sequencer with colour-coded rows and moving cursor
2. **Waveform** — oscilloscope view of live audio output
3. **Spectrum** — frequency analyser (AnalyserNode FFT)
4. **Piano Roll** — note grid showing active pitches per track

All panels: draggable, resizable, closeable (t146). Default layout restored on mode re-entry.

## Known Issues / Todos

- t132: switching to another mode and back — audio state not reset (high)
- t145: panel labels in place ("Step Grid", "Waveform", "Spectrum", "Piano Roll") ✅
- t148: color legend for Step Grid track rows — pending
- Punchcard sync: `engine:step` IPC wired ✅ (was `bars % 8` — now per-step)
- t146: draggable panels implemented ✅
