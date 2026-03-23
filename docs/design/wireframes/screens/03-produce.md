# Screen: Produce Mode

**Status:** ⬜ Future — not in tester release
**Phase:** 13b+
**Route:** Entered from splash → Produce

## Purpose

Arrangement-focused view. Artist builds a full track with a timeline,
mixer, and automation lanes. Non-live — compose offline, then perform.

## Wireframe

```
┌──────────────────────────────────────────────────────┐
│ ← Score  [Produce]  ●140bpm  ▶ Play  ■ Stop  Bar:4  │
├────────────────────┬─────────────────────────────────┤
│  Track list        │  Arrangement / timeline          │
│  ┌──────────────┐  │  bar: 1    2    3    4    5      │
│  │ 🟠 Kick      │  │  ████░░████░░████               │
│  │ 🔴 Snare     │  │  ░░██░░░░██░░░░██               │
│  │ 🟢 HiHat     │  │  ████████████████               │
│  │ 🔵 Synth     │  │  ░░░░████░░░░████               │
│  │ + Add track  │  │                                  │
│  └──────────────┘  │  [playhead cursor]               │
├────────────────────┴─────────────────────────────────┤
│  ┌─ Mixer ──────────────────┐  ┌─ Automation ──────┐ │
│  │  K    Sn   HH   Sy  Mst  │  │ BPM ∿∿∿           │ │
│  │  ▓▓   ▓▓   ▓▓   ▓▓   ▓▓ │  │ Vol ∿∿            │ │
│  │  fdr  fdr  fdr  fdr  fdr │  │ Flt ∿∿∿∿          │ │
│  └──────────────────────────┘  └───────────────────┘ │
└──────────────────────────────────────────────────────┘
```

## Layout

| Zone | Content |
|---|---|
| Top-left | Track list with mute/solo controls |
| Top-right | Arrangement timeline (bars × tracks) |
| Bottom-left | Mixer — per-track faders + master |
| Bottom-right | Automation lanes — BPM, volume, filter curves |

## Open Questions

- Clip-based (Ableton-style) or linear arrangement?
- Does Produce mode use the same song file format as Live Code?
- Automation: drawn curves or recorded from hardware?
