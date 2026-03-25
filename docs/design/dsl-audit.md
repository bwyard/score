# DSL Chain API Audit — @score/dsl

**Date:** 2026-03-24
**Branch:** feat/dsl-chain-audit
**Author:** W3 audit pass

Definitive picture of what the chain API has, what the engine hydrates, and what silently no-ops.

---

## How to read this table

| Column | Meaning |
|---|---|
| **method** | Chain method name as called by the song author |
| **DSL field** | `PartDescriptor` field set by the method |
| **exists in DSL** | Method is defined in `chain.ts` and callable |
| **engine hydrates** | `partToInstrumentDescriptor` (or sequencer) actually uses this field |
| **note** | How the field is resolved — pre-expand / pass-through / unhydrated |

Hydration path: `partToInstrumentDescriptor` in `packages/cli/src/engine.ts:113-137`.

---

## Pattern group

| method | DSL field | exists in DSL | engine hydrates | note |
|---|---|---|---|---|
| `.speed(n)` | `_speed`, `_pattern` | ✅ | ✅ | Pre-expands `_pattern` in DSL — engine gets resolved array |
| `.slow(n)` | `_speed`, `_pattern` | ✅ | ✅ | Pre-expands `_pattern` |
| `.fast(n)` | `_speed`, `_pattern` | ✅ | ✅ | Pre-expands `_pattern` |
| `.rev()` | `_speed`, `_pattern` | ✅ | ✅ | Pre-expands `_pattern` |
| `.halfTime()` | `_speed`, `_pattern` | ✅ | ✅ | Pre-expands `_pattern` |
| `.doubleTime()` | `_speed`, `_pattern` | ✅ | ✅ | Pre-expands `_pattern` |
| `.tripletTime()` | `_speed`, `_pattern` | ✅ | ✅ | Pre-expands `_pattern` |
| `.retrograde()` | `_speed`, `_pattern` | ✅ | ✅ | Alias for `.rev()` — pre-expands |
| `.augment(n?)` | `_speed`, `_pattern` | ✅ | ✅ | Pre-expands `_pattern` via `slow()` |
| `.diminish(n?)` | `_speed`, `_pattern` | ✅ | ✅ | Pre-expands `_pattern` via `fast()` |
| `.euclidean(h, s?)` | `_pattern` | ✅ | ✅ | Pre-computes via `euclidean()` from `@score/pattern` |
| `.shift(n)` | `_pattern` | ✅ | ✅ | Pre-rotates `_pattern` |
| `.invert()` | `_pattern` | ✅ | ✅ | Flips array in place, engine gets result |
| `.palindrome()` | `_palindrome`, `_pattern` | ✅ | ✅ | Pre-expands `_pattern` (arr + reversed arr) |
| `.hits(...args)` | `_pattern` | ✅ | ✅ | Pre-computes step array |
| `.pattern(pat)` | `_pattern`, `_notes` | ✅ | ✅ | Splits pitch+rhythm — both fields set |
| `.repeat(n)` | `_repeat` | ✅ | ❌ | `_repeat` NOT in `partToInstrumentDescriptor` — silent no-op |
| `.mask(pattern)` | `_mask` | ✅ | ❌ | `_mask` NOT hydrated — silent no-op |
| `.stutter(n)` | `_stutter` | ✅ | ❌ | `_stutter` NOT hydrated — silent no-op |
| `.degrade(p)` | `_degrade` | ✅ | ❌ | `_degrade` NOT in `partToInstrumentDescriptor` — silent no-op |
| `.humanize(amt)` | `_humanize` | ✅ | ⚠️ | Passes through as `props.humanize` but `createStepSequencer` only takes `{pattern, steps, seed}` — dead at per-track level |
| `.swing(amount)` | `_swing` | ✅ | ⚠️ | Passes through as `props.swing` but `createStepSequencer` never reads it — dead at per-track level. Global swing via `createTempoMap` is separate |
| `.stepProb(probs)` | `_stepProb` | ✅ | ❌ | `_stepProb` NOT hydrated — silent no-op |
| `.apply(fn)` | `_applyFn` | ✅ | ❌ | `_applyFn` NOT hydrated — silent no-op. Custom pattern transforms are ignored |
| `.every(n, fn)` | `_every` | ✅ | ❌ | `_every` NOT hydrated — silent no-op |
| `.stretch(bars)` | `_stretch` | ✅ | ❌ | `_stretch` NOT hydrated — silent no-op |
| `.phase(amount)` | `_phase` | ✅ | ❌ | `_phase` NOT hydrated — silent no-op |
| `.fromBar(n)` | `_fromBar` | ✅ | ❌ | `_fromBar` NOT hydrated — silent no-op |
| `.untilBar(n)` | `_untilBar` | ✅ | ❌ | `_untilBar` NOT hydrated — silent no-op |
| `.fadeIn(bars)` | `_fadeInBars` | ✅ | ❌ | `_fadeInBars` NOT hydrated — silent no-op |
| `.fadeOut(bars)` | `_fadeOutBars` | ✅ | ❌ | `_fadeOutBars` NOT hydrated — silent no-op |
| `.mapNotes(fn)` | `_mapNotesFn` | ✅ | ❌ | `_mapNotesFn` NOT hydrated — silent no-op |

