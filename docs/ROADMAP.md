# Score — Roadmap & Architectural Decisions

> This document captures the current roadmap, ecosystem scope, and key architectural decisions.
> Read this alongside the ADRs in `docs/adr/` before making structural changes.
> Last updated: 2026-03-24

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

### Phase 13f — Live Demo Editor (Monaco IDE integration)

The live coding editor is the core of Score Studio. This phase makes it DAW-competitive.

**Core editor hardening (pre-demo):**
- t296 — Replace `fireEvent` with `userEvent` in all slider tests (testing accuracy)
- t295 — Step pad: clicking a step updates the pattern in the code editor, not just the visual grid
- t300 — DSL `index.ts` barrel cleanup — cleaner import paths for song authors
- t297 — HiHat open/closed — add `.open()` DSL method (requires DSL work first)

**Monaco IDE integration (Phase 13f):**
- IntelliSense for all `@score/dsl` exports — autocomplete `Kick`, `Bass303`, chain methods
- Error underlining — parse ScoreError from engine, map to line/column in the editor
- Pattern gutter — show active step as a decoration in the left gutter alongside line numbers
- Live eval indicator — "evaluating…" flash on hot-reload, "error" state on failure
- REPL panel — split view: editor top, eval output / error log bottom
- Multiple file support — `import` from local files within the project (sandbox-safe)

**Bidirectional wiring completeness:**
- Instrument add → auto-appends code line to editor (currently appends a fixed template)
- Track mute/unmute → inserts `.mute()`/removes `.mute()` at correct column in code
- Track delete → removes the corresponding `const` line from code (t298)
- BPM slider → syncs to `Song({ bpm: X })` prop in code
- Step click → updates pattern array at correct index in code (t295)

---

### Phase 14 — DSL Completeness

Goal: every chain method listed in ADR 014 is implemented, validated, and documented.

**Pattern system:**
- t245/t246 — Pattern utilities re-exported from `@score/dsl` + `.pattern(p)` chain method
- t254 (planning) — Pattern streams / `set()` — multiple pattern variations, switched at bar boundaries
- Missing: `.swing(n)`, `.humanize(n)`, `.shift(n)` as first-class chain methods on all instruments

**Theory expansion:**
- t240 — theory.ts: `transpose()`, `relativeMinor()`, `dominantOf()`, `parallelMajor()`, `modeOf()`
- t244 — `dsl/src/math.ts` adapter — musical names wrapping `@score/math` chaos functions (`drift()`, `scatter()`, `pulse()`)
- Missing: chord voicings (e.g. `chord('Am7', 'drop2')`) as note arrays for melodic instruments

**Effects and modulation chain:**
- t247 — `.phaser()/.gate()/.multiband()` chain methods
- Missing: `.tremolo(rate, depth)`, `.chorus(rate, depth, delay)`, `.pitchShift(semitones)` as chain methods
- `.wobble(rate)` — LFO on filter cutoff, BPM-synced (core for dubstep/future bass)
- `.autopan(rate)` — LFO on pan position

**Input validation (pre-ship blocker):**
- t301 — validators.ts: 35 chain methods need range checking with `ScoreError` on invalid input
  - e.g. `volume(0-1)`, `reverb(0-1)`, `attack(>0)`, `detune(-1200 to 1200)`, `filter(20-20000)`
  - Full plan in `claude-resources/DECISION-input-validation.md`

**DSL hygiene:**
- t300 — `index.ts` barrel cleanup — consider re-exporting by category (percussion, melodic, fx, theory)
- t303 — Import blocklist: song files should not `import fs`, `import child_process`, etc.
- t221 — Shared instrument name registry (auto-generates track names, prevents collisions)

**Advanced DSL (planning required):**
- t222 — Mini-notation tagged template: `score\`k..s...hhhh\`` → pattern array
- t223 — Natural language `defineLanguage()` / `parse()` API (post-v1.0)
- t252/t253 (planning) — Undo/redo + file format + autosave

---

### Phase 14b — Pre-Ship Blockers (v0.1.0)

Four hard blockers before any tester receives the app (from `claude-resources/SCORE-PRE-SHIP-CHECKLIST.md`):

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| t302 | `Math.random()` in noise generators — thesis violation | Critical | Replace with `PrimeRng` seeded from song seed |
| t301 | 35 chain method validators missing | Critical | Add validators.ts with range checks |
| t303 | No import blocklist for song files | High | Blocklist `fs`, `child_process`, `net`, etc. |
| — | Electron security audit | High | CSP headers, sandbox enforcement, `nodeIntegration: false` |

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
- t281 — Instrument panel UX + full channel strip (dockable, expandable, full ADR 014 chain method set — DAW-competitive GUI)
- t282 — Per-instrument panel layouts (schedule with t281): Kick/Snare/HiHat/Bass303/FMSynth/SubSynth/Pad/Pluck/Rhodes each get purpose-built compact + expanded panel — progressive disclosure, instrument-aware controls

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

