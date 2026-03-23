# Score — Roadmap & Architectural Decisions

> This document captures the current roadmap, ecosystem scope, and key architectural decisions.
> Read this alongside the ADRs in `docs/adr/` before making structural changes.
> Last updated: 2026-03-23

---

## Immediate Milestones

### Friday Demo — 2026-03-28
Full band playable in Score Studio GUI. Target instruments:

| Instrument | Status |
|---|---|
| Kick808 / Snare909 / HiHat808 | ✅ Done |
| SubtractiveSynth lead | ✅ Done |
| FMSynth | ✅ Done |
| All modes accessible in GUI | ✅ Done (PR #63) |
| BPM sync + punchcard step click | ✅ Done (PR #64) |
| Percussion chain API + STARTER fix | ✅ Done (PR #66) |
| Performance canvas | ✅ Done (PR #65) |
| Pad engine | W3 in progress |
| Rhodes engine | W3 in progress |
| Pluck engine | W3 in progress |
| Bass303 engine | W3 in progress |

### Tester Package (after Friday)
Hard blockers before any tester ships:
- ⛔ t257 — Onboarding planning session (must happen first)
- t184 — Engine crash resilience (W1 in progress)
- Electron packaging / installers (W2 in progress)
- Tester onboarding doc (output of t257)

---

## Ecosystem Architecture

Score is one tool in a larger temporal architecture ecosystem. All tools share the same DSL philosophy — see `research/working/DSL_GUIDELINES.md` for the universal rules.

### Named Tools

| Tool | Domain | Status | Notes |
|---|---|---|---|
| **Prime** | Math primitives | Done | Rust + WASM, pure functions |
| **Score** | Audio / EDM | Active Phase 13 | This repo |
| **Form** | SDF graphics | Phase 6 complete, paused | Owns visual layer long-term |
| **Stage** | Game runtime | 35 PRs merged, paused | Needs DSL layer |
| **Trace** | Visual rendering | In `@score/visuals` (temp) | Extract when Form activates |
| **Conductor** | Cross-tool sync | Not started | Needs Pact first |
| **Pact** | Shared event schema | Not started | Required before Conductor |
| **Chronicle** | Temporal storage/query | Not started | Stage `EventLog<T>` is the embryo |
| **Gate** | Hardware/physical input | Not started | Stage `stage-input` is the embryo |
| **Proof** | Temporal testing/invariants | Not started | SDET → thesis bridge |
| **Relay** | Distributed sync | Not started | Most ambitious, last |

### Visual Package Decision
`@score/visuals` is a **temporary home**. The visual rendering layer belongs to Form or a standalone package (naming candidates: Trace, Prism, Lens — decision required before Form Phase 1 starts). **Do not add Score-specific assumptions to `@score/visuals`.**

### Thesis Embryos Already Implemented
- `stage-events` `EventLog<T>` → Chronicle
- `stage-input` three-layer action-mapped input → Gate

---

## DSL Design Principles (universal across all tools)

1. **Factory functions, not classes** — `Tool(config)` not `new Tool(config)`
2. **Chaining over imperative** — `.filter(600).resonance(0.4)` not `instrument.setFilter(600)`
3. **Pure functions at the call site** — song/scene/game files declare, they don't execute
4. **`const` + arrow functions only** — zero `let`, zero `function` declarations
5. **Immutable config** — never mutate props, return new state
6. **Named intermediates over mega-chains** — name things at complexity boundaries
7. **Progressive disclosure** — 5-10 methods cover 90% of use cases; `__raw` is the floor
8. **Sensible defaults** — every parameter should produce something useful without config
9. **TODO placeholders in templates** — never pre-fill values in generated files
10. **Error factories not throws** — `ScoreError({ code, message, fix })` everywhere

---

## Phase 13 — Current Phase

**Theme:** GUI + bidirectional wiring + full instrument band.

### Completed
- Score Studio scaffold (Electron + React)
- InstrumentPanel + InstrumentPicker components (PR #56)
- Performance Mode shell (PR #57)
- `SongProps.theme` for visual selection (PR #58)
- Strategy docs index (PR #59)
- InstrumentPanel wiring — patchChainMethod, debounced re-eval (PR #60)
- Thesis `let` cleanup (PR #61)
- `@score/visuals` scaffold — 7 targets, 10 themes, 108 tests, TemporalTick (PR #62)
- All modes unlocked for demo (PR #63)
- Bidirectional wiring — BPM sync + punchcard step click (PR #64)
- Percussion chain API migration — all drums now ChainablePart (PR #66)
- PerformanceCanvas wiring — useAudioVisualState + live renderer (PR #65)

### In Progress
- Melodic instrument engines: Pad, Rhodes, Pluck, Bass303 (W3)
- Engine crash resilience — keep playing on error, show toast (W1)
- Electron packaging + installers (W2)

### Pending (Phase 13 close-out)
- feat/gui-accessibility-zoom — PR #67, CI running
- ⛔ t257 Onboarding planning session — hard blocker before tester ships
- t171 Full project status review before v0.1.0

---

## Post-Phase 13 Roadmap

### Phase 14 — DSL Completeness
- t245/t246 — Pattern utilities re-exported from `@score/dsl` + `.pattern(p)` chain method
- t240 — theory.ts expansion (transpose, relativeMinor, dominantOf, etc.)
- t244 — `dsl/src/math.ts` adapter layer (musical names, curried transforms)
- t247 — `.phaser()/.gate()/.multiband()` chain methods

### Planning Sessions Required Before Starting
These areas require a dedicated planning session before any window touches them:
- t252 — Undo/redo
- t253 — File format + autosave
- t254 — Pattern streams / `set()`
- t255 — Export pipeline
- t256 — Piano roll editing
- t257 — ⛔ Onboarding (tester blocker)
- t258 — Distribution / release candidate
- t259 — Keyboard shortcuts
- t260 — Collaboration / Conductor

### Thesis Violations to Fix (tracked debt)
- `@score/midi` — `let` violations (critical)
- `@score/cli` play.ts — `let` violations (high)
- `@score/components` fm.ts — `let` violations (high)

---

## Release Model

**Free open-source release under real name: Bree Yard.**
Pseudonymous / Satoshi-Bourbaki release model dropped (2026-03-23).
Dual-license business model (Red Hat/MongoDB pattern) remains viable if desired later.

**IP protection:**
1. Email detailed thesis to Gmail before any public release — timestamp is legally meaningful
2. GitHub ADRs are prior art with commit timestamps — **do not modify existing ADRs**
3. Publish thesis MVP to arXiv when ready (pseudonymous release works there)
4. US Copyright Office registration when paper is developed

---

## Key Non-Negotiables (do not reverse)

- No AI-generated music, patterns, or full songs — ever
- No samples bundled — user brings their own
- Song files run as plain ESM — never compiled
- Web Audio API fully abstracted behind the DSL
- `ScoreError` factory for all errors — never `throw new Error()`
- Zero `let`, zero `class`, zero `new` (except Web Audio API internals)
- Every public export gets TSDoc
- Tests and error handling ship with the component — never backfilled
