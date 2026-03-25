# Score Music — Architecture Handoff v4

---

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

## HOW CLAUDE CODE MAINTAINS THIS DOCUMENT

This is a living document. Claude Code is responsible for keeping it current.

**Update after every session:**
- Section 2 — mark phases complete, in progress, or blocked
- Section 11 — add newly discovered features, decisions, or deferrals
- Section 14 — append one-line session summary

**Add to this document when:**
- A new architectural decision is made
- A new package or component is added
- A phase is added, removed, or reordered
- A new dependency is introduced
- A design rule is established that applies globally

**Sync procedure when picking up mid-project:**
1. Read this document fully
2. Run `pnpm ls -r --depth 0` — compare against Section 5 package list
3. Run `pnpm test` — identify any failing tests
4. Read recent git log — `git log --oneline -20`
5. Check AGENTS.md for what was in progress
6. Reconcile any gaps between this document and actual codebase
7. Update this document to match reality before writing new code

---

## 1. Project Identity

### Name
**Score Music** — previously WIP (Work In Progress).
npm scope: `@score-music/*` — rename from current `@score/*` pending (separate PR).
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
Phase 1b   ✅  Codebase Intelligence MCP (stub — t014)
Phase 2    ✅  Core engine + Backend abstraction layer
Phase 2b   ✅  Web Audio backend (default)
Phase 3    ✅  Synthesis — synth drums + oscillators (FM deferred to Phase 12d)
Phase 4    ✅  Sampler + basic time stretch via GrainPlayer
Phase 5    ✅  DSL components (Kick, Snare, HiHat, Synth, Sample) — merged PR #10
Phase 6    ✅  Effects — all 14 effects complete
               ✅ Filter, Delay, Reverb, Compressor, EQ, Sidechain
               ✅ Distortion, BitCrusher, Chorus, Limiter (hard brick-wall)
               ✅ Phaser, Flanger, Stereo Widener, Noise Gate
Phase 6b   ✅  Effects chain utility (createEffectsChain) + BackendWaveShaperNode + BackendStereoPannerNode
Phase 7    ✅  Mixer — Channel, Return, master bus, hard limiter, solo logic
Phase 7b   ✅  Mastering chain — Multiband Compressor, Saturation/Tape, Auto-Pan
               ✅ createMultibandCompressor — 3-band crossover with per-band threshold/ratio/makeup
               ✅ createSaturation — tanh soft-clip via WaveShaperNode, drive 0-1
               ✅ createAutoPan — sine/triangle LFO pan automation via StereoPannerNode
               ✅ TSDoc added to all 16 existing effects
Phase 8    ✅  Sequencer + Transport + TempoMap + Swing/Groove
Phase 9    ✅  Song format + Automation system + Pattern reuse + Arpeggiator
               ✅ Song/Track/Section DSL complete (Song, Kick, Snare, HiHat, Synth, Sequence)
               ✅ Note names: 'A2', 'F#3', 'Bb4' — noteHz() + resolveFreq() in @score/dsl
               ✅ ADSR envelope + filter props on SynthDSLProps + scheduleEnvelope() on BackendGainNode
               ✅ ScoreEngine: hydrates descriptors, schedules audio, master gain node
               ✅ Arpeggiator (Arp() DSL component + engine case)
               ✅ Arrangement execution (muteEnvelope — pure fn of time, onBar callback)
               ✅ drift(center, sigma, theta) — OU-process pitch wander, @score/dsl
               ✅ keepFor(bars, pattern) — freeze pattern for N bars, @score/dsl
Phase 9a   ✅  Core modulation primitives — @score/modulation (54 tests)
               ✅ createADSR — standalone envelope, delegates to BackendGainNode.scheduleEnvelope
               ✅ createLFO — connects oscillator to BackendAudioParam (frequencyParam/gainParam)
               ✅ ramp, sine, cosine — pure step-function value sources
               ✅ BackendAudioParam type + frequencyParam/gainParam on BackendFilterNode/GainNode
               ✅ BackendOscillatorNode._connectTo — routes osc → AudioParam
               ✅ automation(lfo, param) — wire LFO to BackendAudioParam, returns AutomationHandle
Phase 9b   ✅  @score/math — complete (158 tests)
               ✅ fibonacci, padovan, tribonacci, entropy, polyrhythm, boolean ops
               ✅ transforms: range, normalize, clip, smooth, quantize, interp
               ✅ stochastic: drunk, markov (seeded LCG PRNG)
               ✅ harmony: circleOfFifths, just, pythagorean, meantone, edo19, edo31
Phase 9c   ✅  @score/pattern — complete (50 tests)
               ✅ euclidean, fast, slow, rev, every, degrade, shift, scaleNotes, chordNotes
               ✅ 80+ scale library in scales.ts (major, minor, modes, pentatonic, blues)
               ✅ stack(...patterns) — poly-rhythm combinator, returns first non-zero per step
               ✅ beat(...steps) — shorthand array literal helper
               ✅ humanize(amount, pattern) — deterministic velocity jitter, reproducible per step+bar
Phase 9d   ✅  @score/musical — describe() natural language → InstrumentDescriptor (37 tests)
               ✅ Vocabulary-based tokenizer (not AI): SOUND/PATTERN/SPACE/VOLUME tables
               ✅ buildDescriptor, extractTokens, normalizeText helpers
Phase 9e   ✅  Song file security — AST validator (acorn) + Zod export validator + --trust flag (12 tests)
Phase 9f   ✅  Extended math — chaos/stochastic/tuning in @score/math (see Phase 9b above)
               ✅ Lorenz attractor (RK4 ODE)
               ✅ Logistic map + logisticSequence()
               ✅ Lyapunov exponent estimator
               ✅ L-system string rewriting + lsystemToPattern()
               ✅ Wolfram elementary CA (rule 0–255)
               ✅ RK4 generic ODE integrator
               ✅ OUProcess (Ornstein-Uhlenbeck mean-reverting process)
Phase 10   ✅  CLI — all core commands complete
               ✅ score play <file> — plays song via ScoreEngine
               ✅ score play --watch — live reload on file save (300ms debounce)
               ✅ score play --trust — skip AST validation
               ✅ score doctor — system health checks (Node, pnpm, audio backend)
               ✅ score new song <name> — template generator with note name syntax
               ✅ --version / -v flag
               ✅ score export — WAV render via OfflineAudioContext, --out/--bars/--sr flags
               ✅ score list — song metadata + track inspection
               ✅ --help / -h — standardised across all commands (parseFlags utility)
