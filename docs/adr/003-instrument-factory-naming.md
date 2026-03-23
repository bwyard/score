# ADR 003 — Instrument Factory Naming: PascalCase vs `create*`

**Status:** Accepted
**Date:** 2026-03-22

## Context

Score has two categories of audio factories:
- **Instruments** (`@score/components`) — `Kick`, `Snare`, `Synth`, `Sample` — called in song files
- **Effects/utilities** (`@score/effects`, `@score/modulation`, `@score/mixer`) — `createDelay`, `createReverb`, `createLFO`

Song files are authored by musicians, not engineers. The naming convention needed to feel natural at the song-file level.

## Decision

- **Instruments use PascalCase** — `Kick(context, buffer, props)`, `Synth(context, props)`
- **Effects and utilities use `create*`** — `createDelay(context, props)`, `createLFO(context, props)`

Rationale: instruments are *nouns* (things in a song), effects are *constructors* (things you build a signal chain with). This mirrors how musicians think — "add a Kick", "create a delay on the send".

Song file example:
```js
const kick = Kick(context, buffer, { gain: 0.9 })
const reverb = createReverb(context, { decay: 2.0 })
```

## Consequences

- Song files read closer to natural language
- MCP tools and docs must handle both patterns (see `component_catalog` factory regex)
- Instruments are not prefixed with `create` — consistent with how DAWs label tracks
- Internal engine code (`ScoreEngine`) uses `isInstrumentDescriptor()` to distinguish instrument types

## Alternatives Considered

- **Uniform `create*` for everything** (rejected) — `createKick(...)` feels mechanical in song files
- **Uniform PascalCase for everything** (rejected) — `Delay(...)`, `Reverb(...)` conflicts with Web Audio type names
