<!-- docs/design/refactor-audit.md -->
<!-- Codebase audit for refactor/engine-instrument-registry -->
<!-- W2 Session audit — 2026-03-29 -->

# Refactor Audit — Engine / Chain / CodePatcher

**Branch:** `refactor/engine-instrument-registry`
**Scope:** Pre-refactor audit of four god-object files before any code changes.
**Task B (writing code) is blocked on coord ACK of this document.**

---

## Files Audited

| File | Lines | Concerns |
|------|-------|----------|
| `packages/cli/src/engine.ts` | 1157 | 8 |
| `packages/dsl/src/chain.ts` | 629 | 3 |
| `packages/gui/src/renderer/lib/codePatcher.ts` | 447 | 2 |
| `packages/dsl/src/types.ts` | 397 | 2 |

---

## 1. `packages/cli/src/engine.ts` — 1157 lines

### Concerns

**Concern 1 — Instrument dispatch switch (lines 601–1018)**
Single `switch (comp.instrumentType)` with 14 cases across 418 lines. Every new instrument adds a case. Every new chain field (pan, pitch, octave, glide, etc.) must be threaded into all 14 cases manually. This is the primary scaling problem: after PRs #88, #91, #92, #93, the switch is already ~40% of the file.

**Concern 2 — Inline type casts per case (lines 604, 633, 653, 672, 683, 702, 722, 742, 782, 800, 821, 838, 856, 883, 911, 937, 965, 986)**
Each case casts `comp.props` to a different union type with optional extras (`& { pitchOffset?: number; octave?: number; scale?: ... }`) duplicated across all melodic cases. These casts encode the same knowledge in 14 places instead of once.

**Concern 3 — `seqExtras` and `seqPatternExtras` called at every case (lines 609, 616, 625, 638, 645, 658, 665, 675, 693, 750, 792, 813, 830, 848, 865, 892, 920, 946, 969, 995)**
Pattern extras and timing extras are threaded via spread at every `createStepSequencer` call. Same boilerplate, 21 times. Moving to a normalized props object would eliminate the spread boilerplate completely.

**Concern 4 — `partToInstrumentDescriptor` is a multi-concern function (lines 177–255)**
Does five things in one function: (a) validates `_pattern` vs function pattern; (b) applies `_phase`/`_repeat`/`_applyFn`; (c) applies `_mapNotesFn`; (d) maps `_volume` to either `gain` or `volume` based on MELODIC_INSTRUMENT_TYPES lookup; (e) maps all 20+ chain fields to `props`. This is a normalization layer, not a single responsibility.

**Concern 5 — `MELODIC_INSTRUMENT_TYPES` and `PERCUSSION_TYPES` are naked Sets (lines 119–127)**
These sets encode instrument classification in plain JS. They are not tied to the type system — adding a new instrument type to the `instrumentType` union requires manually remembering to update both sets. The registry refactor centralises this.

**Concern 6 — `applyPitchTransforms` duplicated across 9 melodic cases**
Every melodic step callback reads: `const baseFreq = resolveFreq(val)` → `applyPitchTransforms(baseFreq, props)`. The helper exists (lines 148–155) but props are re-cast differently per case. A normalized props object would make this a single call at the registry entry point.

**Concern 7 — `noteDur` calculation duplicated across 6 melodic cases (lines 863–864, 890–891, 918–919, 944–945, 993–994)**
Each melodic case computes: `const noteDur = props.dur ?? (attack + decay + release + 0.02)` with slightly different ADSR field names. This belongs in a normalizer, not 6 case bodies.

**Concern 8 — Mutable `arpState` object in switch body (lines 747)**
The arp case creates `const arpState = { noteIndex: 0, pingDir: 1 }` — a `const` binding with mutable values. This is the hardware-boundary exception for sequential step state, but it is currently buried inside the switch with no boundary annotation. It should be explicit.

### Thesis violations

| Violation | Location | Severity |
|-----------|----------|----------|
| `const arpState = { noteIndex: 0, pingDir: 1 }` — mutable const object (two fields mutated inside sequencer callback) | line 747 | Hardware boundary — annotated as exception but annotation is informal |
| `stepCallbacks.push(callback)` — Array mutation (line 1090) | line 1090 | Hardware boundary — mutation for IPC callbacks, acceptable at engine layer |
| None — no `let`, no classes | — | Compliant |

