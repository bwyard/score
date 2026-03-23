# ADR 014 Addendum — Visual Chain Methods on ChainablePart

**Date:** 2026-03-23
**Status:** Accepted
**Parent ADR:** [ADR 014 — Fluent DSL Chain API](014-fluent-dsl-chain-api.md)

---

## Context

ADR 014 defines the full fluent chain API for instrument DSL authoring. It specifies ~40 chain methods covering patterns, pitch, dynamics, tone, space, routing, and modulation.

Phase 13 (`@score/visuals`) adds a visual renderer that binds canvas animations to live audio — waveform, spectrum, Lorenz attractor, punchcard. Song authors using Performance Mode (ADR 027 / `feat/gui-performance-mode`) want to declare visual intent alongside audio intent, in the same chain expression.

This addendum ratifies four visual chain methods on `ChainablePart` that were not included in the original ADR 014.

---

## Decision

Add the following four visual chain methods to `ChainablePart`:

### `.visual(name: string)`

Selects the named visual renderer for this track's canvas strip.

```ts
Kick(4).volume(0.8).visual('lorenz')
Synth('saw', 'C3').notes(['C3','G3']).visual('waveform')
```

Recognised renderer names (matched by `@score/visuals` at render time):

| Name | Description |
|---|---|
| `'waveform'` | Oscilloscope — live amplitude trace |
| `'spectrum'` | FFT frequency bars |
| `'lorenz'` | Lorenz attractor particle system |
| `'neon-grid'` | Glowing step-grid with hit pulses |
| `'void'` | Minimal — dark canvas, no visuals (default) |

Unknown renderer names are passed through to `@score/visuals` unchanged — future renderers slot in without updating this type.

### `.color(value: string)`

Sets the primary colour for this track's visual renderer. Accepts any CSS colour string.

```ts
Kick(4).visual('neon-grid').color('#ff2d78')
Synth('saw', 'C3').visual('waveform').color('hsl(200 100% 60%)')
```

Palette shorthand strings are resolved by `@score/visuals`:

| Shorthand | Hex |
|---|---|
| `'acid'` | `#b8ff00` |
| `'neon'` | `#ff2d78` |
| `'void'` | `#6633cc` |
| `'fire'` | `#ff6600` |
| `'ice'` | `#00ccff` |

### `.glyph(icon: string)`

Sets the icon glyph shown on this track's mixer strip and punchcard label. Intended for Performance Mode multi-stream layout where track identity needs to be instantly readable at distance.

```ts
Kick(4).glyph('●')
Snare(2).glyph('✦')
Bass303('C2').glyph('~')
```

Any string is accepted. Single emoji or Unicode glyphs render best. Defaults to the instrument type initial (`K`, `S`, `H`, etc.) if not provided.

### `.label(text: string)`

Sets the human-readable track name used in mixer strip, export metadata, and session state.

```ts
Kick(4).label('main kick')
Synth('saw', 'C3').label('acid lead')
```

Defaults to the instrument factory name if not set. Used by `song:update` IPC payload and `@score/musical` describe output.

---

## Implementation contract

All four methods follow the same pattern as every other chain method — pure, no mutation, new `ChainablePart` on each call:

```ts
visual: (name: string) => createChain({ ...descriptor, visual: name }),
color:  (value: string) => createChain({ ...descriptor, color: value }),
glyph:  (icon: string)  => createChain({ ...descriptor, glyph: icon }),
label:  (text: string)  => createChain({ ...descriptor, label: text }),
```

The four new fields are added to `PartDescriptor` (or a `VisualMeta` sub-object — implementer's choice). They are optional and default to `undefined`.

The `@score/visuals` package reads these from the hydrated descriptor at render time. The GUI `song:update` IPC payload should forward them alongside track name and type.

---

## GUI codegen correlation

| GUI gesture | Generated code |
|---|---|
| Select renderer in Performance Mode dropdown | `.visual('lorenz')` |
| Pick colour in track colour picker | `.color('#ff2d78')` |
| Type in track glyph field | `.glyph('●')` |
| Type in track label field | `.label('main kick')` |

---

## Consequences

**Positive:**
- Visual intent lives in the song file — shareable, version-controlled, reproducible shows
- Four one-liner methods — minimal surface area, zero new concepts
- Fully optional — removing all four methods has no audio effect

**Negative:**
- Adds four optional fields to `PartDescriptor` — minor type surface growth
- `@score/visuals` package must handle `undefined` gracefully for all four (it does, by design)
