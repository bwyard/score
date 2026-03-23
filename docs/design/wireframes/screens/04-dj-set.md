# Screen: DJ Set Mode

**Status:** ⬜ Future — not in tester release
**Phase:** 12e
**Route:** Entered from splash → DJ Set

## Purpose

Two-deck performance view. Load tracks onto decks, sync BPM,
mix with crossfader and EQ. Hardware XDJ profile support.

## Wireframe

```
┌──────────────────────────────────────────────────────┐
│ ← Score  [DJ Set]  ●140bpm  ▶ Play  ■ Stop          │
├─────────────────────┬────────────────────────────────┤
│  DECK A             │  DECK B                        │
│  Track: techno.js   │  Track: —                      │
│  BPM: 140  Key: Am  │  BPM: —    Key: —              │
│                     │                                │
│  ∿∿∿∿∿∿∿∿∿∿∿∿∿∿    │  ░░░░░░░░░░░░░░               │
│  [hot cue 1-4]      │  [hot cue 1-4]                 │
│                     │                                │
│  [▶ CUE] [▶ PLAY]   │  [▶ CUE] [▶ PLAY]              │
│  [LOOP ←][LOOP →]   │  [LOOP ←][LOOP →]              │
│                     │                                │
│  Hi  ──●──          │  Hi  ──●──                     │
│  Mid ──●──          │  Mid ──●──                     │
│  Lo  ──●──          │  Lo  ──●──                     │
├─────────────────────┴────────────────────────────────┤
│         [───────────────●───────────────]            │
│                    Crossfader                        │
│         Gain A ──●──        Gain B ──●──             │
└──────────────────────────────────────────────────────┘
```

## Layout

| Zone | Content |
|---|---|
| Top-left | Deck A — waveform, BPM, key, cues, transport |
| Top-right | Deck B — waveform, BPM, key, cues, transport |
| Bottom | Crossfader + per-deck EQ (Hi/Mid/Lo) + gain |

## Features (Phase 12e scope)

- Auto-BPM detection from audio files
- Musical key detection (harmonic mixing)
- Hot cues + loop points
- Track library / crate management
- Deck A ↔ B BPM sync (master/slave)
- Set/performance recording to WAV
- XDJ-RX3 / XDJ-XZ hardware profiles (Phase 12)