Phase 10b  ⬜  score-audio MCP — effect catalog, signal flow, backend nodes, component catalog
Phase 10b2 ⬜  score-game-tools MCP — song inspector, mixer state, transport state, audio graph
Phase 10b3 ⬜  score-codebase MCP — full build (currently stub)
               Backend / framework tools (all phases):
               ⬜ project_status    — phase completion, what's done vs placeholder
               ⬜ package_graph     — workspace deps, build order
               ⬜ api_surface       — every public export + TSDoc signature
               ⬜ architecture_rules — non-negotiable rules (no let, no class, etc.)
               ⬜ adr_lookup        — architectural decisions and their rationale
               GUI development tools (Phase 13+):
               ⬜ ui_component_catalog — every React component: file path, props
                                        interface, which mode it belongs to, what
                                        it renders, placeholder vs implemented
               ⬜ ui_layout_map     — spatial hierarchy: regions, aria roles,
                                        aria-labels, nesting depth — primary source
                                        of truth for Playwright E2E selectors
               ⬜ ui_design_tokens  — all inline style values extracted and named:
                                        colors, spacing, border-radius, font sizes —
                                        enforces visual consistency across phases
               ⬜ ui_ipc_map        — all typed IPC channels: name, payload type,
                                        direction (renderer→main / main→renderer),
                                        which component triggers or listens
               ⬜ ui_mode_features  — per-mode feature inventory (LiveCode, Produce,
                                        DJ Set, Jam Session): planned vs implemented
                                        vs placeholder — for phase planning
               ⬜ ui_accessibility_map — every interactive element's accessible name,
                                        role, aria attributes — written once, used
                                        for every Playwright E2E test so selectors
                                        are never guessed
               DSL / Monaco tools (Phase 13f):
               ⬜ dsl_completions   — Score DSL component APIs for Monaco
                                        IntelliSense: Kick/Snare/Synth/Sample props,
                                        defaults, types, valid ranges
               ⬜ dsl_diagnostics_schema — errors the DSL AST validator can produce,
                                        for Monaco error markers
               Automation / plugin tools (Phase 13d + 13e):
               ⬜ automation_param_map — all automatable BackendAudioParam targets,
                                        their range, units, and visual label
               ⬜ plugin_manifest_schema — plugin contract: what a plugin must
                                        export, how it registers capabilities,
                                        IPC surface it may access
Phase 10c  ⬜  Decode — audio analysis + format import (Rekordbox, Serato, FL Studio, MIDI)
Phase 11   ✅  Hot reload + live coding (3 levels)
               ✅ Level 1: --watch file watcher with ESM cache busting
               ✅ Level 2: patch() — surgical live BPM/volume/mute updates without full reload
               ✅ Level 3: update(song) — diffs incoming song; live-patches BPM + track volumes, full swap for structural changes
               ✅ bars — engine.bars exposes current bar count; REPL shows it in status
               ✅ muteEnvelope(bar, arrangement, trackId) — pure function replaces imperative section state
               ⬜ cursor.x / cursor.y — mouse position as automation source (Phase 13 GUI)
Phase 11b  ⬜  Live coding visualization — punchcard, piano roll, scope, pattern graph, waveform
Phase 12   ✅  MIDI bridge + XDJ profiles + hardware mixer modes
               ✅ createMidiBridge() — routes hardware MIDI to BridgeEngine
               ✅ XDJ-RX3 and XDJ-XZ profiles (needs-testing — spec-derived, not hardware-verified)
               ✅ Traktor S and Serato stubs (look-into — model unknown)
               ✅ Internal WebMIDI types (no @types/webmidi dep)
Phase 12b  ✅  Jam session — @score/session
               ✅ createJamSession(engine, config) — coordinates ScoreEngine + MidiBridge
               ✅ SessionState snapshot (playing, bpm, bars, masterVolume, trackMutes, midiConnected)
               ✅ connectMidi() / disconnectMidi() — safe with or without bridge
               ✅ patch() / update() — live parameter changes + hot-swap song definition
               ✅ 22 tests
Phase 12c  ⬜  SuperCollider backend — fully embedded
Phase 12d  ⬜  Advanced synthesis — FM, wavetable, physical modeling, granular, full warping
Phase 12i  ⬜  Probabilistic / diffusion generation — granular grain scattering, spectral diffusion, stochastic resonance, generative composition via PRIME samplers (builds on Lorenz/logistic/OUProcess already in @score/math)
Phase 12e  ⬜  DJ mode — Set format + deck management
               ⬜ Auto-BPM detection from audio files
               ⬜ Musical key detection (harmonic mixing)
               ⬜ Hot cues + loop points management
               ⬜ Track library / crate management
               ⬜ Two-deck sync engine (deck A ↔ B master/slave BPM sync)
               ⬜ Set/performance recording (capture live output to WAV)
Phase 12f  ⬜  LiveSet mode — clip launching
Phase 12g  ⬜  Advanced effects — Convolution reverb, Envelope follower, Ring modulator
Phase 12h  ⬜  Advanced sampler — Sample slicing, multi-sample instruments (velocity layers, round-robin)
               ⬜ Stem separation (Spleeter/Demucs WASM — modern DJ workflow)
Phase 13   🔄  Score Studio GUI — Electron + React desktop app
               ✅ Electron main process + preload IPC bridge (typed channels)
               ✅ Vite + electron-forge scaffold
               ✅ Splash screen — mode + hardware level selector
               ✅ 4 mode shells: Live Code, Produce, DJ Set, Jam Session
               ✅ TransportBar — shared play/stop/BPM/bars across all modes
               ✅ Testing stack: Vitest + jsdom + @testing-library + vitest-axe
               ✅ Testing Trophy pattern: integration tests + axe accessibility checks
               ⬜ E2E tests (Playwright with Electron support — Phase 13+)
Phase 13b  ⬜  GUI jam session interface
Phase 13c  ⬜  Audio clip editor
Phase 13d  ⬜  Automation lanes
Phase 13e  ⬜  Plugin architecture (VST/AU via Phase 13e)
Phase 13f  ⬜  Monaco IDE integration — live eval, pattern gutter, REPL panel
Phase 14   ⬜  First real tracks + live performance debut
Phase 14b  ⬜  Post-show fixes
Phase 15b  ⬜  Framework MCP (public — for Score users building songs with AI assistance)
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
- **`@score/sequencer`** — Transport, Clock, scheduling (Score-owned, never exposed to song authors)
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
Layer 1 — The Platform    Web Audio API + node-web-audio-api + scsynth (Phase 12c). Never modified.
```

### Backend Abstraction Layer
Score's engine is backend-agnostic. The same song file runs on any backend.
Every audio node is created through the backend interface.
Direct Web Audio API calls never appear in component or mixer code.

The backend is two types — `BackendProvider` and `BackendContext`:

```ts
// @score/core/src/backend/types.ts — actual implementation

export type BackendProvider = {
  readonly name: string
  readonly createContext: (options?: {
    sampleRate?: number
    latencyHint?: 'interactive' | 'balanced' | 'playback'
    offline?: { length: number; numberOfChannels?: number }
  }) => BackendContext
}

export type BackendContext = {
  readonly currentTime: number
  readonly sampleRate: number
  readonly state: 'running' | 'suspended' | 'closed'
  readonly destination: BackendNode
  readonly createOscillator: (props?) => BackendOscillatorNode
  readonly createGain: (props?) => BackendGainNode
  readonly createNoise: (props?) => BackendNoiseNode
  readonly decodeAudio: (data: ArrayBuffer) => Promise<BackendBuffer>
  readonly createBufferSource: (buffer, props?) => BackendBufferSourceNode
  readonly createFilter: (props?) => BackendFilterNode
  readonly createDelay: (props?) => BackendDelayNode
  readonly createCompressor: (props?) => BackendCompressorNode
  readonly suspend: () => Promise<void>
  readonly resume: () => Promise<void>
  readonly close: () => Promise<void>
}
```

New backends implement `BackendProvider`. The web-audio backend is
the default: `webAudioBackend` exported from `@score/core`.

### Available Backends
| Package | ID | Status | Use case |
|---------|-----|--------|---------|
| Built into @score/core | `web-audio` | ✅ | Development, browser |
| `@score-music/backend-supercollider` | `scsynth` | ⬜ Ph 12c | Live performance |
| `@score-music/backend-jack` | `jack` | ⬜ Ph 12c | Linux pro audio |

### Backend Auto-Selection Order
1. Explicit `backend:` in song config — use that
2. SuperCollider installed on system — use scsynth
3. JACK available on Linux — use JACK
4. Fallback — Web Audio (always available)

### SuperCollider Integration — Fully Embedded
Artist never opens SuperCollider. Never writes sclang. Never configures it.

```
Artist runs: node score play songs/track.js
                    ↓
