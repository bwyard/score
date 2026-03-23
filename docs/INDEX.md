# Score — Documentation Index

> **Start here.** Every session should read this file first to find what it needs.

## Strategy Docs (read these before making architectural decisions)

| Doc | What it answers |
|-----|-----------------|
| [THESIS_COMPLIANCE.md](./THESIS_COMPLIANCE.md) | What "pure functional" means per layer, what is exempt, what is never allowed |
| [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) | Per-package testing approach, pyramid, E2E roadmap |
| [DEVELOPMENT_STRATEGY.md](./DEVELOPMENT_STRATEGY.md) | Phase ownership, what ships now, what is stubbed, what is post-Friday |

## Project Foundation

| Doc | What it covers |
|-----|----------------|
| [../CLAUDE.md](../CLAUDE.md) | Project briefing, non-negotiable rules, git workflow |
| [../SCORE_HANDOFF.md](../SCORE_HANDOFF.md) | Full 17-phase build plan, package architecture |
| [spec/TSDOC_STANDARD.md](./spec/TSDOC_STANDARD.md) | TSDoc comment standard for all public exports |

## User-Facing Docs

| Doc | What it covers |
|-----|----------------|
| [GETTING_STARTED.md](./GETTING_STARTED.md) | Installation and first song |
| [INSTRUMENTS.md](./INSTRUMENTS.md) | All instrument factories and their props |
| [EFFECTS.md](./EFFECTS.md) | Effects chain API |
| [PATTERNS.md](./PATTERNS.md) | Pattern utilities (euclidean, shift, etc.) |
| [SONG_FORMAT.md](./SONG_FORMAT.md) | Song structure, sections, arrangement |
| [LIVE_CODING.md](./LIVE_CODING.md) | Live coding guide for Score Studio |
| [EXAMPLES.md](./EXAMPLES.md) | Runnable song examples by genre |
| [SCALES.md](./SCALES.md) | Music theory helpers (scale, chord, progression) |
| [MATH.md](./MATH.md) | @score/math chaos primitives (Lorenz, logistic map, OUProcess) |
| [SAMPLE.md](./SAMPLE.md) | Sample instrument usage |
| [ARRANGEMENT.md](./ARRANGEMENT.md) | Section-based arrangement API |

## Architecture Decision Records

All architectural decisions live in [`docs/adr/`](./adr/). Read the relevant ADR before changing any system it covers.

| # | Decision |
|---|----------|
| [001](./adr/001-functional-style-no-classes.md) | Functional style — no classes |
| [002](./adr/002-backend-node-abstraction.md) | Backend / Node abstraction |
| [003](./adr/003-instrument-factory-naming.md) | Instrument factory naming |
| [004](./adr/004-mcp-servers-as-standalone-scripts.md) | MCP servers as standalone scripts |
| [005](./adr/005-song-files-as-esm-never-compiled.md) | Song files as ESM, never compiled |
| [006](./adr/006-unified-performance-model.md) | Unified performance model |
| [007](./adr/007-hot-swap-bar-boundary.md) | Hot-swap at bar boundary |
| [008](./adr/008-eval-sandbox.md) | Eval sandbox |
| [009](./adr/009-ipc-bridge-design.md) | IPC bridge design |
| [010](./adr/010-synthesis-backend-abstraction.md) | Synthesis backend abstraction |
| [011](./adr/011-standalone-code-editor-window.md) | Standalone code editor window |
| [012](./adr/012-audio-editing-as-code.md) | Audio editing as code |
| [013](./adr/013-multiple-pattern-streams.md) | Multiple pattern streams |
| [014](./adr/014-fluent-dsl-chain-api.md) | Fluent DSL chain API |
| [015](./adr/015-gui-three-tier-progressive-disclosure.md) | GUI three-tier progressive disclosure |
| [016](./adr/016-project-file-format-autosave.md) | Project file format / autosave |
| [017](./adr/017-undo-redo-architecture.md) | Undo/redo architecture |
| [018](./adr/018-export-formats-render-pipeline.md) | Export formats / render pipeline |
| [019](./adr/019-distribution-strategy.md) | Distribution strategy |
| [020](./adr/020-song-file-versioning-migration.md) | Song file versioning / migration |
| [021](./adr/021-real-time-collaboration.md) | Real-time collaboration |
| [022](./adr/022-score-registry.md) | Score registry |
| [023](./adr/023-keyboard-shortcuts-system.md) | Keyboard shortcuts system |
| [024](./adr/024-audio-midi-device-config.md) | Audio / MIDI device config |
| [025](./adr/025-onboarding-first-run.md) | Onboarding / first run |
| [026](./adr/026-performance-mode-visuals.md) | Performance Mode & algorave-style visuals |

## Session Files

- Current session: `../claude-resources/sessions/score/current.md`
- Session history: `../claude-resources/sessions/score/`
- Coord signals: `.claude/signals/coord-to-all.md`
