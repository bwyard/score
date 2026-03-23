# Score Studio — Live Code Demo Readiness Report

**Target:** Tester release week of 2026-03-29
**Audience:** Coders, DJs, music enthusiasts
**Last updated:** 2026-03-22

---

## Executive Summary

A tester can open the app, write a song, hit play, hear audio, and see visualizers. Core demo flow is functional. **Estimated readiness: 95%.** Two items need attention before release.

---

## 1. Done and Working

### Audio Pipeline
- Engine init, BPM sync, bar counting ✅
- Code evaluation (vm sandbox, imports stripped, export default captured) ✅
- Bar-boundary hot-swap (pending queue) ✅
- Web Audio output, master gain, transport play/stop ✅

### Visualizers
- **PunchcardGrid** — canvas, per-track colour rows, playhead cursor, beat flash ✅
- **Scope** — live waveform, glow when playing, flat line when idle ✅
- **SpectrumAnalyser** — 32-bin FFT bars, glow, idle baseline ✅
- **PianoRoll** — MIDI pitch display, note blocks, cursor column ✅

### IPC
- `engine:state` — playing/bpm/bars per bar ✅
- `engine:step` — per-step cursor sync ✅ (fixed commit b8ddc59)
- `engine:analysis` — waveform + spectrum at ~20fps ✅
- `song:update` — track metadata after eval ✅
- `engine:notes` — MIDI note events for piano roll ✅

### Editor
- Textarea + Ctrl+Enter eval ✅
- Code patching: patchBpm, patchTrackVolume, patchTrackPattern, patchTrackNote ✅
- CodeWaveform overlay behind textarea ✅
- STARTER template on entry ✅
- File ops: Save / Open / New ✅

### Panels
- DraggablePanel — drag, resize, close ✅
- Toolbar toggles (Grid/Scope/FFT/Piano/Mixer/Console/Ref) ✅
- Default layout: Punchcard + Scope + Console visible ✅

### Transport
- BPM input → engine.patch() ✅
- Play/Stop, bar counter, home nav ✅
- EvalStatus badges (idle/pending/ok/error) ✅
- ConsoleLog (200-entry FIFO, timestamps, levels) ✅

---

## 2. In Progress

| Item | Status | Impact |
|---|---|---|
| Monaco editor | Not started — Phase 13f | Textarea works fine; IDE feel absent |
| Mixer level meters | Sliders + mute work; no VU meter | Medium — can still control volume |
| Panel edge snapping | Free positioning only | Polish only |
| Reference panel search | Shows snippets, no filter | Low |

---

## 3. Blockers

### 🔴 t158 — Modes not gated (PRE-RELEASE BLOCKER)
Splash shows all 4 modes selectable. Only Live Code is ready.
**Fix:** Disable Produce / DJ Set / Jam Session — grey out + `cursor: not-allowed`.

### 🟡 t147 — Punchcard cursor animation (VERIFY)
Commit b8ddc59 claims this fixed. Must verify with live playback.
**Test:** Play a song → confirm cursor advances step-by-step, wraps at bar end.

### 🟡 t148 — Punchcard colour legend (UX)
Left colour strip has no label. Testers won't know which row is kick vs synth.
**Fix:** Add text labels left of colour strip, or legend below panel.

---

## 4. Nice to Have

- t149: BPM field → code sync (currently one-way)
- t152: Resizable editor/visualizer split (currently 50/50 fixed)
- t154: Beat highlight in Monaco (Phase 13f)
- t159: Inline gutter visualizations (Phase 13f+)

---

## 5. Pre-Release Action List

### Day 1–2 — Critical
1. Disable non-Live-Code modes on splash (t158)
2. Verify punchcard cursor animates step-by-step (t147)

### Day 2–3 — High
3. Add track name labels to punchcard (t148)
4. Full playback smoke test (see demo script below)
5. Test file save/open/new

### Day 3–4 — Medium
6. Check ConsoleLog readability (timestamps, error colours)
7. Transport state display (bars, steps, BPM)

---

## 6. Demo Script (10-step verification)

```
1. Launch → Splash screen with mode selector
2. Click "Live Code" → editor loads with STARTER song
3. Verify visualizer toolbar: Grid / Scope / FFT / Piano / Mixer / Console / Ref
4. Click ▶ Play
   → eval fires → console: "Song loaded — 5 tracks" → "▶ Playing"
   → audio plays (kick/snare/hihat/bass/lead)
   → punchcard cursor animates ← VERIFY t147
   → scope shows live waveform
5. Change BPM → 140 in transport bar → tempo changes, no restart
6. Edit kick pattern → Ctrl+Enter
   → "Swap queued — applying at bar boundary"
   → at bar boundary: song updates, no pop
7. Close Scope panel (×) → Grid remains
8. Click [Ref] → reference panel shows DSL snippets
9. Mixer panel → mute a track → goes silent
10. Click ■ Stop → audio stops, scope flattens, spectrum idles
```

---

## 7. Known Limitations for Testers

| Feature | Status |
|---|---|
| Produce / DJ Set / Jam modes | Disabled — scaffolding only |
| Monaco IDE | Phase 13f — textarea for now |
| Automation lanes | Phase 13d |
| MIDI input | Phase 12b (Jam mode) |
| SuperCollider backend | Phase 12c |
| VST/AU plugins | Phase 13e |
| Stem separation | Phase 12h |

---

## 8. Post-Demo Next Steps

1. Collect tester feedback (usability, audio quality, crashes, missing features)
2. Phase 13f — Monaco + beat gutter
3. Phase 12c — SuperCollider backend
4. Phases 13c/13d — Clip editor, automation lanes
5. Release prep — v0.1.0 beta, `@bwyard/*` scope rename, docs
