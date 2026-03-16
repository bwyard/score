# Score Music — Architecture Handoff v3

> **READ THIS FIRST — EVERY SESSION WITHOUT EXCEPTION**
>
> This document is the single source of truth for Score Music.
> At the start of every session Claude Code must:
>
> 1. Read this entire document
> 2. Read AGENTS.md for current agent assignments
> 3. Run `pnpm test` — all tests must pass before new work begins
> 4. Update Section 2 build status to reflect current reality
> 5. Append a one-line entry to Section 14 session log
>
> Never make architectural decisions that conflict with this document
> without explicitly flagging the conflict and waiting for resolution.

---

## 1. Project Identity

### Name
**Score Music** — previously WIP (Work In Progress).
npm scope: `@score-music/*` (pending migration — currently `@score/*`).
GUI application: **Score Studio**.
CLI entry point: `node score` or `score` when installed globally.

### One-Line Description
Score is a production-level, component-based audio framework and full
DAW platform where music is written as functional JavaScript — with
pluggable audio backends including SuperCollider, real-time collaborative
jam sessions, live coding performance mode, Pioneer XDJ hardware
integration, and a complete GUI (Score Studio) built on the same engine
the CLI uses.

### Core Philosophy
- Music is code. Code is music.
- Every note, pattern, effect value, and arrangement decision is
  hand-authored by the artist.
- No AI generates musical content, patterns, voices, or creative
  decisions — ever, under any circumstance, regardless of framing.
- Tests and error handling ship with every component. Never backfilled.
- The GUI and code are bidirectional — editing either updates both.
- SuperCollider is fully embedded — artists never open it or write sclang.
- Mathematical rigor is a first-class feature — discrete math, chaos
  theory, and signal processing are core to the platform.

### Target Genres
House, Deep House, Techno, Industrial, Hardcore, Grime, Remixes

### Target Hardware
Pioneer XDJ all-in-one controllers (XDJ-RX3 2-channel, XDJ-XZ 4-channel)
connected via USB. The XDJ is a control surface in Score's architecture.
Score handles all audio processing and mixing. The XDJ's built-in hardware
mixer can optionally be used alongside Score's software mixer.

---

## 2. Current Build Status

**Update this section at the start of every session.**

```
Phase 1    ✅  Scaffold + CI + ScoreError
Phase 1b   ✅  Codebase Intelligence MCP
Phase 2    ✅  Core engine + Backend abstraction layer
Phase 2b   ✅  Web Audio backend (default)
Phase 3    ✅  Synthesis — synth drums + oscillators + FM
Phase 4    ✅  Sampler + basic time stretch via GrainPlayer
Phase 5    ✅  DSL components — PR #10 merging
Phase 6    ✅  Effects + per-track effects chain — PR #10 merging
Phase 7    ⬜  Mixer — Channel, Return, master bus
Phase 8    ⬜  Sequencer + Transport + TempoMap
Phase 9    ⬜  Song format + Automation system + Pattern reuse
Phase 9b   ⬜  @score/math — mathematical music toolkit
Phase 10   ⬜  CLI — all commands + stem export
Phase 10b  ⬜  Application MCP
Phase 10c  ⬜  Decode — audio analysis + format import (Rekordbox, Serato, FL Studio)
Phase 11   ⬜  Hot reload + live coding (3 levels)
Phase 12   ⬜  MIDI bridge + XDJ profiles + hardware mixer modes
Phase 12b  ⬜  Jam session — @score/session
Phase 12c  ⬜  SuperCollider backend — fully embedded
Phase 12d  ⬜  Physical modeling + granular + full warping
Phase 12e  ⬜  DJ mode — Set format + deck management
Phase 12f  ⬜  LiveSet mode — clip launching
Phase 13   ⬜  Score Studio GUI
Phase 13b  ⬜  GUI jam session interface
Phase 13c  ⬜  Audio clip editor
Phase 13d  ⬜  Automation lanes
Phase 13e  ⬜  Plugin architecture
Phase 14   ⬜  First real tracks + warehouse show
Phase 14b  ⬜  Post-warehouse fixes
Phase 15b  ⬜  Framework MCP
Phase 15   ⬜  Beta audit
Phase 16   ⬜  Release infrastructure
Phase 17   ⬜  v1.0
```

---

