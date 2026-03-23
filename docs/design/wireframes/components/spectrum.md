# Component: Spectrum Analyser

**Status:** ⬜ Planned — t139 AnalyserNode IPC
**Package:** `@score/gui`

## Purpose

Frequency domain view. FFT of live audio output — shows bass, mids,
and highs in real time. Standard DJ / studio monitoring tool.

## Wireframe

```
┌─ Spectrum ──────────────────────────────────────────┐
│                                                      │
│  █                                                   │
│  ██                                                  │
│  ████▇                                               │
│  ██████▅▄▃▂▂▁▁▁                                     │
│  20hz          1khz          10khz          20khz   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Behaviour

- Driven by `engine:analysis` IPC — FFT frequency bin data
- X axis: frequency (log scale, 20hz–20khz)
- Y axis: amplitude (dB)
- Bar or line style (to be decided)
- Colour: gradient from bass (warm) to highs (cool) — or single accent colour

## Dependencies

- t139: AnalyserNode IPC — send FFT data from main process to renderer
