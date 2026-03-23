# Screen: Jam Session Mode

**Status:** ⬜ Future — not in tester release
**Phase:** 12b
**Route:** Entered from splash → Jam Session

## Purpose

Live hardware performance view. MIDI controller mapped to engine parameters.
Patch and update song in real time without stopping playback.

## Wireframe

```
┌──────────────────────────────────────────────────────┐
│ ← Score  [Jam]  ●140bpm  ▶ Play  ■ Stop  MIDI: ●    │
├────────────────────────┬─────────────────────────────┤
│  Session State         │  MIDI Hardware Map           │
│                        │                              │
│  BPM:        140       │  Knob 1  →  BPM              │
│  Key:        Am        │  Knob 2  →  Master vol       │
│  Bars:       32        │  Knob 3  →  Filter cutoff    │
│  Master vol: ████░     │  Pad 1   →  Kick mute        │
│  MIDI:       ● live    │  Pad 2   →  Snare mute       │
│                        │  Pad 3   →  HiHat mute       │
│  Track mutes:          │  Pad 4   →  Synth mute       │
│  [Kick  ●] [Snare ○]   │                              │
│  [HiHat ●] [Synth ●]   │  Device: XDJ-RX3             │
│                        │  [Remap…]                    │
├────────────────────────┴─────────────────────────────┤
│  Live patch log                                       │
│  > bpm 140 → 142                                      │
│  > track.snare muted                                  │
│  > patch: filter.frequency 800 → 1200                 │
└──────────────────────────────────────────────────────┘
```

## Layout

| Zone | Content |
|---|---|
| Top-left | Session state — BPM, key, bars, mutes, MIDI status |
| Top-right | MIDI hardware map — knob/pad assignments |
| Bottom | Live patch log — real-time parameter change stream |

## Features (Phase 12b scope)

- `createJamSession(engine, config)` already built
- `connectMidi()` / `disconnectMidi()` — safe with or without bridge
- `patch()` — live parameter changes
- `update()` — hot-swap song definition
- SessionState snapshot: playing, bpm, bars, masterVolume, trackMutes, midiConnected
