# Score — Development Strategy

## Current Phase: Phase 13 — GUI & Performance Mode

**Target:** Friday demo. Ship what is solid, no hard deadline.

## Package Ownership & Status

### Ships This Phase (Phase 13)

| Package / Area | Owner | Status | Branch |
|----------------|-------|--------|--------|
| `@score/dsl` chain API | coord | Merged to dev | — |
| `@score/gui` chain wiring (codePatcher, vmContext, STARTER) | W2 | PR #55 | feat/gui-chain-wiring |
| `@score/gui` engine chain hydration | W1 | PR open | feat/engine-chain-hydration |
| `@score/gui` InstrumentPanel + InstrumentPicker | W1 | PR #56 | feat/gui-instrument-panel-components |
| `@score/gui` InstrumentPanel wiring into LiveCode | W1 | In progress | feat/gui-instrument-wiring |
| `@score/gui` Performance Mode shell | W2 | PR #57 | feat/gui-performance-mode |
| `@score/gui` BugReportModal + TransportBar button | W3 | PR open | feat/gui-bug-report-v2 |
| `@score/dsl` SongProps.theme | W2 | PR #58 | feat/song-theme-prop |
| `@score/visuals` scaffold | W3 | In progress | feat/score-visuals |
| Strategy docs | W2 | In progress | feat/score-strategy-docs |

### Stubbed — Types Defined, Implementation Deferred

| Feature | Stub Status | When |
|---------|-------------|------|
| `@score/visuals` theme rendering (dark-pulse, neon-grid, lorenz) | Types + registry only | Phase 13d |
| PerformanceCanvas `@score/visuals` wiring | Placeholder div | After feat/score-visuals merges |
| `useAudioVisualState` hook | Not started | After feat/score-visuals merges |
| Monaco per-line pattern arcs | Not started | Phase 13d |
| `SongProps.theme` engine passthrough | Done (PR #58) | Wiring: Phase 13d |

### Post-Friday / Later Phases

| Feature | Phase | Notes |
|---------|-------|-------|
| WebGL shaders / Three.js | Phase 14 | After 2D canvas themes proven |
| MIDI-to-visual routing | Phase 15 | Requires MIDI CC infrastructure |
| Artist-uploadable themes | Phase 15 | Requires Score Registry (ADR 022) |
| Video output / Syphon / Spout | Phase 15 | Platform-specific |
| E2E tests (Playwright) | Phase 15 | After distribution strategy |
| Real-time collaboration | Post-Phase 15 | ADR 021 |
| Score Registry | Phase 16 | ADR 022 |
| TypeDoc generation | Phase 16 | Before public release |
| `@score/session` (Jam Session engine) | Phase 13b | After core GUI done |

## Merge Order (Phase 13)

1. `feat/dsl-chain-tests` → `feat/dsl-chain-api` → `dev` (W3, PR #53)
2. `feat/engine-chain-hydration` → `dev` (W1)
3. `feat/gui-chain-wiring` → `dev` (W2, PR #55) ← **blocks InstrumentPanel wiring**
4. `feat/gui-bug-report-v2` → `dev` (W3)
5. `feat/song-theme-prop` → `dev` (W2, PR #58)
6. `feat/score-strategy-docs` → `dev` (W2)
7. `feat/gui-instrument-panel-components` → `dev` (W1, PR #56)
8. `feat/gui-instrument-wiring` → `dev` (W1) ← **depends on #3**
9. `feat/gui-performance-mode` → `dev` (W2, PR #57)
10. `feat/score-visuals` → `dev` (W3) ← **blocks PerformanceCanvas wiring**
11. PerformanceCanvas wiring → `dev` (W2) ← **depends on #10**

## Branch Ownership

Each window owns its worktree. Never push to another window's branch.

| Window | Worktree | Current branch |
|--------|----------|----------------|
| W1 | `score-w1` | feat/gui-instrument-wiring |
| W2 | `score-w2` | feat/score-strategy-docs |
| W3 | `score-w3` | feat/score-visuals |

## What "Done" Means Per Ticket

A feature is done when:
1. `pnpm typecheck` passes (zero errors)
2. `pnpm test` passes for all affected packages
3. Coverage thresholds not regressed
4. Branch pushed and PR open targeting `dev`
5. Signal sent: `w{N} DONE: <branch> — <commit hash>`

It is NOT done if:
- Tests pass but typecheck fails
- PR is open but CI is red
- The feature works but has no tests

## Signal Protocol (quick reference)

```
ACK → PLANNING → PLAN READY → [coord ACK] → PROGRESS → COMMIT → DONE
```

Never start coding without coord ACK on your plan.
Commit after each logical unit. Push after each commit.
