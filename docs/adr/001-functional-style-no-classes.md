# ADR 001 — Functional Style: No Classes, No `let`

**Status:** Accepted
**Date:** 2026-03-22

## Context

Score is a TypeScript audio framework where song files are authored by humans and evaluated live. The framework needed a consistent code style that:
- Works identically in framework code and user-authored song files
- Is predictable, testable, and auditable
- Avoids mutable state pitfalls in real-time audio scheduling

## Decision

All code in Score uses functional style throughout:

- **Factory functions, not classes** — `createMixer(props)` returns a plain object, never `new Mixer()`
- **`const` + arrow functions** — no `let` declarations, no `function` keyword
- **Pure functions where possible** — same inputs, same outputs, no hidden side effects
- **Immutable by default** — props objects are never mutated; produce new state instead

This applies to both framework internals (`packages/`) and user-authored song files.

## Consequences

- Song files read like declarative music notation, not imperative object construction
- Easy to diff and audit: no shared mutable state between tracks
- Testing is straightforward: all factory functions return plain objects
- Enforced by ESLint (`@bwyard/eslint-config-functional`) and CI

## Alternatives Considered

- **Class-based components** (rejected) — mutable `this`, harder to compose, breaks song-file parity
- **Mixed approach** (rejected) — inconsistency would bleed into user song files
