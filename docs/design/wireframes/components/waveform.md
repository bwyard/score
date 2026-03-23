# Component: Waveform (ScopeOscilloscope)

**Status:** ✅ Built
**Package:** `@score/gui`

## Purpose

Real-time oscilloscope view of the live audio output.
Displays the time-domain waveform from the AnalyserNode.

## Wireframe

```
┌─ Waveform ──────────────────────────────────────────┐
│                                                      │
│  0 ──────────∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿──────────── 0  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Behaviour

- Driven by `engine:analysis` IPC — float32 time-domain samples at ~20fps
- Centred on zero crossing
- Colour: single line, accent colour (TBD from design tokens)
- Empty state: flat line at zero