## Contributing

Score is designed to be contributable by following this roadmap. Here's how to pick up work:

### Picking up a task

1. Find a task in this doc or the todo CLI: `node ../claude-resources/todos/todo.js list --project score`
2. Check if it needs a planning session first (marked `t###` with "planning" note above)
3. Read the relevant ADR before changing any system it covers (`docs/adr/`)
4. All code must follow CLAUDE.md style: factory functions, `const`, no `let`, no classes
5. Every new export needs TSDoc. Every new component needs tests shipped with it.
6. Branch off `dev`, PR back into `dev`. CI must pass: typecheck → lint → test → coverage.

### Where to find what

| What | Where |
|------|-------|
| All instruments | `packages/dsl/src/melodic.ts`, `percussion.ts`, `instruments.ts` |
| Chain API types | `packages/dsl/src/chain.ts` |
| Engine (hot-reload) | `packages/gui/src/main/index.ts` |
| Audio backend | `packages/components/src/WebAudioBackend.ts` |
| Synthesis components | `packages/components/src/` |
| Effects | `packages/effects/src/` |
| Music theory | `packages/dsl/src/theory.ts` |
| Noise / math | `packages/math/src/` |
| GUI live editor | `packages/gui/src/renderer/components/LiveCode/` |
| GUI instrument panels | `packages/gui/src/renderer/components/InstrumentPanel/` |
| GUI mixer | `packages/gui/src/renderer/components/Mixer/` |
| IPC bridge | `packages/gui/src/main/ipc-types.ts` |

### Good first tasks

- Add a new chain method (e.g. `.tremolo(rate, depth)`) — follow the pattern in `packages/dsl/src/chain.ts`
- Add input validation to an existing chain method — see `claude-resources/DECISION-input-validation.md`
- Write a missing test for an instrument — check coverage with `pnpm test --coverage`
- Fix a thesis violation (see Thesis Violations list above)
- Add a missing effect — follow `packages/effects/src/reverb.ts` as the pattern

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

---

## Open Architecture Decisions (require planning session)

### Math DSL bridge — @score/math in song files

**Question:** Should `@score/math` primitives (Lorenz attractor, logistic map, OUProcess) be usable directly as chain modifiers in song files?

**Option A — `@score/dsl` adapter:** Add `.drift(amount)`, `.scatter(seed)`, `.chaos(fn)` chain methods to ChainMethods. These call into `@score/math` under the hood. Song authors import only `@score/dsl`.

**Option B — new `@score/math-dsl` package:** A thin adapter package that wraps `@score/math` in DSL-friendly named functions. Song authors can `import { drift, lorenz } from '@score/math-dsl'` as pattern generators.

**Option C — direct `@score/math` import in songs:** Song authors import `@score/math` directly and use it in pattern generator functions: `Kick(step => lorenz(step) > 0.5 ? 1 : 0)`.

Tracked as planning item — do not implement until decided. W3 to produce recommendation in `docs/design/dsl-math-bridge.md`.

### Prime (Rust + WASM) integration

**Question:** How does Prime (the Rust math primitives library) connect to Score's synthesis pipeline?

- Prime is currently standalone Rust + WASM, pure functions
- The thesis requires a `prime-render` function that proves temporal assembly at the sample level  
- Score's noise generators (fillWhiteNoise/fillPinkNoise/fillBrownNoise) currently use `Math.random()` — thesis violation (t302)
- Replacing `Math.random()` with `PrimeRng` (seeded, deterministic) is the bridge point

**Open:** How does `@score/prime` expose the Rust WASM module to the TypeScript engine? Via `@score/math` as an optional backend? Tracked as pre-ship blocker t302.

### Docs freshness system

**Decision needed:** How do we keep docs current as the API evolves?

Options:
- CI check: a script that verifies every `export const` in `@score/dsl/src/chain.ts` is mentioned in INSTRUMENTS.md/EFFECTS.md (failing CI blocks merge with missing docs)
- TSDoc extraction: generate docs from TSDoc comments via `typedoc` — source of truth shifts to code comments, not markdown files
- Checklist in PR template: "If you changed a public API, update the relevant doc file" — low-tech, relies on humans

Tracked as a todo. Recommendation: TSDoc extraction long-term, PR checklist short-term.