Score detects scsynth binary on the system
                    ↓
SCSynthManager.boot() spawns scsynth as a child process
                    ↓
SynthDefLoader loads Score's .scd library into scsynth
                    ↓
Score sends OSC messages to scsynth for every audio event
                    ↓
scsynth executes with real-time OS priority
                    ↓
Audio interface → PA
```

scsynth lifecycle fully managed by Score:
- Boot: automatic when SuperCollider is installed
- SynthDefs: loaded from `backends/supercollider/synthDefs/`
- Heartbeat: monitored every 50ms — automatic failover on loss
- Shutdown: clean /quit OSC message sent on process exit

Artist terminal output:
```bash
# SuperCollider installed:
Score: SuperCollider 3.13.0 detected
Score: scsynth booted (port 57110)
Score: 47 SynthDefs loaded
Score: Playing — 140 BPM — Am — techno

# SuperCollider not installed:
Score: SuperCollider not found — using Web Audio backend
Score: Install SuperCollider for professional audio quality
Score: https://score.dev/install/supercollider
Score: Playing — 140 BPM — Am — techno
```

### Automatic Failover
If scsynth fails mid-performance:
- Heartbeat loss detected within 100ms
- Automatic switch to Web Audio backend
- Audio gap: <50ms — inaudible at festival volume
- Artist sees visual indicator — set continues uninterrupted

### AudioGraphManager
Holds the live audio graph. Current implementation (`createAudioGraph`):
- `addNode(id, node)` / `removeNode(id)`
- `connect(sourceId, destId)` / `disconnect(sourceId, destId?)`
- `getNode(id)` / `dispose()`

Future: `patch()` method for surgical live-coding updates (Phase 11).
Lives in `@score/core`. Used by every backend.

### Error System
`ScoreError` is the only error factory. Never throw raw `Error`.
It is a **factory function**, not a class — no `new` keyword.
All three context fields are **required**: `received`, `fix`, `docs`.
Optional `code` field for programmatic error handling.

```ts
throw ScoreError('Human readable description', {
  received: badValue,
  fix:      'Exact instruction to resolve it',
  docs:     'https://score.dev/docs/relevant-page',
  code:     'OPTIONAL_ERROR_CODE',  // optional — for programmatic handling
})
```

### AudioComponent Interface
Every component in @score/components, @score/effects, @score/mixer
must conform to this shape (plain object type, not a class):

```ts
export type AudioComponent = {
  readonly id:         string
  readonly type:       string
  readonly connect:    (destination: BackendNode) => AudioComponent
  readonly disconnect: () => AudioComponent
  readonly dispose:    () => void
}
```

Future: `update(props)` method for live parameter changes (Phase 11).

---

## 5. Package Structure

### Existing packages (built)
```
score/
├── packages/
│   ├── core/            @score/core — engine, backends, errors, graph, oscillator, gain, noise, sample
│   │   └── src/
│   │       ├── backend/
│   │       │   ├── types.ts          ← BackendProvider, BackendContext, all BackendNode types
│   │       │   ├── web-audio.ts      ← webAudioBackend implementation
│   │       │   └── index.ts
│   │       ├── errors/
│   │       │   └── ScoreError.ts     ← factory function (not a class)
│   │       ├── context.ts            ← createAudioContext()
│   │       ├── graph.ts              ← createAudioGraph()
│   │       ├── oscillator.ts         ← createOscillator()
│   │       ├── gain.ts               ← createGain()
│   │       ├── noise.ts              ← createNoise()
│   │       ├── sample.ts             ← decodeSample(), createSamplePlayer()
│   │       ├── types.ts              ← AudioComponent, AudioGraph, GraphNode
│   │       ├── uid.ts                ← uid() generator
│   │       └── index.ts
│   │
│   ├── components/      @score/components — Kick, Snare, HiHat, Synth, Sample
│   │   └── src/
│   │       ├── kick.ts               ← Kick({ gain })
│   │       ├── snare.ts              ← Snare({ gain })
│   │       ├── hihat.ts              ← HiHat({ gain, open })
│   │       ├── synth.ts              ← Synth({ wave, frequency, detune, gain })
│   │       ├── sample.ts             ← Sample({ loop, playbackRate, gain })
│   │       └── index.ts
│   │
│   ├── effects/         @score/effects — 6 built, 4 planned
│   │   └── src/
│   │       ├── filter.ts             ← ✅ createFilter() — BiquadFilterNode
│   │       ├── delay.ts              ← ✅ createDelay() — DelayNode + feedback loop
│   │       ├── reverb.ts             ← ✅ createReverb() — 6-tap delay simulation
│   │       ├── compressor.ts         ← ✅ createCompressor() — DynamicsCompressorNode
│   │       ├── eq.ts                 ← ✅ createEQ() — 3-band (lowshelf/peaking/highshelf)
│   │       ├── sidechain.ts          ← ✅ createSidechain() — source is BackendNode (mixer resolves)
│   │       ├── distortion.ts         ← ✅ COMPLETE — WaveShaperNode transfer curve
│   │       ├── bitcrusher.ts         ← ✅ COMPLETE — sample rate + bit depth reduction
│   │       ├── chorus.ts             ← ✅ COMPLETE — modulated delay voices
│   │       ├── limiter.ts            ← ✅ COMPLETE — brick-wall hard limiter (WaveShaperNode)
│   │       ├── phaser.ts             ← ✅ COMPLETE — allpass filter chain with LFO
│   │       ├── flanger.ts            ← ✅ COMPLETE — short modulated delay + feedback
│   │       ├── stereo-widener.ts     ← ✅ COMPLETE — mid/side processing
│   │       ├── gate.ts               ← ✅ COMPLETE — noise gate (threshold-based)
│   │       └── index.ts
│   │
│   ├── dsl/             @score/dsl — ✅ COMPLETE (Song, Kick, Snare, HiHat, Synth, Sequence, sections, note names)
│   ├── sequencer/       @score/sequencer — ✅ COMPLETE (createClock, createTransport, createStepSequencer, createTempoMap)
│   ├── mixer/           @score/mixer — ✅ COMPLETE (createChannel, createReturn, createGroup, createMixer)
│   ├── pattern/         @score/pattern — ✅ COMPLETE (euclidean, fast/slow/rev/every/degrade/shift, scaleNotes, chordNotes)
│   ├── math/            @score/math — ✅ COMPLETE (fibonacci, entropy, polyrhythm, boolean ops)
│   ├── cli/             @score/cli — ✅ COMPLETE (play, --watch, --trust, doctor, new song, --version, AST+Zod validators)
│   ├── mcp/             @score/mcp — STUB (Phase 1b/10b/15b)
│   ├── midi/            @score/midi — STUB (Phase 12)
│   ├── gui/             @score/gui — STUB (Phase 13)
│   ├── session/         @score/session — NOT CREATED (Phase 12b)
│   ├── decode/          @score/decode — NOT CREATED (Phase 10c)
│   └── musical/         @score/musical — NOT CREATED (Phase 9d)
```

### Planned packages (not yet created)
```
│   ├── components/      (additions planned)
│   │   └── src/
│   │       ├── LiveInput.ts          ← Phase 12b — real-time mic as instrument
│   │       └── instruments/
│   │           ├── PhysicalString.ts  ← Phase 12d — scsynth only
│   │           ├── Granular.ts        ← Phase 12d — scsynth only
│   │           └── FM.ts             ← Phase 12d — full FM synthesis
│   │
│   ├── dsl/             @score/dsl (Phase 8-9)
│   │   └── src/
│   │       ├── Song.ts
│   │       ├── Track.ts
│   │       ├── Arrangement.ts
│   │       ├── Sequence.ts           ← supports scale degree + absolute notation
│   │       ├── Pattern.ts            ← reusable, named patterns
│   │       ├── Automation.ts         ← ramp(), lfo(), AutomationClip()
│   │       ├── Chord.ts             ← Chords('Am F C G')
│   │       ├── Scale.ts
│   │       ├── Every.ts
│   │       ├── After.ts
│   │       ├── Probably.ts
│   │       └── Euclidean.ts          ← delegates to @score/math
│   │
│   ├── math/            @score/math (Phase 9b)
│   │   └── src/
│   │       ├── discrete/             ← euclidean, polyrhythm, set ops, boolean patterns
│   │       ├── chaos/                ← lorenz, logistic, rossler, lyapunov
│   │       ├── recurrence/           ← fibonacci, l-system, cellular automata
│   │       ├── harmony/              ← just intonation, voice leading, spectral
│   │       ├── calculus/             ← ADSR as ODE, biquad as ODE, RK4
│   │       ├── statistics/           ← humanize, markov, correlation
│   │       └── information/          ← Shannon entropy, complexity
│   │
│   ├── sequencer/       @score/sequencer (Phase 8)
│   │   └── src/
│   │       ├── Transport.ts
│   │       ├── Clock.ts
│   │       ├── StepSequencer.ts
│   │       ├── ArrangementPlayer.ts
│   │       └── TempoMap.ts
│   │
│   ├── mixer/           @score/mixer (Phase 7)
│   │   └── src/
│   │       ├── Mixer.ts
│   │       ├── Channel.ts
│   │       └── Return.ts
│   │
├── backends/            (Phase 12c)
│   ├── supercollider/   @score-music/backend-supercollider
│   │   ├── src/
│   │   │   ├── SCSynthBackend.ts     ← implements BackendProvider
│   │   │   ├── SCSynthManager.ts     ← boots/monitors/shuts down scsynth
│   │   │   ├── SynthDefLoader.ts     ← loads .scd files into scsynth
│   │   │   └── OSCBridge.ts          ← OSC communication layer
│   │   └── synthDefs/
│   │       ├── score-core.scd
│   │       ├── score-effects.scd
│   │       ├── score-physical.scd
│   │       ├── score-granular.scd
│   │       └── score-fm.scd
│   └── jack/            @score-music/backend-jack
│       └── src/
│           └── JACKBackend.ts
│
├── songs/               User music — plain JS
├── samples/             User audio — gitignored
├── sounds/              User sound library maps
├── sets/                DJ Set files
├── sessions/            Jam session files + logs
├── docs/festival/       Technical rider, signal chain, failover procedures
│
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
import {
  Song, Kick, Snare, HiHat, Synth, Sample, Sequence,
  Intro, Buildup, Drop, Breakdown, Outro,
} from '@score-music/dsl'
import { kicks, snares, hats, recordings } from '../sounds/my-library.js'

