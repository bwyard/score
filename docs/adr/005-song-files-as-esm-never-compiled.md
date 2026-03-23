# ADR 005 — Song Files Run as ESM, Never Compiled

**Status:** Accepted
**Date:** 2026-03-22

## Context

Score song files are authored by musicians and evaluated live — in the CLI (`score play`), in the GUI REPL, and eventually at warehouse shows. The evaluation model had to be chosen carefully:
- **Compiled** — song file gets transpiled to a build artifact before running
- **Interpreted at eval time** — song file runs directly as an ES module

## Decision

Song files are **never compiled**. They run directly as plain ES modules:

```js
// song.ts or song.js — runs as-is
import { Kick, Synth } from '@score/components'
export default Song({ bpm: 140, tracks: [Kick(...), Synth(...)] })
```

The CLI and GUI use dynamic `import()` with ESM cache busting for live reload. The `--trust` flag bypasses the AST security validator for trusted song files.

## Consequences

- Song file changes are reflected immediately — no compile latency
- Live reload (`score play --watch`) invalidates the ESM cache via timestamp query strings
- Song files can be `.ts` (via `tsx` / `ts-node`) or `.js` — both work
- Song files must use ES module syntax — no CommonJS `require()`
- The AST security validator (`@score/dsl/validator`) runs before every non-trusted eval

## Alternatives Considered

- **Compile to JS before eval** (rejected) — adds latency, breaks live-coding feel, requires build tooling in the artist's path
- **Sandboxed `eval()` string** (rejected) — loses proper ES module semantics and import resolution