---

## Pitch / notes group

| method | DSL field | exists in DSL | engine hydrates | note |
|---|---|---|---|---|
| `.note(pitch)` | `_notes` | ✅ | ✅ | `_notes: [pitch]` — hydrated to `props.notes` |
| `.notes(arr)` | `_notes` | ✅ | ✅ | Hydrated to `props.notes` |
| `.scale(name, root)` | `_scale` | ✅ | ❌ | `_scale` NOT hydrated — silent no-op |
| `.pitch(semitones)` | `_pitchOffset` | ✅ | ❌ | `_pitchOffset` NOT hydrated — silent no-op |
| `.octave(n)` | `_octave` | ✅ | ❌ | `_octave` NOT hydrated — silent no-op |
| `.glide(time)` | `_glide` | ✅ | ❌ | `_glide` NOT hydrated via descriptor. Some instruments read `props.glide` if set via old props API |
| `.dur(time)` | `_dur` | ✅ | ❌ | `_dur` NOT hydrated — silent no-op |

---

## Amplitude group

| method | DSL field | exists in DSL | engine hydrates | note |
|---|---|---|---|---|
| `.volume(v)` | `_volume` | ✅ | ✅ | Mapped to `gain` (melodic) or `volume` (percussion) |
| `.attack(s)` | `_adsr.attack` | ✅ | ✅ | Merged into `_adsr` → hydrated as `props.envelope` |
| `.decay(s)` | `_adsr.decay` | ✅ | ✅ | Same |
| `.sustain(v)` | `_adsr.sustain` | ✅ | ✅ | Same |
| `.release(s)` | `_adsr.release` | ✅ | ✅ | Same |
| `.duckWith(src, opts?)` | `_sidechain` | ✅ | ❌ | `_sidechain` NOT hydrated — pump/duck effects silent no-op |
| `.pumpWith(src, release?)` | `_sidechain` | ✅ | ❌ | Alias for `duckWith` — same: silent no-op |
| `.swellWith(src)` | `_sidechain` | ✅ | ❌ | `_sidechain` NOT hydrated — silent no-op |
| `.sidechain(src, opts?)` | `_sidechain` | ✅ | ❌ | `_sidechain` NOT hydrated — silent no-op |

---

## Tone group

| method | DSL field | exists in DSL | engine hydrates | note |
|---|---|---|---|---|
| `.filter(freq, q?)` | `_filter` | ✅ | ❌ | `_filter` NOT in `partToInstrumentDescriptor` — silent no-op. Note: old props-style instruments read `props.filter` directly but `_filter` is never mapped to `props.filter` |
| `.eq(lo, mid, hi)` | `_eq` | ✅ | ❌ | `_eq` NOT hydrated — silent no-op |
| `.bit(bits)` | `_effects` (appended) | ✅ | ✅ | Appends `bitcrusher` EffectDescriptor to `_effects` — hydrated |
| `.saturate(amt)` | `_effects` (appended) | ✅ | ✅ | Appends `saturation` EffectDescriptor — hydrated |

---

## Space group

| method | DSL field | exists in DSL | engine hydrates | note |
|---|---|---|---|---|
| `.pan(v)` | `_pan` | ✅ | ⚠️ | `_pan` passes through as `props.pan` — but engine never applies it to mixer channel. Mixer channel is created with no pan parameter. Likely dead |
| `.widen(amt)` | `_effects` (appended) | ✅ | ✅ | Appends `stereo-widener` EffectDescriptor — hydrated |
| `.reverb(wet, opts?)` | `_effects` (appended) | ✅ | ✅ | Appends `reverb` EffectDescriptor — hydrated |
| `.delay(time, fb?)` | `_effects` (appended) | ✅ | ✅ | Appends `delay` EffectDescriptor — hydrated |
| `.chorus(depth?)` | `_effects` (appended) | ✅ | ✅ | Appends `chorus` EffectDescriptor — hydrated |
| `.flange(depth?)` | `_effects` (appended) | ✅ | ✅ | Appends `flanger` EffectDescriptor — hydrated |