## 3. Tech Stack

### Language Split
| Layer | Language | Reason |
|-------|----------|--------|
| Framework packages | TypeScript | Type safety, compile-time catching |
| Song files | Plain JavaScript ESM | No compile delay for live coding |
| Tests | TypeScript | Typed assertions |
| CLI dev | TypeScript via tsx | Direct execution, no build step |
| GUI | TypeScript + React | Component model, typed props |
| SynthDefs | SuperCollider sclang | Required by scsynth — Score managed |

Song files may optionally add `// @ts-check`. Never required or enforced.

### Runtime
- Node.js 20 LTS — minimum and target
- Browser — Chrome/Edge for GUI and WebMIDI (full support)
- Firefox — audio yes, WebMIDI requires plugin
- Safari — audio yes, WebMIDI not supported

### Monorepo
- **Turborepo** — task orchestration, caching, parallel builds
- **pnpm** — package manager, strict dependency resolution

### Audio Platform
- **Tone.js** — Transport, Sequence, scheduling (Layer 1 — never exposed)
- **Web Audio API** — underlying audio graph (always abstracted)
- **node-web-audio-api** — Web Audio polyfill for Node.js
- **SuperCollider / scsynth** — professional audio backend (Phase 12c)
  Fully managed by Score. Artist never opens SuperCollider.

### Testing
- **Vitest** — unit + integration, ES module native, TypeScript native
- **Playwright** — E2E for Score Studio (Phase 13+)

### Coverage Thresholds — Enforced in CI
Development thresholds (current):
```
statements: 80%    branches: 70-75%
functions:  80%    lines:    80%
```
Release targets (tighten before v1.0):
```
statements: 90%    branches: 85%
functions:  90%    lines:    90%
```

### CI/CD
- GitHub Actions on every push and PR
- Pipeline: typecheck → lint → test → coverage
- Failing CI blocks merge — no exceptions

---

## 4. Architecture

### The Three Layers
```
Layer 3 — Song Files      Plain JS authored by the artist. Never compiled.
Layer 2 — The Framework   TypeScript packages. All business logic.
Layer 1 — The Platform    Tone.js + Web Audio API + scsynth. Never modified.
```

### Backend Abstraction Layer
Score's engine is backend-agnostic. The same song file runs on any backend.
Every audio node is created through the backend interface.
Direct Web Audio API calls never appear in component or mixer code.

### Available Backends
| Package | ID | Status | Use case |
|---------|-----|--------|---------|
| Built into @score/core | `web-audio` | ✅ | Development, browser |
| `@score/backend-supercollider` | `scsynth` | ⬜ Ph 12c | Live performance |
| `@score/backend-jack` | `jack` | ⬜ Ph 12c | Linux pro audio |

### Backend Auto-Selection Order
1. Explicit `backend:` in song config — use that
2. SuperCollider installed on system — use scsynth
3. JACK available on Linux — use JACK
4. Fallback — Web Audio (always available)

### SuperCollider Integration — Fully Embedded
Artist never opens SuperCollider. Never writes sclang. Never configures it.
scsynth lifecycle fully managed by Score:
- Boot: automatic when SuperCollider is installed
- SynthDefs: loaded from `backends/supercollider/synthDefs/`
- Heartbeat: monitored every 50ms — automatic failover on loss
- Shutdown: clean /quit OSC message sent on process exit

### AudioGraphManager
Holds the live audio graph. Patches surgically on change.
Never tears down the full graph. Enables all three live coding modes.
Lives in `@score/core`. Used by every backend.

### Error System
`ScoreError` is the only error factory. Never throw raw `Error`.
All three context fields are **required**: `received`, `fix`, `docs`.

```ts
throw ScoreError('Human readable description', {
  received: badValue,
  fix:      'Exact instruction to resolve it',
  docs:     'https://score.dev/docs/relevant-page',
})
```

### AudioComponent Interface
Every component implements this (as a plain object, not a class):

```ts
export type AudioComponent = {
  readonly id:         string
  readonly type:       string
  readonly connect:    (destination: BackendNode) => AudioComponent
  readonly disconnect: () => AudioComponent
  readonly dispose:    () => void
}
```

---

## 5. Package Structure