### Cross-cutting dependencies

- Imports from: `@score/core`, `@score/components`, `@score/mixer`, `@score/effects` (15 effect factories), `@score/sequencer`, `@score/dsl`, `@score/pattern`
- All instrument factories live in `@score/components` — the switch dispatches to them
- All effect factories live in `@score/effects` — the `hydrateEffect` switch dispatches to them
- `partToInstrumentDescriptor` is exported and used by `renderer.ts` (offline render)
- `muteEnvelope` is exported and tested independently (pure function)
- `isInstrumentDescriptor` / `isPartDescriptor` are exported type guards used by GUI main process

---

## 2. `packages/dsl/src/chain.ts` — 629 lines

### Concerns

**Concern 1 — No sub-types defined here (yet)**
The assignment notes `chain.ts — all chain methods + sub-types + part logic`. Currently, `chain.ts` contains only `createPart`, `ChainablePart`, `PartDescriptor`, `ChainMethods<T>`, `defineInstrument`, and three small helpers. Sub-types (`Bass303Part`, `SubSynthPart`, `FMSynthPart`) are referenced in signals but **do not yet exist in this file**. The refactor will add them here before extracting to `@score/instruments`.

**Concern 2 — `wrap` parameter in `createPart` (lines 411–432)**
The `wrap: (p: ChainablePart) => ChainablePart = (p) => p` pattern exists to support sub-type chaining (so `Bass303Part.volume()` returns a `Bass303Part`, not a plain `ChainablePart`). This is the right design but it is currently a private convention with no documented contract. The `extendPart()` utility will formalise this.

**Concern 3 — `PartDescriptor.props` dual-role field (line 139)**
`props: Record<string, unknown>` is used both as (a) legacy compatibility for `InstrumentDescriptor`-style instruments and (b) engine-side hydration. During `partToInstrumentDescriptor`, all `_`-prefixed fields are re-mapped into `props`. This dual-role makes it unclear which fields are "chain state" vs "legacy compatibility". The `SongContext` type will formalize the boundary.

### Thesis violations

None. Zero `let`, zero classes, all factory functions, all const arrow functions. The `invert`, `palindrome`, `stutter` methods use `Array.isArray` guards — correct.

### Cross-cutting dependencies

- Imports: `@score/core` (uid, ScoreError, AudioComponent, BackendNode), `@score/pattern` (euclidean, fast, slow, rev, shift, PatternInput), `./modulation.ts`
- Exported from `@score/dsl/src/index.ts`
- Consumed by: `engine.ts` (reads all `_`-prefixed descriptor fields), GUI `codePatcher.ts` (reads `_name`), `instruments.ts` (sub-type factories use `createPart`)

---

## 3. `packages/gui/src/renderer/lib/codePatcher.ts` — 447 lines

### Concerns

**Concern 1 — Growing multi-concern module**
Currently contains 10 exported functions across three distinct concerns:
1. **Track location** (`findTrackPositions`, `trackSlice`) — internal position helpers
2. **Read operations** (`parseTrackModel`, `parseTrackChainParams`, `parseMuteState`) — read DSL state
3. **Write operations** (`patchBpm`, `patchTrackPattern`, `patchTrackVolume`, `patchTrackNote`, `patchChainMethod`, `patchMute`, `patchAddInstrument`, `patchInstrumentModel`) — write DSL state

This is currently manageable (447 lines) but will grow as bidirectional sync adds more patch targets (filter, reverb, swing, etc.). The audit notes this as a future split point, not a current blocker.

**Concern 2 — Regex-based approach limitations**
All operations use string/regex matching, not AST. This is intentional (no deps, no compile step) per the code comment. The limitation: methods that take multiple arguments (`.reverb(0.3, { decay: 2 })`, `.delay('1/8d', 0.5)`) cannot be reliably patched with a simple `new RegExp`. `patchChainMethod` currently only handles single scalar values. This will need extension for the instrument panel sliders.

### Thesis violations