---

## Routing group

| method | DSL field | exists in DSL | engine hydrates | note |
|---|---|---|---|---|
| `.send(bus, amount?)` | `_sends` | ✅ | ❌ | `_sends` NOT hydrated — named bus routing silent no-op |
| `.mute()` | `_mute` | ✅ | ❌ | `_mute` NOT in `partToInstrumentDescriptor`. GUI muting works via `PatchProps` at runtime |
| `.solo()` | `_solo` | ✅ | ❌ | `_solo` NOT hydrated — silent no-op |
| `.chokeGroup(name)` | `_chokeGroup` | ✅ | ❌ | `_chokeGroup` NOT hydrated — hi-hat choke groups silent no-op |
| `.layer(...parts)` | `_layers` | ✅ | ❌ | `_layers` NOT hydrated — layered parts silent no-op |

---

## Modulation group

| method | DSL field | exists in DSL | engine hydrates | note |
|---|---|---|---|---|
| `.tremolo(rate, depth?)` | `_modulations` | ✅ | ❌ | `_modulations` NOT in `partToInstrumentDescriptor`. Entire modulation system inert |
| `.vibrato(rate, depth?)` | `_modulations` | ✅ | ❌ | Same |
| `.wobble(rate, depth?)` | `_modulations` | ✅ | ❌ | Same — LFO on filter cutoff is inert |
| `.autopan(rate, depth?)` | `_modulations` | ✅ | ❌ | Same |
| `.flutter(rate?)` | `_modulations` | ✅ | ❌ | Same |
| `.breathe(rate?)` | `_modulations` | ✅ | ❌ | Same |
| `.drift(amt?)` | `_modulations` | ✅ | ❌ | Same — OU process pitch drift inert |
| `.swell(bars)` | `_modulations` | ✅ | ❌ | Same |
| `.modulate(param, src)` | `_modulations` | ✅ | ❌ | Same — power escape hatch is inert |

---

## Meta group

| method | DSL field | exists in DSL | engine hydrates | note |
|---|---|---|---|---|
| `.seed(n)` | `_seed` | ✅ | ❌ | `_seed` NOT in `partToInstrumentDescriptor`. Only `song.seed` is passed to `createStepSequencer` — per-track seed override silent no-op |
| `.name(label)` | `_name` | ✅ | ❌ | Cosmetic — GUI mixer only. Not needed for audio |
| `.model(variant)` | `_model` | ✅ | ✅ | Hydrated to `props.model` — engine dispatches Kick808/Kick909/Snare909/Hihat808 |

---

## Visual group

| method | DSL field | exists in DSL | engine hydrates | note |
|---|---|---|---|---|
| `.visual(override)` | `_visual` | ✅ | — | Engine-agnostic by design. `@score/visuals` reads from `TrackVisualState` |
| `.color(hex)` | `_visual.color` | ✅ | — | Same |
| `.glyph(kind)` | `_visual.glyph` | ✅ | — | Same |
| `.label(text)` | `_visual.label` | ✅ | — | Same |

---

## Instrument sub-types

### `SubSynthPart` (from `SubSynth()`)

| method | works? | note |
|---|---|---|
| All `ChainMethods<SubSynthPart>` | See table above | Same hydration gaps apply |
| `.unison(n)` | ✅ | Sets `props.unison` directly — passes through `...part.props` |
| `.detune(cents)` | ✅ | Sets `props.detune` — passes through `...part.props` |

### `FMSynthPart` (from `FMSynth()`)

| method | works? | note |
|---|---|---|
| All `ChainMethods<FMSynthPart>` | See table above | |
| `.ratio(n)` | ✅ | Sets `props.ratio` — passes through |
| `.modIndex(n)` | ✅ | Sets `props.modIndex` — passes through |
| `.feedback(n)` | ✅ | Sets `props.feedback` — passes through |

### `Bass303Part` (from `Bass303()`)

