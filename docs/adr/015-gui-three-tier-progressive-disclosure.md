# ADR 015 — GUI Three-Tier Progressive Disclosure

**Date:** 2026-03-23
**Status:** Accepted
**Deciders:** Project owner

---

## Context

The fluent chain API (ADR 014) exposes 40+ methods per instrument. Showing all controls simultaneously in Score Studio would produce an interface indistinguishable from a traditional DAW — too dense for beginners and inconsistent with the code-first philosophy. At the same time, power users expect full access without round-tripping to the code editor for every tweak.

---

## Decision

Score Studio uses a **three-tier control system** per track.

**Tier 1 — Quick Strip** (always visible in the mixer row):
- Volume knob
- Pattern density badge (step count indicator, clickable)
- Instrument-characteristic control — one control per family:
  - Kick → Tune, Snare → Snappy, Bass303 → Filter cutoff, Pad → Reverb
- Reverb knob
- Mute toggle

**Tier 2 — Instrument Panel** (shown when track row ▼ is clicked):
Grouped into four sections (~12–15 controls total):
- **Rhythm** — pattern punchcard, density, swing
- **Timbre** — oscillator, filter, instrument-specific character params
- **Space** — reverb wet, room size, delay, pan
- **Dynamic** — volume, compressor threshold, sidechain

**Tier 3 — Full Chain** (shown via ⋯ button):
- All 40+ chain methods rendered as individual widgets
- Deferred to post-Friday milestone; panel is a stub for now

Every control in every tier calls `patchChainMethod()`, which writes the corresponding chain method back to the song file. Tier does not affect what code is generated — only how many controls are visible at once.

---

## Consequences

**Positive:**
- Beginners can make a track with 5 controls; no cognitive overload
- Power users access the full chain without switching to the code editor
- `patchChainMethod()` is the single write path — tiers share codegen logic
- Tier 2 groups map directly to ADR 014 chain method categories

**Negative:**
- Tier 1 characteristic control is instrument-specific — requires a per-family registry
- Tier 3 is intentionally deferred, leaving a gap for early testers
- Three tiers add UI surface area and require explicit expand/collapse state management

---

## Alternatives Considered

- **Single flat panel** — all controls always visible. Rejected: overwhelming for non-developers.
- **Two tiers only** (quick strip + full panel) — simpler, but loses the progressive ramp for intermediate users.
- **Code editor only** — no GUI controls. Rejected: testers who are musicians, not coders, need GUI entry points.
