## Session & Todo System
Shared session state and todos live in `../claude-resources/` (one level up).

- Session file:    `../claude-resources/sessions/wip/current.md`
- Session history: `../claude-resources/sessions/wip/s000-s009/` etc.
- Todo CLI:        `node ../claude-resources/todos/todo.js list --project wip`
- Dashboard:       `node ../claude-resources/todos/todo.js dashboard`
- Nav hub:         `../claude-resources/CLAUDE.md`

Read `current.md` at the start of every session. Update it and write a closed session log at the end.

---

# Score — EDM Audio Framework

> **Name locked:** Score. npm scope `@score/*`. Repo will be `bwyard/score`.
> Folder will be renamed from `wip/` to `score/` locally.
> GUI name (e.g. Score Studio) to be decided at Phase 13.

This file is the authoritative project briefing. Read it fully before touching any file.
Full architecture spec: `WIP_HANDOFF.md`

## Quick Reference

- **Runtime:** Node 20 LTS minimum. Song files run as plain ESM, never compiled.
- **Package manager:** pnpm
- **Monorepo:** Turborepo
- **Audio:** Tone.js (Layer 1) + Web Audio API + node-web-audio-api (Node polyfill)
- **Testing:** Vitest — coverage thresholds enforced in CI (90/85/90/90)
- **CI:** typecheck → lint → test → coverage. No merge if CI fails.

## Non-Negotiable Rules

1. Song files are **never compiled** — run directly as ES modules
2. Web Audio API is **never exposed** to song authors — fully abstracted
3. **WIPError** is the only error class — never throw raw `Error`
4. Tests and error handling **ship with the component** — never backfilled
5. **No AI** generates music, patterns, or voices — ever
6. **No audio files bundled** — `samples/` is gitignored except `.gitkeep` and `README.md`
7. GUI is built **last** (Phase 13)
8. Every component implements the `AudioComponent` interface
9. Audio scheduling always uses `audioContext.currentTime` — never `setTimeout` or `Date.now()`
10. Song files use ESM, `const`, arrow functions, no classes

## Current Phase

**Phase 1 — Scaffold** (in progress)
See `WIP_HANDOFF.md` for the full 17-phase build plan.

## Start-of-Session Checklist

1. Read session file: `../claude-resources/sessions/wip/current.md`
2. Read `AGENTS.md` — check what's in progress
3. Run `pnpm test` — confirm all tests passing
4. Check current phase in `WIP_HANDOFF.md`
