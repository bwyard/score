# Contributing to Score

Score is an open-source EDM audio framework. Contributions are welcome — instruments, synthesis techniques, DSL methods, effects, tests, and documentation.

Read this before opening a PR.

---

## Philosophy

Score has a strict design philosophy. Every contribution must follow it.

- **Math reads as music.** Frequencies, rhythms, envelopes — a song is a pure function of time.
- **Factory functions, not classes.** `createKick808(props)` returns a plain object. Never `new`.
- **Zero `let`, zero `class`, zero `new`** (except Web Audio API internals).
- **Immutable config.** Never mutate props — return new state.
- **`const` and arrow functions only.**
- **`ScoreError` factory for all errors.** Never `throw new Error(...)`.
- **No AI-generated music, patterns, or full songs.** Ever.
- **No audio samples bundled.** Users bring their own.
- **Song files run as plain ESM.** Never compiled.

If you haven't read the ADRs in `docs/adr/`, start there. ADR 001 and ADR 014 are essential.

---

## Getting started

```bash
# Prerequisites: Node 20 LTS, pnpm
git clone https://github.com/bwyard/score
cd score
pnpm install
pnpm turbo build --filter='!@score/gui'
pnpm test
```

Branch off `dev`. PRs go into `dev`. Never target `main` directly.

```bash
git checkout dev
git checkout -b feat/your-feature
```

---

## What we want

### Instruments
New synthesis engines following the `AudioComponent` interface. See existing engines in `packages/components/src/` for examples:
- `createKick808.ts` — envelope + sine body
- `createFMSynth.ts` — operator-based FM
- `createSubtractiveSynth.ts` — oscillator + filter + envelope

Every instrument needs:
- Factory function returning a plain object (`AudioComponent` shape)
- Full TSDoc on all public exports
- Tests shipping with the component (not backfilled)
- Chain method support via `ChainableTrack` from `@score/dsl`

### Chain methods
New `.method()` additions to the fluent DSL (ADR 014). Pitch, modulation, effects, sequencing. Open an issue first to discuss scope.

### Effects
`@score/effects` — reverb, delay, distortion, etc. Must be functional, no class instances.

### DSL / patterns
`@score/pattern` and `@score/dsl` — pattern utilities, mini-notation, theory helpers.

### Bug fixes
Always welcome. Include a failing test that the fix makes pass.

---

## Code standards

- TypeScript strict mode. No `any`.
- All public exports get TSDoc: `/** */` block with `@param`, `@returns`, `@example`, `@throws {ScoreError}`.
- Tests use Vitest. Coverage thresholds: 90/85/90/90 (statements/branches/functions/lines).
- CI must pass before merge: `typecheck → lint → test → coverage`.
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
- IO and hardware boundaries annotated with `// BOUNDARY — [reason]`.

---

## PR checklist

- [ ] Branched off `dev`, targeting `dev`
- [ ] All tests pass (`pnpm test`)
- [ ] No `let`, no `class`, no `new` (outside Web Audio API)
- [ ] Every public export has TSDoc
- [ ] Tests ship with the component (not in a separate PR)
- [ ] `ScoreError` used for all errors
- [ ] CI green

---

## What we don't accept

- AI-generated music, patterns, or songs
- Use of contributions as AI training data
- Bundled audio samples
- Class-based architecture
- Direct mutations of config objects
- Raw `throw new Error(...)` — use `ScoreError`
- PRs that break existing tests without explanation
- Features that conflict with ADRs without a new ADR discussion

---

## Reporting issues

Open an issue on GitHub. For security vulnerabilities, email byard29@gmail.com directly — do not open a public issue.

---

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0. See [LICENSE](LICENSE).