```
score/
├── packages/
│   ├── core/            @score/core — engine, backends, errors, graph
│   ├── components/      @score/components — Kick, Snare, HiHat, Synth, Sample
│   ├── effects/         @score/effects — Filter, Delay, Reverb, Compressor, EQ, Sidechain
│   ├── dsl/             @score/dsl — Song, Sequence, Pattern, Arrangement
│   ├── sequencer/       @score/sequencer — Transport, Clock, StepSequencer
│   ├── mixer/           @score/mixer — Channel, Return, master bus, limiter
│   ├── cli/             @score/cli — play, live, render, doctor commands
│   ├── midi/            @score/midi — WebMIDI, XDJ profiles
│   ├── mcp/             @score/mcp — codebase, application, framework MCP servers
│   └── gui/             @score/gui — Score Studio (React DAW, Phase 13)
│
├── backends/            (future — Phase 12c)
│   ├── supercollider/   @score/backend-supercollider
│   └── jack/            @score/backend-jack
│
├── songs/               User music — plain JS
├── samples/             User audio — gitignored
├── sounds/              User sound library maps
├── sets/                DJ Set files
├── sessions/            Jam session files + logs
├── docs/festival/       Technical rider, signal chain, failover procedures
│
├── CLAUDE.md
├── AGENTS.md
├── SCORE_HANDOFF.md     ← this file
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## 6. Song File Format

```js
// songs/midnight-techno.js
import { Song, Kick, Snare, HiHat, Synth, Sample, Sequence } from '@score/dsl'
import { Intro, Drop, Breakdown, Outro } from '@score/dsl'

const kick  = Kick({ sample: './samples/kicks/deep.wav', pattern: [1,0,0,0], volume: 0.9 })
const snare = Snare({ sample: './samples/snares/crack.wav', pattern: [0,0,0,0,1,0,0,0], reverb: 0.2 })
const bass  = Synth({ wave: 'sawtooth', filter: { type: 'lowpass', frequency: 800 } })

export default Song({
  bpm:         140,
  key:         'Am',
  genre:       'techno',
  tracks:      [kick, snare, bass],
  arrangement: [Intro(4, [kick]), Drop(16, [kick, snare, bass]), Outro(4, [kick])],
})
```

### Song File Rules — Never Violate
- ESM imports only — never `require()`
- `const` by default — never `var`
- Arrow functions only — no `function`, no `class`, no `this`
- `export default Song()` — always the last line
- No TypeScript syntax in song files
- No AI-generated musical content — every value hand-authored

### Jam Mode
```js
// jam.score.js — no structure needed, just play
import { kick, bass } from './songs/first-track.js'
const weird = Synth({ wave: 'sawtooth', notes: ['C2', 'Eb3', 'G4'] })
export default Jam({ bpm: 128, tracks: [kick, bass, weird] })
```

---

## 7. XDJ Hardware Integration

### Three Mixer Modes
```js
export default Song({
  bpm: 140,
  xdj: { mode: 'hybrid' },  // 'score-mixer' | 'hardware-mixer' | 'hybrid'
})
```

**Mode 1 — Score Mixer Only (default):** XDJ hardware mixer bypassed.
**Mode 2 — XDJ Hardware Mixer Only:** Score handles synthesis, XDJ handles EQ/faders.
**Mode 3 — Hybrid (recommended):** Both run simultaneously.

### DJ Set Format
```js
import { Set, Deck } from '@score/core'
export default Set({
  profile:   'xdj-xz',
  mixerMode: 'hybrid',
  bpm:       140,
  decks: [
    Deck({ id: 1, song: track01, hotCues: { A: 0, B: 8, C: 32 } }),
    Deck({ id: 2, song: track02 }),
  ],
})
```

---

## 8. Mixer Architecture (Phase 7)

### Three Non-Negotiable Rules
1. All nodes via backend interface — never direct Web Audio API calls
2. All parameter changes via `linearRampToValueAtTime` — never `.value =`
3. Minimum ramp time 10ms — no exceptions

### Audio Graph Flow
```
Instrument → EQ (3-band) → Pan → Volume → Mute
    ↓                                        ↘
Master bus                           Send buses (reverb, delay)
    ↓
Master EQ → Sub bus (lowpass 80hz) → Sidechain compressor
    ↓
Hard brick-wall limiter (festival requirement)
    ↓
