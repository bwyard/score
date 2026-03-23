# ADR 024 — Audio and MIDI Device Configuration

**Date:** 2026-03-23
**Status:** Proposed
**Deciders:** Project owner

---

## Context

Artists use audio interfaces (Focusrite Scarlett, SSL 2+, RME Babyface) rather than laptop speakers. The default `AudioContext` picks the OS system default, which is almost always the built-in speakers — wrong for any studio session. MIDI controllers need explicit device binding. Without explicit device configuration, Score is unsuitable for professional use.

---

## Decision

Device configuration is stored in `score.json` under a `"devices"` key:

```json
{
  "devices": {
    "audioOutput": "Focusrite USB Audio",
    "audioInput":  "Focusrite USB Audio",
    "midi": ["Arturia KeyStep 37", "Ableton Push 2"]
  }
}
```

**Fallback chain:** project `score.json` → `~/.score/config.json` (global defaults) → OS system default.

**Score Studio Settings panel** (gear icon):
- Audio output selector — populated via `navigator.mediaDevices.enumerateDevices()` / `AudioContext.sinkId`
- Audio input selector — for LiveIn / live recording (ADR cross-ref: LiveIn feature)
- MIDI device checklist — all detected MIDI inputs; checked items are active

Changes write to `score.json` immediately. No restart required — the backend layer creates a new `AudioContext` with the updated `sinkId` on next eval.

**CLI commands:**

```
score devices                            # list all detected audio + MIDI devices
score config set audioOutput "Focusrite USB Audio"   # set global default
score config set audioInput  "Focusrite USB Audio"
score config get audioOutput             # read current value
```

`score devices` reads from `navigator.mediaDevices` in the Node web-audio-api polyfill layer (ADR 010).

---

## Consequences

**Positive:**
- Audio interface selection survives project restarts — stored, not ephemeral
- `~/.score/config.json` global defaults mean a new project inherits the user's preferred device without reconfiguration
- MIDI device checklist enables multi-device setups (keyboard + pad controller simultaneously)
- `score devices` gives CLI users the same device visibility as GUI users

**Negative:**
- `AudioContext.setSinkId()` is not yet supported in all Electron versions — requires version gating or fallback
- Device names are OS strings — they can change when the device is reconnected or renamed
- The Node polyfill layer (node-web-audio-api) has limited MIDI device enumeration support; CLI MIDI listing may be incomplete on some platforms

---

## Alternatives Considered

- **Hard-code to system default** — zero configuration. Rejected: immediately wrong for every studio setup.
- **Separate device config file** (e.g. `~/.score/devices.json` only) — no per-project override. Rejected: different projects may target different hardware (studio interface vs. laptop speakers for a live set).
- **Environment variable for audio device** — `SCORE_AUDIO_OUTPUT=...`. Rejected: not discoverable in the GUI; duplicates the config system.
