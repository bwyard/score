# Score Studio — Full Gap Analysis

**Date:** 2026-03-22
**Session:** s013
**Branch:** feat/phase-11b-live-code-visualizer
**Test count:** 1341 passing

This document is an honest, specific assessment of where Score stands today versus where it needs to be. It is written for the project owner, not for promotion. If something is missing, it says so plainly.

---

## 1. What Is Built and Working

### Framework Packages (all 15 packages exist in packages/)

| Package | Status | Test count (approx) | Notes |
|---|---|---|---|
| `@score/core` | Complete | — | BackendNode abstraction, ScoreError, audio graph, oscillator, gain, noise, sample |
| `@score/pattern` | Complete | 50 | euclidean, beat, stack, rev, every, degrade, shift, humanize, scaleNotes, chordNotes |
| `@score/math` | Complete | 158 | Fibonacci, chaos (Lorenz/logistic/Lyapunov), L-systems, Wolfram CA, RK4, OUProcess, harmony, tuning |
| `@score/modulation` | Complete | 54 | createADSR, createLFO, ramp, sine, cosine, automation() |
| `@score/musical` | Complete | 37 | describe() vocabulary tokenizer — vocabulary-based, not AI |
| `@score/effects` | Complete | — | 17 effects: Delay, Reverb, Compressor, EQ, Sidechain, Distortion, BitCrusher, Chorus, Limiter, MultibandCompressor, Saturation, AutoPan, Phaser, Flanger, StereoWidener, Gate, Filter |
| `@score/midi` | Stub | — | createMidiBridge + XDJ-RX3/XDJ-XZ profiles (spec-derived, not hardware-verified) |
| `@score/mcp` | Stub | — | `export const _stub = true` — Phase 10b |
| `@score/sequencer` | Complete | — | createClock, createTransport, createStepSequencer, createTempoMap, swing/groove |
| `@score/dsl` | Complete | — | Song, Kick, Snare, HiHat, Synth, Sample, Arp, Sequence, note names (A2/F#3), drift(), keepFor(), noteHz(), resolveFreq() |
| `@score/components` | Partial | — | Kick, Snare, HiHat, Synth, Sample, Sax, Theremin — **generic stubs only, not 808/909 accurate** |
| `@score/mixer` | Complete | — | Channel, Return, Group, master bus, hard limiter, solo logic, sub bus, sidechain |
| `@score/session` | Complete | 22 | createJamSession, SessionState, connectMidi, patch, update |
| `@score/cli` | Complete | — | score play, --watch, --trust, score doctor, score new song, --version, score export, score list |
| `@score/gui` | Partial | — | Electron + React Score Studio — Live Code mode working, other modes scaffolded |

### GUI — Confirmed Working Components

**Audio pipeline:**
- Engine init, BPM sync, bar counting
- Code evaluation via vm sandbox (imports stripped, export default captured)
- Bar-boundary hot-swap (pending queue) with amber badge
- Web Audio output, master gain, transport play/stop
- Pop prevention — all 8 instruments use zero-gain onset invariant

**Visualizers:**
- PunchcardGrid — canvas, per-track colour rows, playhead cursor, beat flash
- Scope — live waveform, glow when playing, flat line when idle
- SpectrumAnalyser — 32-bin FFT bars, glow, idle baseline
- PianoRoll — MIDI pitch display, note blocks, cursor column
- CodeHighlight — Strudel-style sweep fill, scroll sync, step badges (e.g. "3/8")
- CodeWaveform — semi-transparent waveform overlay behind textarea
- BeatClock — beat position display (BEAT 2/4)

**IPC channels (all wired):**
- `engine:state` — playing/bpm/bars
- `engine:step` — per-step cursor sync (fixed commit b8ddc59)
- `engine:analysis` — waveform + spectrum at ~20fps
- `song:update` — track metadata after eval
- `engine:notes` — MIDI note events for piano roll
- `engine:pending` — hot-swap queued signal
- `debug:pop` — amplitude delta stream to ConsoleLog

**Editor:**
- Textarea + Ctrl+Enter eval
- Code patching: patchBpm, patchTrackVolume, patchTrackPattern, patchTrackNote (pure regex, bidirectional)
- STARTER template on entry
- File ops: Save / Open / New

**Panels:**
- DraggablePanel — drag, resize, close (document-level mousemove/mouseup)
- Toolbar toggles: Grid / Scope / FFT / Piano / Mixer / Console / Ref
- Default layout: Punchcard + Scope + Console visible
- ConsoleLog — 200-entry FIFO, timestamps, levels, error colouring

**Transport:**
- BPM input → engine.patch()
- Play/Stop, bar counter, home nav
- EvalStatus badges (idle/pending/ok/error)

**MCP servers (standalone scripts in mcp-servers/):**
- score-codebase: architecture_rules, package_graph, api_surface, project_status (stub), adr_lookup
- score-audio: effect_catalog, signal_flow (partial), backend_nodes, component_catalog

---

## 2. What Is In Progress Tonight

**Branch:** `feat/phase-11b-live-code-visualizer` (PR #33)

Session s013 is open. PR #33 is out of DRAFT and ready to merge. All Phase 12a deliverables are committed on this branch:

- Pop prevention — zero-gain onset, regression test
- CodeHighlight redesign — Strudel-style sweep, scroll sync, step badges
- BeatClock — BEAT 2/4 display
- Saturation + AutoPan — descriptor factories, vm wiring, engine hydration, ReferencePanel
- effectivePattern() — Arp default pattern emitted correctly to renderer
- Pop detector IPC — debug:pop channel + ConsoleLog
- codePatcher — bidirectional pure-regex editing (patchBpm / patchTrackPattern / patchTrackVolume / patchTrackNote)
- STARTER updated — BPM 120, lower gains, euclidean patterns, Saturation+AutoPan
- PunchcardGrid onStepClick prop (Phase 12b ready)
- TransportBar onBpmChange prop (Phase 12b ready)

**Active agent tracks (from current.md):**
- Option A: Monaco editor (Phase 13f)
- Option B: Phase 12b bidirectional + Piano Roll data
- Option C: Synthesis instrument library (createKick808 etc.)
- Option D: Demo blockers (t158 grey out modes, t148 punchcard labels, PR #33 merge)

The gap analysis document itself (this file) is the current task.

**Other open branches of note:**
- `feat/phase-2-synthesis-instruments` — synthesis instruments (stale, may need rebase)
- Several worktree-agent branches — may be abandoned

**By morning (assuming Option D is the next track):**
- t158 — non-Live-Code modes greyed out on splash
- t148 — punchcard track name labels
- PR #33 merged to dev

---

## 3. Roadmap Phase Status

| Phase | Status | Notes |
|---|---|---|
| 1 — Scaffold + CI + ScoreError | Complete | All packages stubbed, CI wired, pnpm/Turborepo |
| 1b — Codebase Intelligence MCP | Partial | MCP servers exist as standalone scripts; score-codebase and score-audio functional; project_status tool is a known stub |
| 2 — Core engine + backend abstraction | Complete | BackendProvider/BackendContext interface, webAudioBackend, BackendNode types |
| 2b — Web Audio backend | Complete | Default backend |
| 3 — Synthesis: synth drums + oscillators | Partial | Generic Kick/Snare/HiHat stubs working. **FM synthesis deferred to Phase 12d. 808/909 accurate drums deferred.** This is the biggest instrument gap. |
| 4 — Sampler + time stretch | Complete | GrainPlayer-based, basic time stretch |
| 5 — DSL components | Complete | PR #10 merged. Kick, Snare, HiHat, Synth, Sample as typed factories |
| 6 — Effects (14 effects) | Complete | All 14 effects + 3 mastering tools = 17 total |
| 6b — Effects chain + BackendWaveShaperNode + BackendStereoPannerNode | Complete | createEffectsChain utility |
| 7 — Mixer | Complete | Channel, Return, master bus, hard limiter, solo logic |
| 7b — Mastering chain | Complete | MultibandCompressor, Saturation, AutoPan; TSDoc on all 16 effects |
| 8 — Sequencer + Transport + TempoMap + Swing/Groove | Complete | |
| 9 — Song format + Automation + Pattern reuse + Arpeggiator | Complete | Song/Track/Section DSL, note names, ADSR+filter on Synth, ScoreEngine, Arp, arrangement execution, drift(), keepFor() |
| 9a — Core modulation primitives | Complete | createADSR, createLFO, ramp, sine, cosine, BackendAudioParam, automation() — 54 tests |
| 9b — @score/math | Complete | 158 tests. Fibonacci, Padovan, Tribonacci, entropy, polyrhythm, transforms, stochastic (drunk/markov), harmony (circleOfFifths, tuning systems), chaos |
| 9c — @score/pattern | Complete | 50 tests. euclidean, fast, slow, rev, every, degrade, shift, scaleNotes, chordNotes, stack, beat, humanize |
| 9d — @score/musical | Complete | describe() vocabulary tokenizer, 37 tests |
| 9e — Song file security | Complete | AST validator (acorn) + Zod export validator + --trust flag, 12 tests |
| 9f — Extended math (chaos/stochastic/tuning) | Complete | Lorenz, logistic map, Lyapunov, L-systems, Wolfram CA, RK4, OUProcess (all in @score/math) |
| 10 — CLI | Complete | score play, --watch, --trust, doctor, new song, --version, export, list |
| 10b — score-audio MCP | Partial | Standalone scripts exist. effect_catalog, backend_nodes, component_catalog working. signal_flow omits effects chain (known gap from MCP feedback). |
| 10b2 — score-game-tools MCP | Not started | Song inspector, mixer state, transport state, audio graph — not yet built |
| 10b3 — score-codebase MCP | Partial | architecture_rules, package_graph, api_surface, adr_lookup working. project_status is a known empty stub (known gap from MCP feedback). |
| 10c — Decode (audio analysis + format import) | Not started | Rekordbox, Serato, FL Studio, MIDI import — Phase 10c |
| 11 — Hot reload + live coding (3 levels) | Complete | Level 1: --watch. Level 2: patch(). Level 3: update() diffs + bar-boundary swap. bars counter, muteEnvelope pure fn. cursor.x/cursor.y deferred to Phase 13 GUI. |
| 11b — Live coding visualization | Partial | PunchcardGrid, Scope, SpectrumAnalyser, PianoRoll all built. **t147 (punchcard cursor animation) is open — needs live playback verification.** Pattern graph not yet built. |
| 12 — MIDI bridge + XDJ profiles | Partial | createMidiBridge, XDJ-RX3 and XDJ-XZ profiles (needs-testing — spec-derived, not hardware-verified). Traktor S and Serato stubs (look-into). **No physical hardware tested.** |
| 12b — Jam session | Complete | createJamSession, SessionState, 22 tests. codePatcher props wired and ready but bidirectional Piano Roll + punchcard step-toggle not yet wired. |
| 12c — SuperCollider backend | Not started | No scsynth binary, no SCSynthManager, no OSC bridge, no SynthDefs |
| 12d — Advanced synthesis (FM, wavetable, physical, granular, warping) | Not started | |
| 12e — DJ mode (Set format + deck management) | Not started | Auto-BPM, key detection, hot cues, crate management, two-deck sync, set recording |
| 12f — LiveSet mode (clip launching) | Not started | |
| 12g — Advanced effects (convolution reverb, envelope follower, ring modulator) | Not started | |
| 12h — Advanced sampler (slicing, velocity layers, stem separation) | Not started | |
| 12i — Probabilistic/diffusion generation | Not started | Grain scattering, spectral diffusion, stochastic resonance — foundation (Lorenz/logistic/OUProcess) is in @score/math |
| 13 — Score Studio GUI scaffold | Partial | Electron + React, electron-forge + Vite, splash screen, 4 mode shells, TransportBar, typed IPC bridge, Testing Trophy stack. **Live Code mode is the only functional mode.** |
| 13b — GUI jam session interface | Not started | |
| 13c — Audio clip editor | Not started | |
| 13d — Automation lanes | Not started | |
| 13e — Plugin architecture (VST/AU) | Not started | |
| 13f — Monaco IDE integration | Not started | Textarea is current editor. No IntelliSense, no beat gutter, no DSL token provider. |
| 14 — First real tracks + live performance debut | Not started | Blocked on Phases 12c, 12e, and synthesis instrument library |
| 14b — Post-show fixes | Not started | |
| 15b — Framework MCP (public) | Not started | |
| 15 — Beta audit | Not started | |
| 16 — Release infrastructure | Not started | |
| 17 — v1.0 | Not started | |

**New information that changes the original plan:**

The original Phase 13 spec treated modes as isolated silos. ADR 006 and the unified performance model (t173–t180) clarify: **modes are panel layout presets, not separate systems.** The engine is shared across all modes. A DJ deck is a Song engine running in a lane. This was not explicitly in the original SCORE_HANDOFF.md Phase 13 description; it has now been fully formalised in ADRs and design-principles.md. The implementation has not yet caught up — modes are still stub shells, not layout presets of a unified workspace.

---

## 4. Synthesis Gap Analysis

### What Score can synthesize today

Score's `@score/components` currently contains **generic stubs** for Kick, Snare, HiHat, and Synth. These are not modelled on any specific hardware. They produce recognisable sounds but are not genre-accurate. A tester will notice they do not sound like 808, 909, or 303.

Specific capability today:
- Generic kick: pitched oscillator + envelope, no noise click, not tuned to sub
- Generic snare: noise + envelope, no dual-oscillator tone layer
- Generic hihat: noise + HPF, not 6-oscillator metallic cymbal
- Synth: saw/square/sine oscillator + basic filter + ADSR — workable for bass and lead
- Sample: GrainPlayer-based playback
- All 17 effects available for routing

### What a techno track needs vs what Score can deliver

| Element | Required | Score today | Gap |
|---|---|---|---|
| TR-909 kick | Pitched sine + pitch env + noise click | Generic kick (no click) | createKick909 (t161) |
| TR-909 snare | 2 triangle OSC + white noise + HPF | Generic noise snare | createSnare909 (t162) |
| TR-808 hihat | 6 detuned square OSC + bandpass + HPF | Noise HPF only | createHihat808 (t163) |
| TR-909 clap | Burst-gated noise, 3–4 layers | None | createClap909 (untracked) |
| 2-op FM bass/lead | Carrier + modulator FM synthesis | None | createFMSynth (t165) |
| Detuned saws pad (Juno) | Multiple OSC + resonant LP + chorus | Synth (partial) | createSubtractiveSynth (t164) |
| Sidechain pump | Kick → compressor sidechain | createSidechain exists | Needs routing from DSL |
| Long dark reverb | 2–4s, sidechained | createReverb exists (no pre-delay, no plate type) | Pre-delay (t167) |
| Dotted-eighth delay on leads | time = 60/BPM × 0.75s | createDelay exists | Routing — no gap |

**Summary:** A minimal techno track (kick, snare, hihat, bass) works with the generic stubs but sounds generic. The 808/909/FM instruments (t160–t166) are the gate to genre-accurate techno output.

### What a deep house track needs vs what Score can deliver

| Element | Required | Score today | Gap |
|---|---|---|---|
| TR-808 kick | Pure sine + long pitch env | Generic kick | createKick808 (t160) |
| TR-808 hihat | 6-oscillator or noise + HPF | Noise HPF | createHihat808 (t163) |
| Sub bass (pure sine) | Pure sine at root | Synth with sine wave | Works |
| Filtered saw bass (Juno) | Slow attack saw + LP | Synth (partial) | createSubtractiveSynth (t164) |
| Rhodes pad (DX7 FM) | 2-op FM, modulation index env | None | createFMSynth (t165) |
| Juno chord pad | Detuned saws + chorus + LP | Synth (partial, no detune multi-OSC) | createSubtractiveSynth (t164) |
| Plate reverb + pre-delay | 1.5–3s, pre-delay 20–40ms | createReverb (no pre-delay) | Add preDelay prop (t167) |
| Slapback delay | 80–150ms on Rhodes | createDelay exists | Works |

**Summary:** Deep house requires the FM Rhodes and multi-OSC Juno pad most critically. The 808 kick is also essential for the genre's characteristic sub-heavy punch. Pre-delay on reverb is a deep house differentiator that currently doesn't exist.

### What a TB-303 acid track needs vs what Score can deliver

The synthesis-spec.md documents the 303 signal chain in detail. Today Score has **none of the 303-specific elements**:

| Element | Required | Score today | Gap |
|---|---|---|---|
| Pre-filter saturation (tanh, drive 0.2–0.4) | Critical for squelch | createSaturation exists | Not wired to createBass303 (which doesn't exist) |
| MEG filter envelope (attack 2ms fixed, variable decay) | Defines the acid sweep | createADSR exists | Needs to target filter cutoff — createBass303 |
| VCA envelope (separate from filter) | Standard | createADSR exists | Integration needed |
| Accent (+6dB VCA, forced 200ms MEG decay) | Defines dynamics | None | createBass303 |
| Slide (pitch glide ~60ms, no env retrigger) | Defines legato | None | Portamento/slide state threading |
| Diode ladder filter approximation | Dirty resonance at high Q | BiquadFilterNode is clean | Acceptable approximation for now; full accuracy needs AudioWorklet (t168, Phase 5) |

**Summary:** A convincing acid track is not possible today. createBass303 (t166) is the single blocker. It depends on createSubtractiveSynth (t164) existing first. The full ladder filter AudioWorklet (t168) is Phase 5 / low priority — the MEG/VCA/accent/slide behaviour is the higher-value gap.

### What a live algorave performance needs vs what Score can deliver

| Element | Required | Score today | Gap |
|---|---|---|---|
| Hot-swap at bar boundary | Core interaction | Working | None |
| REPL/console with eval status | Real-time feedback | Working (ConsoleLog, EvalStatus) | None |
| Keep-last-good on error | Performance safety | Working | None |
| Visualizers for crowd projection | Algorave aesthetic | PunchcardGrid, Scope, FFT, Piano Roll | Monaco beat gutter (t154), inline gutter widgets (t183) — Phase 13f |
| Full-screen code + visualizer mode | Projection-legible | Not yet | t182 algorave full-screen mode |
| Monaco editor | IDE feel | Textarea only | t154 — Phase 13f |
| `bars` counter in code | Arrangement control | Working | None |
| Multiple independent pattern streams (TidalCycles d1/d2/d3 style) | Layered live coding | Single Song export only | t157 — not on roadmap yet |
| Panic button (all stop) | Performance safety | Stop button stops all, no instant-kill | t157 — needs dedicated panic key |
| Undo per stream | Live code rollback | None | t157 — not on roadmap |
| MIDI out | Sync external gear | None | Phase 12 |
| Ableton Link sync | BPM sync with other apps | Not planned | Post-v1.0 |

**Summary:** A minimal algorave performance is feasible today with the textarea. The missing elements for a polished algorave show are Monaco (t154), full-screen mode (t182), and the inline gutter widgets (t183). Multiple independent pattern streams (d1/d2/d3) are a significant TidalCycles parity gap not yet tracked in the roadmap.

---

## 5. Live Code Mode — Feature Completeness

### Pattern language comparison

| Feature | TidalCycles | Strudel | Score today | Gap |
|---|---|---|---|---|
| `stack` (polyphony combinator) | `stack d1 d2` | `stack(...)` | `stack(...patterns)` in @score/pattern | None — done |
| `every N f pat` | `every 4 (fast 2)` | same | `every(4, fast(2), pat)` | None |
| `fast` / `slow` | core | core | `fast`, `slow` | None |
| `degrade` (random dropping) | `degrade` | same | `degrade(prob, pat)` | None |
| `rev` | `rev` | same | `rev(pat)` | None |
| `shift` | `rotL` | same | `shift(n, pat)` | None |
| `humanize` (timing jitter) | external | `perlin` etc. | `humanize(amount, pat)` | None |
| Mini-notation (`"bd*2 sd"`) | core | core | Not implemented | t157 — planned Phase 9c, not yet done |
| Per-cycle alternation (`<a b c>`) | core | core | Not planned | Post-v1.0 |
| Multiple independent streams (d1/d2/d3) | Core paradigm | Core paradigm | Single Song only | Not tracked — significant gap |
| Pattern continuation / arc type | Core (Haskell arcs) | Implemented | Array-based only | Phase 9c Pattern<T> arc type not yet built |
| `orbit` (independent output routing) | `orbit 0, orbit 1` | same | No concept of orbits | Not planned |
| Note names | Limited | String notation | `'C3'`, `'F#4'`, `'Bb2'` full support | None |
| Scale degree notation | `scale "minor" 0 2 3` | same | `scaleNotes('minor', 'C3', 8)` | No scale-degree-per-step (partial) |
| `euclidean` | `euclid` | same | `euclidean(hits, steps, offset?)` | None |
| Chaos generators | External | External | Lorenz, logistic, Wolfram in @score/math | Wire to DSL — no gap in math, gaps in wiring |
| PRNG (seeded) | via random | via random | Math.random() (unseeded) | t187 — @prime/prime-random not yet wired |

### Synthesis depth comparison

| Feature | TidalCycles (SuperDirt) | Strudel | Score today | Gap |
|---|---|---|---|---|
| Sampler | Via SuperDirt | Built-in | @score/components Sample | Works |
| 808/909 drum synthesis | Via SuperDirt SynthDefs | Built-in | Generic stubs | t160–t163 |
| FM synthesis | Via SuperDirt | Via Tone.js | Not built | t165 |
| TB-303 acid bass | Via SuperDirt | Basic | Not built | t166 |
| Subtractive synth (Juno-style) | Via SuperDirt | Via Tone.js | Generic Synth (partial) | t164 |
| Convolution reverb | Via SuperDirt | Tone.js | Not built | Phase 12g |
| 17 audio effects | External | Tone.js | All built | None |
| Festival-grade limiter | External | Not available | Built — Phase 7 | None |
| Multiband compressor | External | Not available | Built — Phase 7b | None |

### Hot-reload workflow comparison

| Feature | TidalCycles | Strudel | Score today | Gap |
|---|---|---|---|---|
| Hot-swap at bar boundary | Core — cycle boundary | Core | Working (Ctrl+Enter) | None |
| Keep-last-good on error | Yes | Yes | Yes | None |
| Error shown without interrupting playback | Yes | Yes | Yes (ConsoleLog) | None |
| Swap queued badge | No (terminal only) | Browser overlay | Amber badge in TransportBar | None |
| eval on save (not Ctrl+Enter) | Yes — file watcher | Auto-eval | --watch mode in CLI; GUI requires Ctrl+Enter | GUI auto-eval option missing |

### Editor / IDE features comparison

| Feature | TidalCycles | Strudel | Score today | Gap |
|---|---|---|---|---|
| Syntax highlighting (DSL-aware) | Via Vim/Emacs plugins | Browser Monaco | CodeHighlight (sweep style) — not Monaco | t154 — Phase 13f |
| IntelliSense / autocomplete | Via LSP plugins | Monaco DSL | None | t154 — Phase 13f |
| Beat position gutter markers | Via Haskell plugins | Monaco decorations | Not yet | t154 — Phase 13f |
| Inline live values (gutter widgets) | No | Partial | Not yet | t183 — Phase 13f+ |
| Full-screen editor | Via terminal/fullscreen | Browser full-screen | Not yet | t182 |
| Editor / visualizer split resize | Terminal layout | N/A | Fixed 50/50 split | t152 |
| Multiple file / multi-pattern tabs | Via multiple terminals | Multiple `d` channels | Single file only | Not tracked |

### Visualization

| Feature | TidalCycles | Strudel | Score today | Gap |
|---|---|---|---|---|
| Punchcard/step grid | None (terminal) | Built-in | PunchcardGrid (working) | Cursor verify — t147 |
| Oscilloscope | None | Built-in | Scope (working) | None |
| FFT spectrum | None | Built-in | SpectrumAnalyser (working) | None |
| Piano roll | None | Built-in | PianoRoll (working) | None |
| Pattern graph | None | Partial | Not built | Phase 11b — not yet done |
| Waveform behind code | No | Strudel-style | CodeWaveform overlay (working) | None |
| Track labels in step grid | N/A | Yes | Missing — t148 | t148 open |
| Full-screen visualizer | No | Yes | Not yet | t182 |

### MIDI

| Feature | TidalCycles | Strudel | Score today | Gap |
|---|---|---|---|---|
| MIDI output | Via dirtmidi | Built-in | Not built | Phase 12 — not yet wired to GUI |
| MIDI clock output | Yes | Partial | Not built | Phase 12 |
| MIDI CC control | Via controllers | Built-in | createMidiBridge exists (CLI only) | Phase 12b GUI wiring |
| XDJ hardware integration | No | No | Profiles exist (untested) | Needs hardware verification |
| WebMIDI (browser/Electron) | No | Browser MIDI | Internal WebMIDI types only | Phase 12b GUI |

### Audio I/O

| Feature | TidalCycles | Strudel | Score today | Gap |
|---|---|---|---|---|
| Web Audio / browser | No | Yes | Yes | None |
| Node.js audio (polyfill) | No | No | Yes (node-web-audio-api) | None |
| ASIO / low latency Windows | No | No | Not implemented | No ASIO support — significant live performance gap |
| JACK (Linux pro audio) | Via scsynth | No | Planned Phase 12c | Not built |
| SuperCollider (scsynth) | Core | Via WebSC (experimental) | Not built | Phase 12c |
| WAV export | No | No | `score export` — works | None |
| Multi-output (sub bus, monitor, backup) | No | No | Mixer architecture supports it | Needs hardware interface |

### Performance safety

| Feature | TidalCycles | Strudel | Score today | Gap |
|---|---|---|---|---|
| Panic button (instant all-stop) | `hush` command | `silence` | Stop button (not instant) | t157 — no dedicated panic key |
| Undo last eval | Via editor undo | No dedicated | Editor undo only (no Song undo) | t157 — not on roadmap |
| Scenes / snapshots | No | No | Not built | Not on roadmap |
| Keep-last-good | Yes | Yes | Yes | None |
| Hard brick-wall limiter | Via scsynth | No | Built — Phase 7 | None |
| CPU monitor | Via terminal | Not built | Not built | t171 (feature log) — Phase 13 |

---

## 6. Other Modes — Gap Analysis

### Current state

The four modes (Live Code, Produce, DJ Set, Jam Session) are **stub shells** in the GUI. Only Live Code has a functional implementation. The other three display placeholder content.

### What the unified performance vision requires

The unified performance model (ADR 006, design-principles.md) establishes:
1. Modes are panel layout presets, not isolated systems
2. The engine is shared — no separate runtime per mode
3. A DJ deck is a Song engine running in a lane, or an audio buffer — both feed a GainNode equally
4. Code is always the source of truth — the file is the performance artifact
5. Switching modes does not restart the engine

This is a significant architectural clarification the original roadmap did not state explicitly. It has implications:

**Mode = panel layout preset (not a separate codebase):**
The current stub approach (4 separate mode shells each rendering placeholder divs) should eventually be replaced by a workspace + panel system where mode selection loads a panel layout preset. This is tracked in t177 but is not yet formalised as a roadmap phase.

### Produce mode gap

| Required | Plan | Gap |
|---|---|---|
| Code tracks on shared timeline | Phase 13b+ | No timeline component |
| Sample clips (drag-and-drop) | Phase 13b+ | No clip editor (Phase 13c) |
| Automation lanes | Phase 13d | Not built |
| Arrangement editor | Phase 13b+ | No component |
| Mixer panel (shared with Live Code) | Shares engine | Stub |

Original roadmap did not clearly separate "Produce as layout preset" from "Produce as separate DAW mode." The new understanding is that Produce = Live Code panels + clip timeline panel + automation panel. This is not tracked as a specific task.

### DJ Set mode gap

| Required | Plan | Gap |
|---|---|---|
| Code Deck (Song engine in a lane) | Phase 12e | No deck abstraction built |
| Sample Deck (audio file player) | Phase 12e | Not built |
| Crossfader (GainNode pair) | Phase 12e | Not built |
| Per-deck EQ (Hi/Mid/Lo) | Phase 12e | Not built |
| Auto-BPM detection | Phase 12e | Not built |
| Musical key detection | Phase 12e | Not built |
| Hot cues + loop points | Phase 12e | Not built |
| Crate management | Phase 12e | Not built |
| Two-deck BPM sync | Phase 12e | Not built |
| Set recording to WAV | Phase 12e | Not built |
| `.ts` set file format | Phase 12e | `DJSet`, `CodeDeck`, `SampleDeck` factories not built |
| XDJ-RX3 / XDJ-XZ wiring to GUI | Phase 12 | Profiles exist (untested); no GUI wiring |

**Roadmap gap flagged:** The `.ts` set file format (`DJSet`, `CodeDeck`, `SampleDeck` from `@score/dj`) is not in the current package list. This requires a new `@score/dj` package or extensions to `@score/dsl`. Not tracked as a specific task.

### Jam Session mode gap

| Required | Plan | Gap |
|---|---|---|
| MIDI controller wiring to GUI | Phase 12b | createMidiBridge exists; GUI wiring not done |
| Live parameter control via MIDI CC | Phase 12b | Not wired |
| Punchcard step-toggle → code | Phase 12b | codePatcher ready; wiring not done |
| BPM slider → code | Phase 12b | codePatcher ready; wiring not done |
| Session recording | Phase 12b | Not built |
| Collaborative (multi-user) jam | Phase 12b | ws WebSocket server not built |

The `createJamSession` factory in `@score/session` has 22 passing tests but is not yet wired to the GUI Jam Session mode.

### What the original roadmap missed

1. **Modes as layout presets** — the original roadmap treated each mode as a separate screen. The new unified model (ADR 006) requires a workspace/panel system as the foundation, not four separate mode implementations. This needs to be a roadmap phase.
2. **`@score/dj` package** — the DJ Set format requires new DSL factories (DJSet, CodeDeck, SampleDeck) not in the current package plan.
3. **Algorave full-screen mode** — not in original roadmap. Tracked as t182 but has no phase assignment.
4. **Multiple independent pattern streams** — TidalCycles' `d1/d2/d3` model. Not in roadmap. High value for live coding.
5. **Panel layout persistence** — panels reset on restart. Not in roadmap.

---

## 7. Infrastructure Gaps

### CI/CD

| Item | Status | Notes |
|---|---|---|
| GitHub Actions pipeline | Working | typecheck → lint → test → coverage on every push and PR |
| Coverage thresholds | Development: 80%/70%/80%/80% | Release targets: 90%/85%/90%/90% — not yet enforced |
| GUI tests in CI | Open — t134 | Electron E2E (Playwright) not configured. GUI passes typecheck and unit tests only. |
| MCP server tests | None | MCP servers (mcp-servers/) have no test suite and are not gated by CI (per ADR 004). Known gap. |
| Branch protection | main and dev protected | PRs only, enforced on admins |

### Distribution — how does a tester install this?

**Current answer:** Clone the repo, run `pnpm install && pnpm build && pnpm start`.

| Problem | Status |
|---|---|
| No installer or release binary | Not built — Phase 16 |
| Requires Node.js 20+ and pnpm installed | Prerequisite burden for non-dev testers |
| No auto-update mechanism | Not built |
| No GitHub Release with downloadable artifact | Not built |
| No branded installer (.exe / .dmg / AppImage) | Phase 16 |

For the tester release next week, the install story is "clone + build." This is acceptable for a technical tester audience but needs to be documented clearly in the onboarding doc (already written — docs/design/tester-onboarding.md).

### Sample library

| Item | Status | Notes |
|---|---|---|
| CC0 sample pack | Not built | t179 — first-run downloader planned |
| samples/ directory | Gitignored (by design) | .gitkeep + README.md only |
| Sample() factory with path resolution | Built | Can load from disk path |
| Default samples for STARTER template | None | STARTER uses synthesis only (good — by design) |

The STARTER template is synthesis-only, which is correct. The first-run downloader (t179) is a nice-to-have that would unlock sample-based songs for testers without bundling audio in the repo.

### ASIO / low latency audio on Windows

**Current status: Not implemented. No plan in current roadmap.**

Web Audio API on Windows has higher latency than ASIO (typically 20–100ms vs 1–5ms). For live performance, ASIO is expected by professional users on Windows. The SuperCollider backend (Phase 12c) would address this on Windows via ASIO through JACK or WASAPI. Until Phase 12c is built, Windows users are on Web Audio latency.

This is a significant gap for live performance use cases. It is not tracked as a specific task separate from Phase 12c.

### npm publish scope

`@score/*` scope is taken on npm. All packages must publish under a different scope.

| Decision | Status |
|---|---|
| Scope: `@bwyard/*` | Confirmed (t135, t141) |
| Internal monorepo imports stay as `@score/*` | Confirmed — rename only affects publish |
| Tasks t135 and t141 are open | Not done |
| SCORE_HANDOFF.md also mentions `@score-music/*` | **Conflict** — HANDOFF says `@score-music/*`, todos say `@bwyard/*`. Needs resolution before publish. |

This is a naming conflict that will cause confusion at publish time. Must be resolved before v0.1.0.

### Web / browser version

**Current status: Not planned as a separate deliverable.**

Score Studio is Electron-only. The framework packages use `node-web-audio-api` for CLI, and Web Audio API for the Electron GUI. A pure browser version is not in the roadmap. Strudel is the browser-native equivalent; Score's differentiator is the full desktop application + SuperCollider backend.

This is not a gap — it is a deliberate scope decision. Worth noting in tester docs so testers don't expect a URL to visit.

### SuperCollider backend (Phase 12c)

**Current status: Not started. Zero code written.**

Required for:
- Festival-quality audio (real-time OS priority, < 3ms latency)
- JACK audio routing on Linux
- Advanced synthesis (physical modelling, granular — Phase 12d)
- Live performance debut (Phase 14 requires 12c)

Blocked by: requires `backends/supercollider/` package (not yet in packages/), SCSynthManager, OSCBridge, and full SynthDef library for every existing BackendNode type. This is a large Phase.

---

## 8. Ecosystem Dependencies

### @prime/prime-random — PRNG for Score

**Current state:** `@prime/prime-random` is listed in SCORE_HANDOFF.md (Section 2 readme note: commit 16b2548). It is the seeded PRNG library from the Prime project.

**Integration status:** Not wired. `@score/pattern` currently uses `Math.random()` (unseeded) in `degrade`, `humanize`, and `drunk`. This means:
- Songs are **not reproducible** — the same code with the same seed produces different output each run
- This violates the thesis: "song is a pure function of time"

**What's missing:**
- Wire `@prime/prime-random` into `@score/pattern` as the PRNG source (t187)
- Add `seed?: number` prop to `Song()` DSL — defaults to `Date.now()`, logged to console
- Same seed → identical output every time
- t188 documents this dependency in README

**Priority:** High — this is a thesis violation. Determinism is foundational.

### @stage/stage-economy and @stage/stage-time

**Current state:** Not used by Score. No dependency in any package.json.

**Should Score use them?** Based on what is documented:
- `stage-time` might relate to temporal sequencing — Score has its own `@score/sequencer` and Transport
- `stage-economy` is unclear in context

No evidence these packages exist or are published. If they are sister projects under the same monorepo philosophy, their relevance to Score needs a planning discussion. Not a current gap.

### @score/mcp — current tool coverage

**Current state:** `packages/mcp/` is a stub (`export const _stub = true`). The actual MCP tools are in standalone scripts at `mcp-servers/score-codebase/` and `mcp-servers/score-audio/`.

**Current tool coverage:**
- score-codebase: `architecture_rules`, `package_graph`, `api_surface`, `adr_lookup` — working
- score-codebase: `project_status` — known empty stub (confirmed in MCP feedback)
- score-audio: `effect_catalog`, `backend_nodes`, `component_catalog` — working
- score-audio: `signal_flow` — working but omits effects chain (known gap from MCP feedback)

**What's missing for Phase 13f Monaco IntelliSense:**
The SCORE_HANDOFF.md Phase 10b3 lists the following tools needed for Monaco:
- `dsl_completions` — Score DSL component APIs (Kick/Snare/Synth/Sample props, defaults, types, valid ranges)
- `dsl_diagnostics_schema` — errors the DSL AST validator can produce, for Monaco error markers
- `ui_ipc_map` — all typed IPC channels with which component triggers or listens
- `ui_component_catalog` — every React component with props interface and which mode it belongs to

None of these exist yet. Phase 13f Monaco requires these tools to be built first. This means Monaco implementation (t154) is blocked by an MCP build step that is not on any agent's current track.

### Form project relationship to Score

**Current state:** No relationship. No imports, no shared packages, no dependency in any Score package.json.

Score is a standalone audio framework. Form is a separate project in the development root. If Form introduces shared types or patterns useful to Score, that would require a planning decision. No current gap.

---

## 9. Technical Debt

### Known issues and shortcuts

| Issue | Where | Severity | Tracked |
|---|---|---|---|
| Generic Kick/Snare/HiHat stubs in @score/components | packages/components/src/ | High — genre-accuracy is a differentiator | t160–t163 |
| Monaco textarea is current editor | packages/gui/src/renderer/modes/LiveCode/ | Medium — textarea works; IDE feel absent | t154 |
| Panel layout not persisted across restarts | @score/gui | Medium — testers will notice | Not tracked as separate task |
| t147: punchcard cursor animation — needs live verification | PunchcardGrid | High — pre-release blocker | t147 open |
| t148: punchcard colour legend missing | PunchcardGrid | Medium — UX confusion | t148 open |
| t158: non-Live-Code modes not greyed out | Splash screen | High — pre-release blocker | t158 open |
| @prime/prime-random not wired — Math.random() in degrade/humanize/drunk | @score/pattern | High — thesis violation | t187 open |
| npm scope conflict (@score vs @score-music vs @bwyard) | All packages | High — publish blocker | t135, t141 open |
| MCP project_status tool is empty stub | mcp-servers/score-codebase/ | Medium — MCP feedback noted | t014 open |
| MCP signal_flow omits effects chain | mcp-servers/score-audio/ | Low — known gap | MCP feedback noted |
| XDJ hardware profiles not verified | @score/midi | Medium — spec-derived only | Not tracked |
| No ASIO support on Windows | @score/core | High — live performance use | Not separately tracked |
| E2E tests (Playwright) not set up | @score/gui | Medium — no end-to-end coverage | t134 open |
| MCP servers have no test suite | mcp-servers/ | Medium — unverified tools | Not tracked |
| t133: Electron Windows error popup not replaced with in-app overlay | @score/gui | High — bad UX | t133 open |
| t142: Custom title bar not implemented | @score/gui | Low — uses default Electron chrome | t142 open |
| Sax and Theremin instruments — experimental, not genre-relevant | @score/components | Low | Acknowledged in docs |
| MIDI bridge Traktor S and Serato stubs marked "look-into" | @score/midi | Low — profile names unknown | Not tracked |
| Multiple open worktree-agent branches — may be abandoned stale state | Git | Low | Manual cleanup needed |

### Functional programming violations

A wave of FP violations was fixed in s008 (t091–t121). The FP audit appears complete for the packages audited. Watch for:
- Any new `let` declarations in framework code
- `push()` / `splice()` on arrays in package code
- `class` keywords anywhere

These are non-negotiable per CLAUDE.md and ADR 001.

---

## 10. Tester Release Readiness (next week — target 2026-03-29)

### Blockers — must be fixed before release

| Task | Issue | Fix | Priority |
|---|---|---|---|
| t158 | Splash shows all 4 modes selectable; only Live Code is ready | Grey out + `cursor: not-allowed` on Produce/DJ Set/Jam | CRITICAL |
| t147 | Punchcard cursor animation — commit b8ddc59 claims fixed but must be verified live | Play a song, confirm cursor advances step-by-step, wraps at bar end | CRITICAL |

### High priority — do before release

| Task | Issue |
|---|---|
| t148 | Add track name labels to punchcard colour strip |
| PR #33 | Merge feat/phase-11b-live-code-visualizer to dev |
| Smoke test | Full 10-step demo script from demo-readiness.md |
| t133 | Replace Electron Windows exception popup with in-app overlay (high UX risk on Windows) |

### Known gaps to document in tester onboarding

The tester-onboarding.md already covers most of these. Verify they are listed:
- Produce / DJ Set / Jam modes — disabled stubs
- Monaco IDE — textarea for now, IntelliSense coming
- 808/909 accurate drums — generic stubs only
- TB-303, FM synth (Rhodes) — not built
- Panel layout persistence — resets on restart
- MIDI input — Phase 12b
- SuperCollider backend — Phase 12c
- No ASIO on Windows — Web Audio latency only
- No browser/web version — Electron desktop only

### What testers will definitely ask about

1. "The kick doesn't sound like an 808" — expected, documented
2. "Where's the Monaco editor?" — expected, documented
3. "Can I save my layout?" — not supported, will surprise testers
4. "Why can't I use Produce mode?" — expected, must be obviously disabled (t158)
5. "Is there MIDI?" — not in this release
6. "Does it work in the browser?" — no, Electron only
7. "The punchcard doesn't move" — t147, must be verified and fixed
8. "What do the colours mean?" — t148, must be labelled
9. Crash recovery — t133 Electron popup will appear on Windows errors; jarring

### Install flow to test

```bash
git clone <repo-url> score && cd score
pnpm install && pnpm build
pnpm start
```

Risk: `pnpm build` requires Node.js 20+ and correct pnpm version. No installer. This install path has not been tested from a clean machine. Should be validated before release.

---

## 11. Missing Todos / Untracked Work

The following gaps came up in this analysis that are not currently tracked as open todos:

| Item | Priority | Notes |
|---|---|---|
| Multiple independent pattern streams (d1/d2/d3 TidalCycles style) | High | Not in roadmap, not tracked. Critical for algorave parity. |
| Panel layout persistence across restarts | Medium | Tracked nowhere. testers will ask. |
| `@score/dj` package — DJSet, CodeDeck, SampleDeck factories | High | Required for DJ Set mode. Not in package list. Not tracked. |
| Algorave full-screen mode | High | t182 tracked but has no phase assignment. Needs a home in roadmap. |
| Workspace / panel-preset system as foundation | High | t177 tracked but not a roadmap phase. The unified model requires this before mode shells. |
| Resolve @score/* vs @score-music/* vs @bwyard/* naming conflict | Critical | HANDOFF says @score-music/*, todos say @bwyard/*. Must resolve before publish. |
| ASIO / low-latency audio on Windows (separate from Phase 12c) | Medium | Should be flagged as a known limitation, not just buried in Phase 12c notes. |
| MCP server test suite | Medium | MCP tools are unverified. No tests. Not gated by CI. |
| Clean up abandoned worktree-agent branches | Low | Git hygiene. Multiple stale worktree-agent/* branches. |
| E2E smoke test for install flow (clean machine) | High | Install path not verified from zero. Pre-release risk. |
| Clap909 instrument | Medium | Spec documents it (burst-gated noise, 3–4 layers) but no todo tracks it. |
| GUI auto-eval on save (not just Ctrl+Enter) | Low | TidalCycles/Strudel pattern. Missing from feature list. |
| Pattern undo / eval history | Medium | t157 mentions it under live coding gap list but no dedicated task. |
| Panic key binding (all-stop) | High | t157 mentions it but no dedicated task. Pre-release performance safety gap. |

---

## 12. Recommended Priority Order

### (a) Tester release — next week

1. **t158** — Grey out non-Live-Code modes on splash. One-line CSS change. Must ship.
2. **t147** — Verify punchcard cursor animation live. If broken: fix engine:step IPC flow.
3. **t148** — Add track name labels to punchcard. Two hours of work.
4. **Merge PR #33** — All Phase 12a work is on this branch. Merge to dev.
5. **t133** — Replace Electron Windows error popup with in-app overlay. High UX risk.
6. **Smoke test** — Full 10-step demo script from docs/design/demo-readiness.md. Verify on Windows.
7. **Document panel layout reset** — Add to tester-onboarding.md Known Gaps list.

### (b) v0.1.0 beta

These must be done before calling anything a beta:

1. **t158 / t147 / t148** (from above — gate to release)
2. **Synthesis instrument library** — createKick808 (t160), createKick909 (t161), createSnare909 (t162), createHihat808 (t163), createSubtractiveSynth (t164). The generic stubs embarrass the platform.
3. **t187 — @prime/prime-random wiring** — determinism is a thesis claim. Cannot call it beta without it.
4. **t154 — Monaco editor** — Phase 13f. The textarea is a placeholder; Monaco is the promised experience.
5. **t135 / t141 — Resolve npm scope naming** — must be resolved before any publish.
6. **Panel layout persistence** — add to roadmap, implement before beta.
7. **t133 — in-app error overlay** — basic professionalism.
8. **t134 — GUI CI with Playwright** — cannot call it beta with no E2E coverage.
9. **Pre-delay on createReverb (t167)** — deep house is a target genre; the missing pre-delay is documented in the synthesis spec.

### (c) Full Live Code mode completion

To match TidalCycles/Strudel at the live coding use case:

1. **Monaco editor + beat gutter (t154)** — Phase 13f foundation
2. **MCP DSL tools** — `dsl_completions`, `dsl_diagnostics_schema` for Monaco IntelliSense
3. **Algorave full-screen mode (t182)** — assign to a phase, implement
4. **Inline gutter widgets (t183)** — per-instrument live feedback in Monaco margin
5. **Multiple independent pattern streams** — d1/d2/d3 style — add to roadmap, plan the architecture
6. **Panic key binding** — performance safety
7. **Pattern undo / eval history** — live coding safety net
8. **@prime/prime-random wiring (t187)** — reproducible songs
9. **createFMSynth (t165) + createBass303 (t166)** — synthesis depth to match SuperDirt
10. **SuperCollider backend (Phase 12c)** — required for live performance debut
11. **MIDI out** — sync with external gear in algorave context

---

*Gap analysis complete. All sections based on direct reading of SCORE_HANDOFF.md, CLAUDE.md, ADRs 001–010, design docs (demo-readiness, synthesis-spec, package-graph, tester-onboarding, wireframes), current.md session state, and open todos from todos.json. Git log confirms 1341 tests and Phase 12a deliverables on feat/phase-11b-live-code-visualizer.*
