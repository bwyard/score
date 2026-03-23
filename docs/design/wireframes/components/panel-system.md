# Component: Panel System

**Status:** ✅ Built (DraggablePanel)
**Package:** `@score/gui`
**Todos:** t146 (layout), t148 (color legend)

## Purpose

Container system for all visualizer panels. Panels are draggable,
resizable, and closeable. Default layout defined per mode.
VSCode-style docking on roadmap.

## Wireframe

```
┌─ Panel Title ──────────── [─][□][×] ─┐
│                                       │
│  panel content                        │
│                                       │
└───────────────────────────────────────┘
         ↕ resize handle (bottom edge)
```

## Behaviour

- Drag by title bar to reposition
- Resize by dragging bottom/right edge
- Close button hides panel (restore from View menu)
- Default layout restored on mode re-entry (or manually via "Reset Layout")
- Panels snap to grid (optional — to be decided)

## Panel Types

| Panel | Component | Status |
|---|---|---|
| Step Grid | `PunchcardGrid` | ✅ Built |
| Waveform | `ScopeOscilloscope` | ✅ Built |
| Spectrum | AnalyserNode FFT | ⬜ t139 |
| Piano Roll | ⬜ future | ⬜ |

## Open Questions

- Should panel layout persist to disk between sessions?
- Minimum panel size constraints?
- Snap-to-grid or free positioning?