`uniqueVarName` contains `for (let n = 2; n < 20; n++)` — **`let` violation** at line 338. This is a thesis violation in a non-React, non-hardware-boundary context. The loop should use a recursive const arrow function.

### Cross-cutting dependencies

- Pure module — no imports from `@score` packages
- Consumed by: `LiveCode/index.tsx` (all patch operations), `InstrumentPanel` (via `patchChainMethod`, `parseTrackChainParams`)
- No test coverage for `patchAddInstrument`, `patchMute`, `parseMuteState`, `patchInstrumentModel` (added in PRs #89/#94)

---

## 4. `packages/dsl/src/types.ts` — 397 lines

### Concerns

**Concern 1 — `InstrumentDescriptor.instrumentType` hardcoded union (line 275)**
```ts
readonly instrumentType: 'kick' | 'snare' | 'hihat' | 'synth' | 'sample' | 'theremin' | 'sax' | 'arp' | 'kick808' | 'kick909' | 'hihat808' | 'snare909' | 'subsynth' | 'fmsynth' | 'pad' | 'rhodes' | 'pluck' | 'bass-303'
```
14 string literals on one line. Every new instrument requires touching this union. After `@score/instruments` is created, this union should be derived from `keyof typeof INSTRUMENT_REGISTRY` so the type system and the registry stay in sync.

**Concern 2 — `InstrumentDescriptor.props` union is wide (line 276)**
```ts
readonly props: KickProps | SnareProps | HiHatProps | SynthDSLProps | SampleProps | ThereminDSLProps | SaxDSLProps | ArpDSLProps | Kick808DSLProps | Kick909DSLProps | Hihat808DSLProps | Snare909DSLProps | SubSynthDSLProps | FMSynthDSLProps
```
The union has 14 members and every engine case casts it. After the registry lands, each instrument's factory will carry its own props type — the union becomes unnecessary.

### Thesis violations

None. Pure type file — no runtime code.

### Cross-cutting dependencies

- All prop types (`KickProps`, `SynthDSLProps`, etc.) are imported and used in `engine.ts` for case-level casts
- `SongDefinition`, `SongProps`, `TrackComponent`, `InstrumentDescriptor`, `SectionDefinition` exported from `@score/dsl` and consumed widely
- `PartDescriptor` imported by `engine.ts` for `isPartDescriptor` type guard

---

## Summary

### God-object ranking (highest → lowest priority)

1. **`engine.ts` instrument switch (lines 601–1018)** — highest priority. 418-line switch, 14 cases, every new instrument/chain-field touch here. Refactor to INSTRUMENT_REGISTRY is the highest-leverage change.
2. **`types.ts` `instrumentType` union + `props` union** — second priority. Type-level mirror of the switch problem. Derived from registry after refactor.
3. **`engine.ts` `partToInstrumentDescriptor`** — medium priority. Multi-concern normalization. Should split into: `normalizeVolumeField`, `normalizePatternTransforms`, `normalizeNoteTransforms`, and a thin assembler.
4. **`codePatcher.ts` `let` violation** — low priority. One-line fix. Should land in a cleanup PR.
5. **`chain.ts` `wrap` convention** — documented by `extendPart()` utility. No code change needed in `chain.ts` itself beyond adding sub-type definitions.

---

## `@score/instruments` Package Structure — Full Roadmap Grouping

The package must accommodate the full planned instrument set (~29 instruments), not just the current 14. Every new instrument should drop into an existing category file with no structural change.

Grouping is by **synthesis paradigm + trigger model** — the two axes that determine what normalization + dispatch code instruments share.

```
packages/instruments/src/

  drums/
    kick.ts         ← kick · kick808 · kick909 · kickHardstyle* · kickHardcore*
                      All: volume, pattern, .trigger(time). Grouped because they are all
                      "kick = pitched body + decay". Model-specific props in each factory.
    snare.ts        ← snare · snare909 · clap909* · rimshot*
                      All: noise-based transient, no sustained pitch, pattern.
    cymbal.ts       ← hihat · hihat808 · cowbell808*
                      All: metallic oscillator or noise, short decay, pattern.
    perc.ts         ← conga* · bongo* · tabla* (Afrotech, ethnic percussion — future)
    index.ts

  synths/
    subtractive.ts  ← synth · subsynth · pad · supersaw* · reese*
                      All: osc(s) → filter → ADSR VCA. Shared props: wave, filter, adsr.
                      supersaw adds N-osc detuning. reese = SubSynth + sub oscillator.
    fm.ts           ← fmsynth · rhodes · dxBell* · organFM*
                      All: carrier + modulator(s), modRatio, modIndex, ampAdsr, modAdsr.
    physical.ts     ← pluck · string* · marimba*
                      Physical modeling. No noteOff (natural decay) or resonator model.
    acid.ts         ← bass-303 · (future 303-family voices)
                      Unique: MEG/VEG, cutoff/resonance/envDepth, glide → slideTime mapping.
    wavetable.ts    ← wavetable* (single-cycle waveform + morphing — future)
    granular.ts     ← granular* · granularSampler* (Phase 12d-4)
    index.ts

  melodic/
    continuous.ts   ← theremin · sax · flute* · strings* · choir*
                      Persistent audio graph from boot. theremin: no steps, sustains.
                      sax + others: start() + per-step setFrequency + trigger.
    sequenced.ts    ← arp · wobbleBass* (LFO-on-filter sequencing)
                      Internal state machines. arp: noteIndex cycling → triggerSynth.
    index.ts

  sample/
    sample.ts       ← sample (file I/O + pre-decoded buffer + createSamplePlayer)

  shared/
    pitch.ts        ← applyPitchTransforms · snapFreqToScale  (extracted from engine.ts)
    volume.ts       ← normalizeVolumeField  (gain vs volume routing by instrument type)
    voice.ts        ← createMelodicVoiceDispatch  (shared Model C dispatch pattern)
                      Wraps: resolveFreq → applyPitchTransforms → computeNoteDur → noteOn/noteOff
                      Used by: subtractive, fm, physical, acid (all 7 current melodic-voice instruments)
    index.ts

  index.ts          ← INSTRUMENT_REGISTRY — const map of all registered instruments
```

`*` = planned, not yet built. Files exist now; new instruments are added to their existing file.

### Why this grouping

| Category | Shared code | What scales naturally |
|----------|-------------|----------------------|
| `drums/kick.ts` | `.trigger(time)`, volume/pattern normalization | kickHardstyle, kickHardcore drop in |
| `drums/snare.ts` | Same trigger model, noise-based props | clap909, rimshot drop in |
| `drums/cymbal.ts` | Metallic oscillator dispatch | cowbell808 drops in |
| `synths/subtractive.ts` | `createMelodicVoiceDispatch` + osc/filter/ADSR props | supersaw, reese drop in |
| `synths/fm.ts` | `createMelodicVoiceDispatch` + modRatio/modIndex props | dxBell, organFM drop in |
| `synths/physical.ts` | `createMelodicVoiceDispatch`, no noteOff | string, marimba drop in |
| `synths/acid.ts` | Unique MEG/VEG normalization | Isolated — no leakage |
| `melodic/continuous.ts` | boot start(), setFrequency per step | flute, strings, choir drop in |
| `sample/sample.ts` | Pre-decode path | granularSampler extends this |

### Key shared helper — `shared/voice.ts`

All 7 melodic-voice instruments (subtractive, fm, physical, acid) share the same dispatch loop:

```ts
// For every active step:
const freq = applyPitchTransforms(resolveFreq(val), props)
if (freq <= 0) return
const voice = createVoice(ctx, freq, props)
voice.connect(dest)
voice.noteOn(pos.time)
voice.noteOff?.(pos.time + computeNoteDur(props))
```

`createMelodicVoiceDispatch` takes a `createVoice` factory and returns this wired dispatch. Each melodic instrument becomes ~5 lines of props extraction + one `createMelodicVoiceDispatch` call. All future melodic instruments (supersaw, reese, wavetable, granular) get this for free.

---

## Proposed PR Breakdown

### PR 1 — `@score/instruments` package + INSTRUMENT_REGISTRY

**Scope:**
- Create `packages/instruments/` with `package.json`, `tsconfig`, `src/index.ts`
- `INSTRUMENT_REGISTRY`: `const INSTRUMENT_REGISTRY = Object.freeze({ kick: createKickFactory, snare: createSnareFactory, ... })` — one entry per instrument type
- `EFFECTS_REGISTRY`: same pattern for effects, replacing `hydrateEffect` switch
- Move instrument sub-type helpers (`makeBass303Part`, etc.) from `chain.ts` to `@score/instruments`
- `SongContext` type in `@score/core`: `{ bpm: number; seed: number; bars: number; timeSignature: [number, number] }`
- Update `InstrumentDescriptor.instrumentType` to `keyof typeof INSTRUMENT_REGISTRY`
- **No audio behaviour changes** — pure structural lift

**Tests:** INSTRUMENT_REGISTRY has all 14 keys; each factory produces a valid AudioComponent; EFFECTS_REGISTRY has all 15 effect keys.

**Size estimate:** ~200 new lines + ~150 deleted from engine.ts. Net: -150 lines from engine.ts.

---

### PR 2 — Engine switch replacement

**Scope:**
- Replace `switch (comp.instrumentType)` in `engine.ts` with `INSTRUMENT_REGISTRY[comp.instrumentType]?.(ctx, props, dest, transport, song.seed)`
- Centralise `normalizeInstrumentProps()`: single pass applying pitchOffset/octave/scale/dur/seed/pan → removes per-case prop casts
- Add unknown instrument guard: default case throws `createScoreError('Unknown instrument type: ' + instrumentType)`
- `partToInstrumentDescriptor` splits into: `normalizeVolumeField`, `normalizePatternTransforms`, `normalizeNoteTransforms`, thin assembler
- Thread `SongContext` as single param through `normalizeInstrumentProps`, `createStepSequencer` call sites, `_applyFn`/`_mapNotesFn` callbacks
- Annotate `arpState` mutation as `// HARDWARE BOUNDARY: mutable step counter`

**Tests:** engine-dispatch.test.ts — one test per instrument type to confirm registry dispatch reaches the factory.

**Size estimate:** engine.ts drops from 1157 → ~650 lines (-500 lines via registry dispatch + normalization consolidation).

---

### PR 3 — `extendPart()` + `createPart` extension threading

**Scope:**
- `createPart` gains optional `buildExtensions` param (replaces `wrap`) — cleaner API, same semantics
- `extendPart(instrumentType, extensions)` utility in `@score/dsl` — thin wrapper over `createPart` enabling `Kick().breesMethod()` style custom aliases
- Extensions compose cleanly via spread, no `Object.assign`
- Document the extension contract in TSDoc
- **No audio behaviour changes**

**Tests:** `defineInstrument` + `extendPart` roundtrip — custom method preserved through `.volume()`.

**Size estimate:** ~80 new lines in `chain.ts` + `@score/instruments` sub-type definitions.

---

### PR 4 (small, cleanup) — CodePatcher `let` fix + missing tests

**Scope:**
- Fix `let n = 2` in `uniqueVarName` — replace with recursive const arrow
- Add tests for `patchAddInstrument`, `patchMute`, `parseMuteState`, `patchInstrumentModel`

**Size estimate:** ~60 new lines (tests), 5-line change in `codePatcher.ts`.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Registry dispatch changes audio behaviour | Low | High | No factory logic changes — only dispatch routing changes |
| `InstrumentDescriptor.instrumentType` type breaking | Medium | Medium | Derive from `keyof typeof INSTRUMENT_REGISTRY` — no manual sync needed |
| `partToInstrumentDescriptor` split breaks `renderer.ts` | Low | Medium | `renderer.ts` imports the function by name — internal structure is opaque |
| `extendPart` wrap-param rename breaks sub-type consumers | None | Low | Sub-types don't exist yet in chain.ts — no consumers |
| PR 1 lands before PR 2 compiles | Possible | Low | PR 2 depends on PR 1's package existing — merge order matters |

---

## Notes on `@score/musical` and `@score/session`

Per the 03/24 coord signal, these packages must be audited before touching engine:

- **`@score/musical`** — check if wired, stubbed, or dead. Determines whether it belongs in `@score/instruments` or stays separate.
- **`@score/session`** — same audit required.

**This audit is the pre-condition for Task B.** Awaiting coord ACK before writing any code.