// ── DRUMS ────────────────────────────────────────────────
const kick = Kick({
  sample:    kicks.deep,
  pattern:   [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
  sidechain: true,
  volume:    0.9,
})

const snare = Snare({
  sample:  snares.crack,
  pattern: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
  reverb:  0.2,
})

// ── SYNTHESIS ────────────────────────────────────────────
const bass = Synth({
  wave:     'sawtooth',
  filter:   { type: 'lowpass', frequency: 800, resonance: 8 },
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.1 },
  sequence: Sequence('A1 A1 . C2 . G1 . .'),
})

// ── RECORDINGS ───────────────────────────────────────────
const saxophone = Sample({
  file:   recordings.sax,
  chain: [
    EQ({ high: 2, low: -3 }),
    Compressor({ threshold: -12, ratio: 3 }),
    Reverb({ size: 0.4 }),
    Delay({ time: '8n', feedback: 0.2, mix: 0.3 }),
  ]
})

// ── ARRANGEMENT ──────────────────────────────────────────
const arrangement = [
  Intro(4,      [hihat]),
  Buildup(4,    [hihat, kick]),
  Drop(16,      [kick, snare, hihat, bass]),
  Breakdown(8,  [saxophone]),
  Drop(16,      [kick, snare, hihat, bass, saxophone]),
  Outro(4,      [hihat, kick]),
]

export default Song({
  bpm:         140,
  key:         'Am',
  genre:       'techno',
  // backend: 'scsynth'  ← uncomment for live performance
  tracks:      [kick, snare, hihat, bass, saxophone],
  arrangement,
})
```

### Song File Rules — Never Violate
- ESM imports only — never `require()`
- `const` by default — never `var`
- Arrow functions only — no `function`, no `class`, no `this`
- `export default Song()` — always the last line
- No TypeScript syntax in song files
- No AI-generated musical content — every value hand-authored
- Section comments: `// ── SECTION NAME ─────` format

### Song Files Are Never Compiled
Run directly as ES modules via Node 20. Non-negotiable.
A compile step breaks live coding hot reload.

---

## 7. XDJ Hardware Integration

### One Laptop Setup
Score requires only one laptop. The XDJ connects via USB as a
control surface. Score handles all audio processing and mixing.

```
What is needed:
  Laptop running Score + scsynth
  XDJ (RX3 or XZ) → USB → Laptop (MIDI control only)
  Audio interface → XLR balanced → PA system

What is NOT needed:
  Rekordbox or any Pioneer software
  USB drives with tracks
  Second laptop
  XDJ audio outputs (not used in Score-only mode)
```

### Three Mixer Modes

**Mode 1 — Score Mixer Only (default):**
XDJ hardware mixer bypassed entirely.
All EQ, volume, crossfader handled in Score software.
Maximum programmability, automation, and code control.

**Mode 2 — XDJ Hardware Mixer Only:**
Score handles synthesis, sequencing, effects.
XDJ hardware EQ knobs, filter, crossfader, volume faders used physically.
Best tactile feel for live DJ performance.

**Mode 3 — Hybrid (recommended for festival):**
Both run simultaneously.
Hardware moves update Score mixer state in real time.
Score automation can layer on top of hardware control.
Hardware feel with full software programmability.

```js
// In song or set file
export default Song({
  bpm:  140,
  xdj:  { mode: 'hybrid' },   // 'score-mixer' | 'hardware-mixer' | 'hybrid'
  ...
})
```