| method | works? | note |
|---|---|---|
| All `ChainMethods<Bass303Part>` | See table above | |
| `.cutoff(freq)` | ✅ | Sets `props.cutoff` — passes through |
| `.resonance(q)` | ✅ | Sets `props.resonance` — passes through |
| `.accent(pattern)` | ✅ | Sets `props.accent` — passes through |
| `.slide(pattern)` | ✅ | Sets `props.slide` — passes through |
| `.filter()` | ❌ | Base method — `_filter` NOT hydrated (see Tone group above). Use `.cutoff()` + `.resonance()` instead |

---

## Export gap: modulation sources not in `@score/dsl` index

`packages/dsl/src/modulation.ts` defines and exports: `lfo`, `sine`, `ramp`, `lorenz`, `ou`, `logistic`.

**These are NOT re-exported from `packages/dsl/src/index.ts`.**

`import { lfo } from '@score/dsl'` — fails at runtime. Users importing modulation sources must reach into the internal path (`@score/dsl/src/modulation`) which is not the public API.

Fix (separate PR): add to `packages/dsl/src/index.ts`:
```ts
export { lfo, sine, ramp, lorenz, ou, logistic } from './modulation.js'
export type { ModulationDescriptor } from './modulation.js'
```

---

## Summary of hydration gaps by severity

### Critical — method commonly used, silently no-ops

| method | impact |
|---|---|
| `.filter(freq, q?)` | Every bass/pad filter sweep produces no audio effect |
| `.degrade(p)` | Pattern probability drops silently ignored |
| `.wobble(rate)` | Dubstep/acid LFO filter wobble inert |
| `.tremolo(rate)` / `.vibrato(rate)` | Volume/pitch modulation inert |
| `.duckWith()` / `.pumpWith()` | EDM pumping effect inert |
| `.swing(amount)` | Per-track swing dead (global swing exists via TempoMap) |
| `.humanize(amt)` | Per-track timing jitter dead |

### High — used in arrangements

| method | impact |
|---|---|
| `.fromBar(n)` / `.untilBar(n)` | Track arrangement timing inert |
| `.fadeIn(bars)` / `.fadeOut(bars)` | Volume automation inert |
| `.chokeGroup(name)` | Open/closed hihat choke inert |
| `.apply(fn)` | Custom pattern transforms (drunk, fibonacci, lorenz) inert |
| `.scale(name, root)` | Note constraining inert |
| `.pitch(semitones)` | Transpose inert |

### Normal — less commonly called

| method | impact |
|---|---|
| `.send(bus, amount)` | Named bus routing inert |
| `.solo()` | Solo inert at eval time |
| `.layer(...parts)` | Layered instruments inert |
| `.stepProb(probs)` | Per-step probability array inert |
| `.every(n, fn)` | Cyclic pattern variation inert |
| `.stretch(bars)` | Pattern bar-fitting inert |
| `.seed(n)` | Per-track seed override inert |
| `.stutter(n)` | Stutter repeat inert |
| `.mask(pattern)` | Pattern gating inert |
| `.phase(amount)` | Pattern offset inert |
| `.octave(n)` | Octave shift inert |
| `.glide(time)` | Portamento inert |
| `.dur(time)` | Note duration inert |
| `.mapNotes(fn)` | Note transform inert |
| `.repeat(n)` | Pattern repeat inert |
| `.pan(v)` | Stereo pan likely inert (passes through props but engine never applies to channel) |

### Low — cosmetic / design-intent not yet reached

| method | impact |
|---|---|
| `.eq(lo, mid, hi)` | 3-band EQ inert |
| `.swellWith(src)` | Reverse sidechain inert |
| `.name(label)` | GUI-only, not needed for audio |

---

## ADR 014 conformance

ADR 014 spec matches what was built in structure — `ChainablePart`, immutable spread, factory functions, correct method groupings. The gap is hydration depth, not design.

ADR 014 method set (committed):
- Pattern group ✅ (pre-expand methods work; stochastic/sequence methods deferred)
- Pitch/notes ✅ (notes/note hydrated; scale/pitch/octave deferred)
- Amplitude ✅ (volume + ADSR work; sidechain deferred)
- Tone ⚠️ (bit/saturate via effects work; `.filter()` and `.eq()` are critical gaps)
- Space ✅ (reverb/delay/chorus/flange/widen via effects work; pan questionable)
- Routing ❌ (send/solo/chokeGroup/layer all deferred)
- Modulation ❌ (entire `_modulations` system deferred — nothing hydrates it)
- Meta ⚠️ (model ✅, name cosmetic, seed deferred)
- Visual — engine-agnostic by design ✅

All deferred items are Phase 13 hydration work, not DSL structure work.
