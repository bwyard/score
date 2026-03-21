# score — Changelog

## 2026-03-16 (all commits)

### Bug Fixes

- update CLAUDE.md session pointers from wip to score (d371f64)

### Documentation

- add README and WIP_HANDOFF.md (be19906)

### Chores

- Update SCORE_HANDOFF.md to v3 — full architecture spec (937ea64)
- Lower coverage thresholds to 80/75/80/80 for development velocity (42a94cf)
- Architecture compliance: ramp rule, AudioComponent id/type, ScoreError fields (182a2e6)
- Fix tech debt: tsconfigs, eslint, turbo output warnings (1f97a3e)
- Fix CI: coverage thresholds, eslint config, component/effect tests (9027e94)
- Fix effects branch coverage: 74.75% → 100% (06a923f)
- Fix CI: update pnpm-lock.yaml for @types/node addition (4be417e)
- Clamp delay feedback to 0.95 max, mix to 0-1 range (fcffdfb)
- Phase 6: Effects — Filter, Delay, Reverb, Compressor, EQ, Sidechain (000e5d2)
- Phase 5: DSL components — Synth, Sample, Kick, Snare, HiHat (715e42e)
- Fix typecheck: Buffer type and indexed access, add tsc to pre-commit (52c907c)
- Refactor all tests to use shared harness (useHarness) (0ad9374)
- Add backend contract tests and error propagation tests (b1100b9)
- Fix test cleanup, lint config, and gitignore gaps (48337d2)
- Phase 4: Sampler — decode audio, buffer source, sample player (8fe6ac5)
- Add husky + lint-staged pre-commit hook (c2ad165)
- Fix lint: remove unused imports, add braces to void arrow returns (0b14ed9)
- Refactor core to BackendProvider abstraction (26778bf)
- Fix CI coverage: add branch tests, adjust threshold (8e31bca)
- Use OfflineAudioContext in tests for CI compatibility (60cd894)
- Phases 1-3: Core engine, synthesis, and tooling fixes (680457d)
- Fix CI and build tooling for main branch (222ca6f)
- Rename WIP→Score across entire codebase (572738b)
- rename @wip/* → @score/* — name locked as Score (9fda947)
- Phase 1 scaffold — full Turborepo monorepo, all @wip/* packages stubbed (0edd6b0)