### XDJ Control Mapping (all modes)
| Hardware | Score Action |
|----------|-------------|
| Volume faders | `mixer.channel[n].setVolume()` |
| EQ High | `mixer.channel[n].setEQ('high', db)` |
| EQ Mid | `mixer.channel[n].setEQ('mid', db)` |
| EQ Low | `mixer.channel[n].setEQ('low', db)` |
| Filter knob | `effects.filter.setFrequency()` |
| Crossfader | `mixer.setCrossfader(position)` |
| Play/Pause | `transport.toggle()` |
| Hot Cues A-H | `transport.jumpToBar(hotCueMap[id])` |
| Sync | `transport.syncToMaster()` |
| Jog wheel | `transport.scratch(delta)` |
| Loop buttons | `sequencer.setLoop(bars)` |
| Beat FX on/off | `effects.beatFX.toggle()` |

### DJ Set Format
```js
// sets/friday-night.js
import { Set, Deck } from '@score-music/core'

export default Set({
  profile:   'xdj-xz',
  mixerMode: 'hybrid',
  bpm:       140,
  decks: [
    Deck({ id: 1, song: track01,
      hotCues: { A: 0, B: 8, C: 32, D: 48 } }),
    Deck({ id: 2, song: track02,
      hotCues: { A: 0, B: 16, C: 40 } }),
    Deck({ id: 3, song: track03 }),
    Deck({ id: 4, song: track04 }),
  ],
  crossfader: { left: [1, 3], right: [2, 4] },
})
```

---

## 8. Mixer Architecture (Phase 7)

### Three Non-Negotiable Rules
1. All nodes via backend interface — never direct Web Audio API calls
2. All parameter changes via `linearRampToValueAtTime` — never `.value =`
3. Minimum ramp time 10ms — no exceptions

```ts
// WRONG — audio click on any PA system
gainNode.gain.value = 0

// CORRECT — 10ms ramp, completely inaudible
gainNode.gain.linearRampToValueAtTime(
  0,
  audioContext.currentTime + 0.01
)
```

### Audio Graph Flow
```
Instrument
    ↓
Effects chain (ordered — per track)
    ↓
EQ (3-band BiquadFilter via backend)
    ↓
Pan (StereoPannerNode via backend)
    ↓
Volume (GainNode via backend)
    ↓
Mute (GainNode 0 or 1)
    ↓              ↘
Master bus         Send buses (reverb aux, delay aux)
    ↓
Master EQ
    ↓
Sub bus — lowpass 80hz → outputs 3/4 (festival requirement)
    ↓
Sidechain compressor (if configured)
    ↓
Hard brick-wall limiter (festival requirement)
    ↓
Main output → outputs 1/2
Backup output → outputs 7/8 (always running)
```

### Festival Requirements in Phase 7
These are not optional — they affect real show use:

```ts
// Sub bus — dedicated low frequency output for festival sub systems
Mixer({
  buses: {
    main:    { outputs: [1, 2] },
    sub:     { outputs: [3, 4],
               filter: { type: 'lowpass', frequency: 80 } },
    monitor: { outputs: [5, 6] },
    backup:  { outputs: [7, 8] },
  }
})

// Hard limiter — mathematically guaranteed ceiling
Limiter({
  ceiling:   -3,       // dBFS — never exceeded
  mode:      'hard',   // brick wall — WaveShaperNode transfer curve
  lookahead: 5,        // 5ms lookahead
  release:   50,
})
```

### Required Tests for Phase 7
```
Channel: volume, pan, mute, solo, EQ per band,
         reverb send, delay send, ramp on all changes,
         dispose cleans backend nodes, ScoreError on out-of-range

Mixer: create/remove channels, master volume, master EQ,
       solo mutes others, unsolo restores state,
       sidechain routing, sub bus filters 80hz,
       hard limiter ceiling never exceeded,
       backup output always running, dispose cleans all
```

---

## 9b. Mathematical Framework (@score/math — Phase 9b)

Score's mathematical depth is a primary differentiator.
Areas: discrete mathematics (Euclidean, polyrhythm, boolean algebra),
chaos theory (Lorenz, logistic map, Lyapunov), recurrence relations
(Fibonacci, Padovan, L-systems, Wolfram automata), calculus applied
(ADSR as ODE, OUProcess, RK4 integrator), information theory (Shannon entropy).

**Full design spec:** `docs/spec/MATH_SPEC.md`

```js
import { euclidean, entropy, fibonacci } from '@score/math'
const kick = Kick({ pattern: euclidean(3, 8) })   // [1,0,0,1,0,0,1,0]
```

## 9c. Functional Pattern System (@score/pattern — Phase 9c)

TidalCycles power with musician-readable syntax. Arrays always work.
Pattern transforms: `fast`, `slow`, `rev`, `shift`, `degrade`, `every`.
To add: `stack()`, `beat()`, `humanize()`, `mini()` bridge.
`PatternInput<T>` = `T[] | (step, bar) => T` — both formats permanent.

**Full design spec:** `docs/spec/PATTERN_SPEC.md`

```ts
const kick = Kick({ pattern: every(4, fast(2), [1,0,0,0]) })
const bass = Synth({ sequence: scaleNotes('Dorian', 'D3', 8) })
```

---

## 9d. Plain Language Layer (@score/musical — Phase 9d)

`describe()` translates plain English into component props via vocabulary lookup.
No AI. No generation. Only translates decisions the artist has already made.
Both syntaxes produce identical audio — choice is entirely the artist's.

**Full design spec:** `docs/spec/MUSICAL_SPEC.md`

```js
const kick = describe('deep kick hits every beat pumps hard loud')
// identical to: Kick({ pattern: [1,0,...], sidechain: true, volume: 0.9 })
```

---

## 9e. Song File Security (Phase 9e)

**Implementation complete ✅** — 12 tests passing.

Two-layer enforcement:

**Layer 1 — AST validation** (`SongValidator.ts` via acorn):
Blocks before execution: `fs`, `child_process`, `net`, `http`, `https`, `os`, `crypto`,
`worker_threads`, `process.*` access, `eval()`, `new Function()`, dynamic `import()`.
Clear ScoreError with line number and fix.

**Layer 2 — Zod export validation** (`SongExportValidator.ts`):
After execution, validates exported Song object shape before engine receives it.

`--trust` flag skips Layer 1 only. Developer use only. Always shows warning.

**Full allowed/blocked lists:** `docs/SONG_FORMAT.md`

---

## 9f. Extended Math (Phase 9f) ⬜

Chaos theory, process models, tuning systems.
**Full spec:** `docs/spec/MATH_SPEC.md`

```js
import { lorenz, logistic, lsystem, ouprocess } from '@score/math'
const chaos = lorenz({ sigma: 10, rho: 28, beta: 8/3 })
const lead = Synth({ sequence: chaos.toSequence({ scale: 'Am', length: 16 }) })
```

---

## Former section 9d/9e package structure

```ts
// @score/cli/src/runtime/ (Phase 9e — built)
├── SongValidator.ts         ← AST analysis before execution
├── SongExportValidator.ts   ← Zod schema validation of export
├── ScoreModuleResolver.ts   ← import allowlist (runtime)
└── ScoreGlobals.ts          ← restricted global environment

// @score/musical/src/ (Phase 9d — to build)
├── vocabulary/              ← lookup tables per domain
├── parser.ts                ← tokenizer + component builder
├── describe.ts              ← describe() exported function
└── index.ts
```