Main output 1/2 + Backup output 7/8 (always running)
```

---

## 9. Mathematical Framework (@score/math — Phase 9b)

**Discrete Mathematics:** Euclidean rhythms (Bjorklund), polyrhythm via LCM,
boolean pattern algebra (AND/OR/XOR/NOT), modular arithmetic via CRT.

**Chaos Theory:** Lorenz attractor (RK4), logistic map bifurcation,
Lyapunov exponent for measuring chaos level.

**Information Theory:** Shannon entropy of rhythmic patterns (musical range 0.6-0.95).

```js
import { Euclidean, Lorenz, entropy } from '@score/math'
const kick = Kick({ pattern: Euclidean(3, 8) })  // [1,0,0,1,0,0,1,0]
```

---

## 10. Format Import (@score/decode — Phase 10c)

Convert projects from other DAWs into Score song files:
```
Rekordbox XML/DB  →  @score/decode  →  Song file
Serato crates     →  @score/decode  →  Song file
FL Studio .flp    →  @score/decode  →  Song file
Ableton .als      →  @score/decode  →  Song file
MIDI files        →  @score/decode  →  Song file
```

Combined with @score/math for mathematical analysis of imported music.

---

## 11. Festival and Live Performance

### Signal Chain
```
Score (scsynth) → Audio interface → XLR 1/2 FOH + 3/4 Sub + 5/6 Monitor + 7/8 Backup
```

### node score doctor
System check command — verifies Node, scsynth, XDJ, audio interface, latency.

### Warehouse Show — Phase 14 Milestone
Required real-world validation. Minimum: Phases 1-12 complete,
scsynth working, DJ mode working, 4+ hours continuous runtime tested.

---

## 12. Architectural Rules — Never Violate

1.  Song files are never compiled — ES modules, Node 20, direct execution
2.  Web Audio API never exposed to song authors — always abstracted
3.  All audio nodes via backend interface — no exceptions anywhere
4.  `ScoreError` is the only error class — never raw `Error`
5.  ScoreError always includes `received`, `fix`, and `docs` fields
6.  Tests and error handling ship with the component — never backfilled
7.  No AI generates music, patterns, voices, or creative content — ever
8.  No audio files bundled — samples/ gitignored except .gitkeep + README
9.  Score Studio built after engine — Phase 13, never before
10. `AudioComponent` interface: every component has `id`, `type`, `connect`, `disconnect`, `dispose`
11. Audio scheduling always uses `audioContext.currentTime`
12. All parameter changes use `linearRampToValueAtTime` — never `.value =`
13. Minimum ramp time: 10ms — no exceptions in mixer or effects
14. Backend interface is the only way to create audio nodes
15. SuperCollider fully managed by Score — artist never interacts with it
16. scsynth heartbeat monitored every 50ms — automatic failover on loss
17. Mixer requires sub bus output and hard brick-wall limiter
18. XDJ profiles support all three mixer modes

---

## 13. Dependencies

### Never Use — Ever
| Thing | Reason |
|-------|--------|
| Any AI music/voice generation API | Core principle |
| Bundled sample packs | Legal + personal sound |
| Any cloud audio processing | Everything local |
| `var` keyword | Always `const` |
| `function` keyword in song files | Arrow functions only |
| `class` in song files | Functional only |
| Raw `Error` throws | Always `ScoreError` |
| Direct Web Audio API in components | Always backend interface |
| Direct `.value =` on audio params | Always ramp |

---

## 14. Session Log

**Append one line here at the end of every session.**
Format: `YYYY-MM-DD sNNN — What was completed or significantly advanced`

```
2026-03-15 s000 — Phase 1 scaffold, CI, all packages stubbed
2026-03-15 s001 — Phases 2-4 complete, backend abstraction, synthesis, sampler
2026-03-16 s002 — Phases 5-6 complete, DSL components, effects, 249 tests
2026-03-16 s003 — Architecture compliance (ramp rule, id/type, ScoreError fields), tech debt cleanup, handoff v3
```

---

## Start-of-Session Checklist

1. Read `../claude-resources/sessions/score/current.md`
2. Read this file (`SCORE_HANDOFF.md`)
3. Read `AGENTS.md`
4. Run `pnpm test` — all tests must pass
5. Update Section 2 build status
6. Reconcile any gaps between this document and actual codebase
7. Ask for session goal
