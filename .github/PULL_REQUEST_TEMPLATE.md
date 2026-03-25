## Summary

<!-- What does this PR do? 1-3 bullet points. -->

## Checklist

- [ ] Tests pass: `pnpm test`
- [ ] Typecheck passes: `pnpm typecheck`
- [ ] **If you added or changed a public API export:** updated the relevant doc in `docs/` (INSTRUMENTS.md, EFFECTS.md, etc.)
- [ ] **If you added a new chain method:** added it to `docs/ROADMAP.md` DSL section and ensured the engine hydrates it
- [ ] **If you changed an IPC channel:** updated `ipc-types.ts` and the relevant ADR
- [ ] **If you changed `@score/sequencer`:** updated `packages/sequencer/README.md`
- [ ] No `let`, no classes, no `new` (except Web Audio API internals)
- [ ] Every new public export has TSDoc (`/** */` block with `@param`, `@returns`, `@example`)
- [ ] Tests ship with the component — not backfilled later