---

---

## 10. Live Performance

### Full Signal Chain
```
Score (scsynth backend)
    ↓
RME Fireface UFX III (recommended) or Focusrite Scarlett
    ↓
XLR outputs 1/2 → FOH main L/R
XLR outputs 3/4 → Sub channel
XLR outputs 5/6 → Artist monitor
XLR outputs 7/8 → Backup (always running)
    ↓
Festival stage box → FOH console → Amps → PA
```

### node score doctor
```bash
$ node score doctor

Score Doctor — system check
──────────────────────────────────────────────
Node.js 20.11.0                    ✅
Score CLI 1.0.0                    ✅
Web Audio (node-web-audio-api)     ✅
SuperCollider 3.13.0               ✅
  scsynth: /usr/bin/scsynth
  Test boot: passed (1.2s)
  Latency: 2.8ms estimated
JACK Audio                         ❌ not installed
Pioneer XDJ-XZ                     ✅ connected
Audio Interface — RME Fireface     ✅
  Outputs: 28 channels
  Buffer: 128 samples
  Latency: 2.7ms

Recommended backend: scsynth
Status: FESTIVAL READY ✅
```

### Live Performance Debut — Phase 14 Milestone
The live debut is a required milestone, not optional.
It is the real-world validation that Score works as a live instrument.
No fixed date — happens when the software is ready, not on a calendar deadline.

Minimum phases needed before debut:
- Phases 1-12 complete
- Phase 12c scsynth working
- Phase 12e DJ mode working
- 4+ hours continuous runtime tested locally

Phase 14b addresses everything discovered at the show.

### Live Performance Path
```
Club/small venue      → Score v1.0, Phase 12c done, scsynth working
Small festival stage  → Track record from clubs, technical rider written
Major festivals       → Multiple shows documented, established tool
```

---

## 11. Feature Log

### Ships before v1.0
- Euclidean rhythm generator in DSL
- Humanize — Gaussian timing/velocity variation
- Chord progression DSL — `Chords('Am F C G')`
- Scale degree notation in Sequence
- Preset system — save/load instrument + effect configs
- Song templates — `node score new song --template techno`
- BPM tap tempo — `node score tap`
- Stem export — `node score render --stems`
- Spectrum analyzer in Score Studio mixer
- Performance metrics — CPU, memory, voice count live
- Undo/redo in GUI session (separate from Git)
- Song diff tool — `node score diff v1.js v2.js`
- Tempo map — BPM changes within arrangement
- Shannon entropy pattern validator
- LiveInput crowd recording component
- @score/math full package
- Festival documentation package in docs/festival/
- `node score doctor` system check command
- Effects chain — ordered multi-effect per track
- Brick-wall hard limiter for festival use
- Distortion, BitCrusher, Chorus, Phaser, Flanger, Stereo Widener, Noise Gate effects
- Functional pattern model (Pattern<T> composable transforms)
- Monaco IDE in Score Studio — live eval, pattern gutter, REPL panel
- ADSR Envelope as core reusable primitive
- LFO as core modulation source
- Swing/groove as sequencer parameter
- Arpeggiator in DSL
- Group buses in mixer (route multiple tracks to shared processing)
- Multiband compressor for mastering chain
- Saturation / tape warmth effect
- Auto-pan effect
- Freeze / bounce (render track to audio to save CPU)
- Wavetable synthesis
- Convolution reverb (impulse response based)
- Sample slicing (chop loops into hits)
- Multi-sample instruments (velocity layers, round-robin)
- Envelope follower, Ring modulator

### Added from 2026-03-17 planning session

**Phase 9a — core modulation primitives (added 2026-03-18):**
- `createADSR(attack, decay, sustain, release)` — ADSR as standalone reusable primitive, not tied to any instrument
- `createLFO(rate, shape, depth)` — connects to any AudioParam by name: `lfo.connect(filter, 'frequency')`
- `automation(component, param, source)` — wire any modulation source to any component parameter
- `ramp(from, to, bars)` — linear value source over N bars (automation sweep)
- `sine(rate, depth)` / `cosine(rate, depth)` — periodic value sources for tremolo, vibrato, filter LFO

**Phase 9 DSL additions (ships before v1.0):**
- `drift(pattern, rate)` — gradual pattern evolution via OU process from @score/math. `rate: 0` = locked, `rate: 1` = immediate chaos. Used for imperceptible long-set evolution.
- `keepFor(bars, pattern)` — lock pattern for N bars, prevents hot reload from changing it. Live performance control tool.

**Phase 9c @score/pattern additions (added 2026-03-18):**
- `stack(...patterns)` — layer multiple patterns into one (polyphony combinator — critical for TidalCycles parity)
- `beat(...steps)` — shorthand for array literal: `beat(1,0,0,0)` = `[1,0,0,0]` with cleaner DSL look
- `humanize(amount, pattern)` — Gaussian timing + velocity variation. `amount: 0` = mechanical, `amount: 1` = loose

**Phase 9b @score/math additions:**
- `circleOfFifths(n)` — returns note at position n: `['C','G','D','A','E','B','F#','C#','G#','D#','A#','F'][n % 12]`
- Tuning systems in `@score/math/harmony/tuning.ts`: `just()`, `pythagorean()`, `meantone()`, `edo19()`, `edo31()`

**Phase 11 live coding additions:**
- `bars` — global loop counter in song file live coding context. Starts at 0, increments each bar. Enables conditional pattern logic beyond `every()`.
- `cursor.x` / `cursor.y` — mouse cursor position as real-time automation source in Score Studio. Maps to backend via `setParam()`. Phase 13 GUI dependency.

**Phase 13 GUI additions:**
- CPU% monitor (standard in live coding tools)
- Fragment render — render single component to WAV (`kick.render('./my-kick.wav')` or `score render --fragment kick`)

**Ecosystem position (confirmed 2026-03-17):**
Score is uniquely positioned — no existing tool combines: component instrument model, full production mixer, pre-composed songs alongside live coding, Git-native format, scsynth backend, XDJ hardware, real-time collaboration, plain language DSL, full DAW GUI, @score/math, testing infrastructure, and festival-grade setup. Closest JS tool is Facet — which has none of these.

**Community decisions (2026-03-17):**
- Joined TOPLAP Discord (listening only — no announcement until Phase 16/17)
- Announcement: Phase 16/17 only. When ready: PR to awesome-livecoding → TOPLAP forum → DM to Alex McLean (TidalCycles credit)
- Coming from TidalCycles page planned for score.dev docs
- Coming from Strudel page planned for score.dev docs

**Licensing (final, implement at Phase 16 only):**
- Free with no restrictions: personal use, performance (any venue), streaming, sales, sync, teaching, festivals, research, open source
- Voluntary support at score.dev/support — never required
- Contact required only for: building a competing DAW using Score code, embedding Score in a commercial product, white-labeling, or selling Score itself
- Framework packages: MIT. Score Studio GUI: MIT. @score/dsp (post-v1.0): ELv2.
- Override keys: free for universities, festival partners, invited artists — issued within 24 hours

