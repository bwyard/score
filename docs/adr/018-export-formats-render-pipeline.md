# ADR 018 — Export Formats and Render Pipeline

**Date:** 2026-03-23
**Status:** Proposed
**Deciders:** Project owner

---

## Context

Testers need to share their tracks externally. SoundCloud, Spotify, and other platforms require MP3; industry remix workflow requires stems; Ableton/FL Studio import requires MIDI. WAV alone is insufficient. The render pipeline must stay client-side — no server should touch a user's audio.

---

## Decision

Score supports **four export formats**:

| Format | Mechanism | Notes |
|---|---|---|
| **WAV** | `OfflineAudioContext` offline render | Primary format; lossless |
| **MP3** | lamejs WASM, post-render in a Worker | Client-side; no server |
| **Stems** | `OfflineAudioContext`, solo each track in turn | One WAV per instrument variable |
| **MIDI** | Pattern array extraction; no audio render | Pure data; no `OfflineAudioContext` needed |

**CLI:** `score export --format wav|mp3|stems|midi [--bitrate 320] [--output ./out/]`

**GUI:** File > Export dialog with:
- Format picker (WAV / MP3 / Stems / MIDI)
- MP3 bitrate selector (128 / 192 / 320 kbps)
- Output path / filename field
- Progress bar (render duration / song duration)

**Stems naming:** instrument variable names from the song file (e.g. `kick.wav`, `bass303.wav`). The eval sandbox exports a track registry alongside the `Song` default export.

**MP3 encoding** runs in a `Worker` after the WAV buffer is produced. The main thread receives a progress event stream. This keeps the GUI responsive during long renders.

**MIDI export** walks each track's pattern array and note sequence to emit Note On/Off events at the correct BPM-relative tick positions. Output is a standard `.mid` file (MIDI 1.0, single track per instrument).

---

## Consequences

**Positive:**
- All rendering is client-side — no server dependency, no privacy risk
- WAV is always the render primitive; MP3/Stems are post-processing passes
- Stems enable professional remix workflow from day one
- MIDI bridges Score to every other DAW

**Negative:**
- lamejs WASM adds ~200 KB to the bundle
- Stems render time scales linearly with track count (one full render per track)
- MIDI export requires instrument metadata (note, duration) that not all instruments currently expose

---

## Alternatives Considered

- **Server-side FFmpeg for MP3** — simpler implementation. Rejected: requires a server, adds latency, raises privacy concerns for unpublished music.
- **OGG Vorbis instead of MP3** — open format, better quality at bitrate. Rejected: platform compatibility (iOS, some social platforms) still requires MP3.
- **Single mixed stem only** — no per-track stems. Rejected: stems are the industry standard handoff format; omitting them would limit professional use.
