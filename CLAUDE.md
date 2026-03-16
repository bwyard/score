## Session & Todo System

Shared session state and todos live in `../claude-resources/` (one level up).

- Session file: `../claude-resources/sessions/score/current.md`
- Session history: `../claude-resources/sessions/score/s000-s009/` etc.
- Todo CLI: `node ../claude-resources/todos/todo.js list --project score`
- Dashboard: `node ../claude-resources/todos/todo.js dashboard`
- Nav hub: `../claude-resources/CLAUDE.md`

Read `current.md` at the start of every session. Update it and write a closed session log at the end.

---

# Score — EDM Audio Framework

> **Name locked:** Score. npm scope `@score/*`. Repo `bwyard/score`.
> GUI name (e.g. Score Studio) to be decided at Phase 13.

This file is the authoritative project briefing. Read it fully before touching any file.
Full architecture spec: `SCORE_HANDOFF.md`

## Quick Reference

- **Runtime:** Node 20 LTS minimum. Song files run as plain ESM, never compiled.
- **Package manager:** pnpm
- **Monorepo:** Turborepo
- **Audio:** Tone.js (Layer 1) + Web Audio API + node-web-audio-api (Node polyfill)
- **Testing:** Vitest — coverage thresholds enforced in CI (90/85/90/90)
- **CI:** typecheck → lint → test → coverage. No merge if CI fails.

## Code Style — Modern Functional

**Everything is functional.** Framework and song files share the same style.

- **Factory functions, not classes** — `createMixer(props)` returns a plain object, not `new Mixer()`
- **Props and state** — components receive props (config) and manage state like React components
- **Composition over inheritance** — combine small functions, don't extend base classes
- **Immutable by default** — config objects are never mutated; produce new state instead
- **Pure functions where possible** — predictable inputs/outputs, no hidden side effects
- **`const` + arrow functions** — no `let`, no `function` declarations, no classes
- **No exceptions** — `ScoreError` is a factory function, not a class

The song language should feel like writing Svelte — declarative, component-based, props in, music out:

```js
const kick = Kick({ sample: './samples/kick.wav', pattern: [1, 0, 0, 0], volume: 0.9 })
const bass = Synth({ wave: 'sawtooth', filter: { type: 'lowpass', frequency: 800 } })
export default Song({ bpm: 140, tracks: [kick, bass] })
```

## Non-Negotiable Rules

1. Song files are **never compiled** — run directly as ES modules
2. Web Audio API is **never exposed** to song authors — fully abstracted
3. **ScoreError** is the only error factory — never throw raw `Error`
4. Tests and error handling **ship with the component** — never backfilled
5. **No AI** generates music, patterns, or voices — ever
6. **No audio files bundled** — `samples/` is gitignored except `.gitkeep` and `README.md`
7. GUI is built **last** (Phase 13)
8. Every component implements the `AudioComponent` interface (as a plain object shape, not a class)
9. Audio scheduling always uses `audioContext.currentTime` — never `setTimeout` or `Date.now()`
10. **All code is functional** — factory functions, `const`, arrow functions, zero classes

## Git Workflow

- **`main`** — production. Protected: PRs only, enforced on admins.
- **`dev`** — development. Protected: PRs only, enforced on admins.
- **Feature branches** — all work happens here. Branch off `dev`, PR into `dev`.
- `dev` → `main` via PR for releases.
- **No direct commits** to `main` or `dev` — ever.

## Current Phase

**Phase 1 — Scaffold** (in progress)
See `SCORE_HANDOFF.md` for the full 17-phase build plan.

## Start-of-Session Checklist

1. Read session file: `../claude-resources/sessions/score/current.md`
2. Read `AGENTS.md` — check what's in progress
3. Run `pnpm test` — confirm all tests passing
4. Check current phase in `SCORE_HANDOFF.md`