**@score/dsp — post-v1.0 (Phase 16b):**
- AssemblyScript compiled to WebAssembly, runs in AudioWorklets
- Core algorithms: FFT (Cooley-Tukey), phase vocoder, pitch shifter, ZDF filter, true peak limiter, convolution reverb
- Target: within 5x of scsynth in browser context (~0.05ms FFT vs scsynth's ~0.01ms)
- License: ELv2 (not MIT) — free for everything except managed service providers

**Additional libraries to evaluate (not yet added as deps):**
- `WebMIDI.js` — cleaner browser WebMIDI wrapper for @score/midi (Phase 12)
- `Soundfont.js` — 128 GM instruments, zero download, good for @score/musical onboarding
- `Wavesurfer.js` — waveform visualization for Phase 13 GUI
- Faust, RNBO — post-v1.0 backend considerations

### Nice to have post-v1.0
- Audio recording directly into session timeline
- Ableton Link BPM sync
- OSC output to other tools
- Mobile browser jam control surface
- Collaboration history replay
- Headless render server
- MIDI CC automation recording
- Waveform visualization of clips
- Waveshaping as first-class synth prop
- Image → audio spectral conversion (PNG pixel brightness → frequency) — experimental/community
- 2D MIDI pattern generation from geometric shapes — experimental/community

### Decisions deferred
- Audio recording into timeline (complexity — post v1)
- Ableton Link (may conflict with Score transport — evaluate later)
- VST support beyond JACK routing
- `@score` npm scope — taken, using `@score-music` instead

---

## 11b. Competitor Analysis — Critical Gaps vs TidalCycles / Strudel / Facet

*Audit completed 2026-03-18. Score's position vs each tool.*

### TidalCycles (Haskell, 2009)
The academic gold standard for algorithmic music. Score is the musician-readable implementation.

| TidalCycles feature | Score status | Plan |
|---------------------|-------------|------|
| `stack` — layer patterns | **Missing** ⬜ | Phase 9c — `stack(...pats)` |
| `every N f pat` — conditional transform | **Done** ✅ | `every(N, f, pat)` in @score/pattern |
| `fast` / `slow` | **Done** ✅ | in @score/pattern |
| `degrade` — random dropping | **Done** ✅ | in @score/pattern |
| `rev` — reverse | **Done** ✅ | in @score/pattern |
| `shift` — phase rotation | **Done** ✅ | in @score/pattern |
| Mini-notation (e.g. `"bd*2 sd"`) | **Planned** ⬜ | Phase 9c — `mini()` adapter |
| LFO as modulation source | **Missing** ⬜ | Phase 9a — `createLFO()` |
| Pattern continuation (cycles/arcs) | Partial — array-based | Phase 9c — `Pattern<T>` arc type |
| `<pattern>` alternation per cycle | **Not planned** | Post-v1.0 |

### Strudel (JavaScript port of TidalCycles, 2022)
The closest JavaScript equivalent. Score's `mini()` will serve as a migration bridge.

| Strudel feature | Score status | Plan |
|----------------|-------------|------|
| Mini-notation string parsing | **Planned** ⬜ | Phase 9c — migration bridge only |
| Punchcard visualizer | **Planned** ⬜ | Phase 11b |
| REPL with live eval | **Planned** ⬜ | Phase 13f |
| Web Audio backend | **Done** ✅ | @score/core web-audio.ts |
| Pattern transforms | **Partial** ⚠️ | Missing stack, beat, humanize |
| Scheduled parameter changes | **Planned** ⬜ | Phase 9a — automation system |

### Facet (JavaScript, 2021 — closest JS production tool)
Node.js-based, OSC, real-time. Score has far broader scope.

| Facet feature | Score status | Plan |
|---------------|-------------|------|
| Array-based patterns | **Done** ✅ | Core pattern type |
| `interp()` / `scale()` transform | Partial — in @score/math | Phase 9c additions |
| `chaos()` function | **Missing** ⬜ | Phase 9f — Lorenz + logistic map |
| `drunk()` random walk | **Missing** ⬜ | Phase 9f — OUProcess-based |
| `sine()` / `cosine()` as value source | **Missing** ⬜ | Phase 9a |
| `ramp()` automation | **Missing** ⬜ | Phase 9a |
| OSC output | **Planned** ⬜ | Phase 12 |

### What Score has that no competitor does

| Score unique feature | Status |
|---------------------|--------|
| Full production mixer with festival-grade limiter | ✅ Phase 7 |
| Git-native song format (ES modules, text diff, PR review) | ✅ By design |
| Pre-composed song format + live coding in same file | ✅ By design |
| scsynth professional audio backend | ⬜ Phase 12c |
| Pioneer XDJ hardware integration | ⬜ Phase 12 |
| Real-time jam session collaboration | ⬜ Phase 12b |
| Score Studio full DAW GUI | ⬜ Phase 13 |
| @score/math (discrete math + chaos + info theory) | ✅ Phase 9b |
| Plain language DSL (`describe()`) | ⬜ Phase 9d |
| Song file security (AST + Zod validation) | ✅ Phase 9e |
| Full test infrastructure + CI enforcement | ✅ All phases |
| Component model (Kick/Snare/Synth as typed props) | ✅ Phase 5 |

### Critical path — build these before announcing Score

These gaps block Score from being "better than TidalCycles/Strudel for EDM producers":

1. **`stack()`** — Phase 9c — without this, polyphony is clunky
2. **LFO + automation** — Phase 9a — essential for filter sweeps, tremolo, any movement
3. **`ramp()` / `sine()` as value sources** — Phase 9a — standard in every live coding tool
4. **`humanize()`** — Phase 9c — mechanical timing is the #1 complaint about algorithmic music
5. **Arrangement execution** — Phase 9 remaining — sections must actually change what plays
6. **Chaos generators** — Phase 9f — differentiator vs all competitors, already in spec

---

## 12. Architectural Rules — Never Violate

1.  Song files are never compiled — ES modules, Node 20, direct execution
2.  Web Audio API never exposed to song authors — always abstracted
3.  All audio nodes via backend interface — no exceptions anywhere
4.  `ScoreError` is the only error factory — never raw `Error`, never `new`
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
18. XDJ profiles support all three mixer modes — score-mixer, hardware-mixer, hybrid
19. All code is functional — factory functions, `const`, arrow functions, zero classes
20. Song files are AST-validated before execution — SongValidator runs first, rejects blocked imports
21. Only @score/* and local relative imports are valid in song files
22. Blocked in song files: fs, child_process, net, http, https, fetch, process, eval, setTimeout
23. Song exports are Zod-validated before the engine receives them
24. --trust flag skips validation — developer-only, never document as safe for shared files
25. @score/musical plain language compiles to component model — identical audio output, no AI
26. PatternInput in sequencer accepts both number[] and Pattern<T> — arrays never removed
27. Pattern<T> type is (arc: Arc) => Event<T>[] — functions from time, not data arrays
28. @score/pattern and @score/math ship in v1.0 — advanced features, not required for basic songs
29. Every public export (function, type, interface) gets a TSDoc `/** */` block — standard in `docs/spec/TSDOC_STANDARD.md`
30. TSDoc format: `@param name — description` (no type), `@returns`, `@example` with real song usage, `@throws {ScoreError}` on invalid input
31. TypeDoc generates HTML docs — `pnpm docs` → `docs/api/`. Config at `typedoc.json`.

---

## 12b. MCP Server Architecture

Score has **3 MCP servers** at different lifecycle stages:

### score-codebase (Phase 1b — build now)
Code intelligence for Claude sessions working on Score. Lives in `mcp-servers/score-codebase/`.

| Tool | Purpose |
|------|---------|
| `architecture_rules` | CLAUDE.md + SCORE_HANDOFF.md rules, code style, non-negotiables |
| `package_graph` | 10-package dependency graph with export counts |
| `api_surface` | List exports/types for any package (e.g., `@score/effects` → 14 effects + props) |
| `project_status` | Phase roadmap, blockers, test counts per package |
| `adr_lookup` | Architecture Decision Records (searchable) |

### score-audio (Phase 10b — build with demo)
Audio domain intelligence for AI-assisted composition and debugging.

| Tool | Purpose |
|------|---------|
| `effect_catalog` | All effects with props, node types, signal routing diagrams |
| `signal_flow` | Trace audio routing for a given component or mixer channel |
| `backend_nodes` | All BackendNode types with methods and Web Audio mappings |
| `component_catalog` | All AudioComponents (instruments, effects, mixer) with interfaces |

### score-game-tools (Phase 10b2 — build post-demo)
Live runtime tools for inspecting running audio state.

| Tool | Purpose |
|------|---------|
| `song_inspector` | Parse a song file, show tracks/patterns/effects/routing |
| `mixer_state` | Current mixer state (channel levels, solo/mute, sends) |
| `transport_state` | Current position, BPM, playing/stopped |
| `audio_graph` | Dump the live audio node graph |

### Framework MCP (Phase 15b — public release)
For Score users building songs with AI assistance. Exposes the public API surface, not internals.

---

## 13. Dependencies

### Audio
| Package | Purpose |
|---------|---------|
| `tone` | Transport, Sequence, scheduling — Layer 1 |
| `node-web-audio-api` | Web Audio polyfill for Node.js |
| SuperCollider (system install) | scsynth binary — Score managed |
| `osc` | OSC communication with scsynth |

### Build
| Package | Purpose |
|---------|---------|
| `turbo` | Monorepo task orchestration |
| `pnpm` | Package manager |
| `typescript` 5.x | Framework language |
| `tsx` | Run TypeScript directly in Node |

### Testing
| Package | Purpose |
|---------|---------|
| `vitest` | Unit + integration |
| `@vitest/coverage-v8` | Coverage |
| `playwright` | E2E for Score Studio |

### GUI (Phase 13)
| Package | Purpose |
|---------|---------|
| `react` + `react-dom` 18.x | Score Studio |
| `vite` | Dev server + build |

### Runtime Features
| Package | Purpose |
|---------|---------|
| `chokidar` | File watcher for hot reload |
| `ws` | WebSocket server for jam session |
| `essentia.js` | BPM, key, beat analysis |
| `meyda` | Real-time audio feature extraction |
| `midi-parser-js` | MIDI file parsing |

### Song File Security (Phase 9e)
| Package | Purpose |
|---------|---------|
| `acorn` | JavaScript AST parser for SongValidator |
| `acorn-walk` | AST traversal for import/eval detection |

### Never Use — Ever
| Thing | Reason |
|-------|--------|
| Any AI music/voice generation API | Core principle |
| Bundled sample packs | Legal + personal sound |
| Any cloud audio processing | Everything local |
| `var` keyword | Always `const` |
| `function` keyword in song files | Arrow functions only |
| `class` anywhere in Score | Functional only — factory functions |
| Raw `Error` throws | Always `ScoreError` |
| `new ScoreError()` | Factory function — no `new` |
| Direct Web Audio API in components | Always backend interface |
| Direct `.value =` on audio params | Always ramp |
| Artist interacting with SuperCollider | Always Score-managed |

---

## 14. Session Log

**Append one line here at the end of every session.**
Format: `YYYY-MM-DD sNNN — What was completed or significantly advanced`

```
2026-03-15 s000 — Phase 1 scaffold, CI, all packages stubbed
2026-03-15 s001 — Phases 2-4 complete, backend abstraction, synthesis, sampler
2026-03-16 s002 — Phases 5-6 complete, DSL components, effects, 249 tests
2026-03-16 s003 — Architecture compliance (ramp rule, id/type, ScoreError fields), tech debt cleanup, handoff v3
2026-03-16 s004 — Handoff v4 unification, pre-Phase 7 audit, @score-music scope decision
2026-03-16 s005 — Phase 6 completion (8 effects + chain + 2 backend nodes), Phase 7 Mixer, Phase 8 Sequencer — 553 tests
2026-03-16 s006 — score-codebase MCP loaded; incorporated language+security decisions: Phase 9d (describe()), 9e (AST security), rules 20-28, @score/pattern design philosophy
2026-03-17 s005 — Phase 9b (@score/math), 9c (@score/pattern), 9e (AST+Zod security), CLI polish (--watch, doctor, new song, --trust, --version), note names, ADSR+filter on Synth, docs/ folder — 701 tests
2026-03-18 s006 — Session housekeeping: signals acknowledged, CLAUDE.md signal docs, handoff updated to reflect actual phase status, planning doc incorporated
2026-03-18 s007 — Phase 9 roadmap audit: Phase 8b renamed to 9a (modulation primitives), Phase 9f added (chaos/OUProcess/L-systems/RK4/tuning), competitor gap analysis added (Section 11b vs TidalCycles/Strudel/Facet), stack()/beat()/humanize() added to Phase 9c plan, "## 9." section header fixed to "## 9b.", TSDoc standard locked (TypeDoc + eslint-plugin-tsdoc), handoff split to pointed spec files, GETTING_STARTED.md created, 5-agent pre-Phase-10 build plan drafted
2026-03-18 s008 — Wave 1 complete: Phase 7b (multiband-compressor/saturation/autopan + TSDoc all effects), Phase 9a (@score/modulation: createLFO/createADSR/sources, BackendAudioParam), Phase 9b/9f (@score/math extended: chaos/harmony/stochastic/transforms, 158 tests), Phase 9c (stack/beat added, 45 tests), Phase 9d (@score/musical: describe() vocabulary tokenizer, 37 tests). PR #14 open. 1,074 tests total.
2026-03-21 s009 — Phase 12 MIDI bridge PRs closed; Phase 9 automation() added (PR #28); Phase 12b @score/session (createJamSession, 22 tests, PR #30); Phase 13 Score Studio scaffold: Electron + React, electron-forge + Vite, splash screen, 4 mode shells, TransportBar, typed IPC bridge, Testing Trophy stack (Vitest + jsdom + @testing-library + vitest-axe), roadmap gaps added to Phase 12e (BPM analysis, key detection, hot cues, crate mgmt, two-deck sync, set recording, stem separation).
```

---

## Start-of-Session Checklist

1. Read `../claude-resources/sessions/score/current.md`
2. Read this file (`SCORE_HANDOFF.md`)
3. Read `AGENTS.md` — check what's in progress
4. Run `pnpm test` — all tests must pass
5. Update Section 2 build status
6. Reconcile any gaps between this document and actual codebase
7. Ask for session goal

---

*Score Music — SCORE_HANDOFF.md — v4*
*Sections 2, 11, and 14 updated every session without exception*
