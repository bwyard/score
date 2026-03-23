# Score — Package Dependency Graph

**Last updated:** 2026-03-22

---

## Dependency Graph

```
LAYER 0 — Foundation (no internal deps)
  @score/core        Web Audio abstraction, backend nodes, engine
  @score/pattern     Pattern generation (euclidean, beat, stack, humanize)

LAYER 1 — Core dependents
  @score/math        → core          Chaos, stochastic, tuning, harmony
  @score/modulation  → core          ADSR, LFO, automation
  @score/musical     → core          Pitch, scales, note names
  @score/effects     → core          17 audio effects
  @score/midi        → core          MIDI bridge, XDJ profiles
  @score/mcp         → core          MCP server tools
  @score/sequencer   → core          Transport, clock, tempo map

LAYER 2 — Higher-level components
  @score/dsl         → core, math, pattern       Song DSL, Kick/Synth/Arp/Song factories
  @score/components  → core, modulation, musical  Instrument implementations
  @score/mixer       → core, effects              Channel, Return, master bus

LAYER 3 — Coordination
  @score/session     → core, dsl, midi            JamSession, SessionState
  @score/cli         → components, core, dsl,     CLI commands (play, export, new, list)
                       effects, mixer, sequencer

LAYER 4 — Presentation
  @score/gui         → cli, core, dsl, session    Electron Score Studio app
```

---

## Full Dependency Table

| Package | Depends On | Layer |
|---|---|---|
| @score/core | — | 0 |
| @score/pattern | — | 0 |
| @score/math | core | 1 |
| @score/modulation | core | 1 |
| @score/musical | core | 1 |
| @score/effects | core | 1 |
| @score/midi | core | 1 |
| @score/mcp | core | 1 |
| @score/sequencer | core | 1 |
| @score/dsl | core, math, pattern | 2 |
| @score/components | core, modulation, musical | 2 |
| @score/mixer | core, effects | 2 |
| @score/session | core, dsl, midi | 3 |
| @score/cli | components, core, dsl, effects, mixer, sequencer | 3 |
| @score/gui | cli, core, dsl, session | 4 |

---

## Build Order (topological sort)

**Phase 1 — parallel:**
`@score/core`, `@score/pattern`

**Phase 2 — parallel (after phase 1):**
`@score/math`, `@score/modulation`, `@score/musical`, `@score/effects`, `@score/midi`, `@score/mcp`, `@score/sequencer`

**Phase 3 — parallel (after phase 2):**
`@score/dsl`, `@score/components`, `@score/mixer`

**Phase 4 — parallel (after phase 3):**
`@score/session`, `@score/cli`

**Phase 5 — (after phase 4):**
`@score/gui`

Turborepo handles this automatically via `"dependsOn": ["^build"]`.

---

## Hub Packages (critical — most dependents)

| Package | Dependents | Risk if broken |
|---|---|---|
| @score/core | 10 packages | Total failure — everything depends on it |
| @score/effects | mixer, cli | Effects chain breaks |
| @score/dsl | session, cli, gui | Song syntax breaks — can't play songs |
| @score/components | cli | Instrument imports fail |

---

## Where to Add New Instruments

**Keep in `@score/components`.** Do not create a new `@score/instruments` package.

Reasons:
- CLI already imports from `@score/components` — no new dep needed
- Splitting only justified at 30+ instrument files or specialised deps
- Scale within the package using subdirectories:

```
packages/components/src/
  drums/
    kick808.ts
    kick909.ts
    snare909.ts
    hihat808.ts
    index.ts
  synths/
    subtractive.ts
    fm.ts
    bass303.ts
    index.ts
  legacy/
    kick.ts        ← existing generic stubs
    snare.ts
    hihat.ts
    synth.ts
    sample.ts
  index.ts         ← re-exports all
```

---

## Circular Dependency Risks — None Detected

Graph is a strict DAG. Watch for:
- `@score/cli` importing from `@score/gui` → CIRCULAR (gui → cli)
- `@score/components` importing from `@score/effects` → CIRCULAR (effects is a sibling)
- `@score/session` importing from `@score/cli` → CIRCULAR (cli → session)

---

## Current Instrument Inventory

### @score/components (existing — generic stubs)
- `kick.ts`, `snare.ts`, `hihat.ts` — drum voices (not 808/909 accurate)
- `synth.ts` — general oscillator + filter
- `sax.ts`, `theremin.ts` — experimental
- `sample.ts` — sample playback

### @score/core (backend primitives)
- `oscillator.ts` — sine, square, sawtooth, triangle
- `gain.ts` — amplitude/volume
- `noise.ts` — white/pink noise
- `sample.ts` — buffer source
- `graph.ts` — connection graph
- `context.ts` — AudioContext wrapper

### @score/effects (full — 17 effects)
Delay, Reverb, Compressor, EQ, Sidechain, Distortion, BitCrusher, Chorus, Limiter,
MultibandCompressor, Saturation, AutoPan, Phaser, Flanger, StereoWidener, Gate, Filter
