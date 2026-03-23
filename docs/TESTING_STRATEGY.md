# Score — Testing Strategy

## Pyramid

```
         ┌──────────────┐
         │     E2E      │  Phase 15+ (Playwright)
         ├──────────────┤
         │ Integration  │  @score/cli engine, real audio context
         ├──────────────┤
         │  Component   │  React Testing Library + userEvent v14
         ├──────────────┤
         │     Unit     │  Vitest — pure functions, DSL, math
         └──────────────┘
```

## Per-Package Approach

### `@score/core`, `@score/math`, `@score/pattern`
**Type:** Unit only
**Tool:** Vitest
**What to test:** Pure functions — same input, same output. Cover edge cases, boundary values, error paths.
**What NOT to test:** Internal implementation details; test the public API only.

```ts
it('euclidean(3, 8) returns correct onset pattern', () => {
  expect(euclidean(3, 8)).toEqual([1, 0, 0, 1, 0, 0, 1, 0])
})
```

### `@score/dsl`
**Type:** Unit
**Tool:** Vitest
**What to test:** Factory function outputs, type guards, chain method immutability, error factories.
**Critical:** Every chain method returns a NEW object — test immutability explicitly.

```ts
it('volume() returns new object, does not mutate original', () => {
  const kick = Kick808()
  const louder = kick.volume(0.9)
  expect(louder).not.toBe(kick)
  expect(kick._volume).toBeUndefined()
})
```

### `@score/components`, `@score/effects`
**Type:** Unit
**Tool:** Vitest
**What to test:** Synthesis parameter transforms, effect configuration objects, factory outputs.
**Note:** No Web Audio API in tests — stub `AudioContext` where needed.

### `@score/cli` (engine)
**Type:** Integration
**Tool:** Vitest with `node-web-audio-api` polyfill
**What to test:** Real engine evaluation — `createScoreEngine`, `play()`, `stop()`, IPC emission.
**Rule:** **No mocks** for the engine — this is the integration layer. Mocking the DB got us burned before; mocking the audio engine is the same risk.

```ts
it('engine plays chain-API song without throwing', async () => {
  const song = Song({ bpm: 120, tracks: [Kick808().pattern([1,0,0,0])] })
  const engine = createScoreEngine()
  await expect(engine.play(song)).resolves.not.toThrow()
})
```

### `@score/gui` — renderer components
**Type:** Component
**Tool:** React Testing Library + userEvent v14 + jsdom
**Standard:** `GUI_COMPONENT_STANDARD.md` (in `packages/gui/docs/`)

**Rules:**
- **userEvent v14** for all new tests — `const user = userEvent.setup(); await user.click(...)`
- **`getByRole` first** — prefer semantic queries over `getByTestId`
- **No implementation testing** — test what the user sees and does, not internal state
- **Accessibility** — every interactive element must have a role or label; use `axe-core` for a11y checks on complex components
- **No snapshots** — they break on style changes and test nothing meaningful

```tsx
it('clicking mute button calls onMute with track index', async () => {
  const onMute = vi.fn()
  const user   = userEvent.setup()
  render(<MixerStrip trackIndex={0} onMute={onMute} ... />)
  await user.click(screen.getByRole('button', { name: /mute/i }))
  expect(onMute).toHaveBeenCalledWith(0)
})
```

**What to avoid:**
- `fireEvent` in new tests (use `userEvent`)
- Testing that `setState` was called (internal)
- Testing CSS class names (implementation detail)
- `screen.getByTestId` when a semantic query works

### `@score/visuals`
**Type:** Unit
**Tool:** Vitest
**What to test:** Theme registry (defineTheme, registerTheme, getTheme), DrawLayer output shapes, type guards.
**Note:** No canvas rendering in unit tests — test that themes return correctly shaped `VisualSceneDescriptor` objects.

## Coverage Thresholds (enforced in CI)

| Metric | Threshold |
|--------|-----------|
| Statements | 90% |
| Branches | 85% |
| Functions | 90% |
| Lines | 90% |

GUI renderer components are excluded from branch coverage (DOM branching is hard to cover fully).

## CI Pipeline

```
typecheck → lint → test → coverage
```

No merge if any step fails. Coverage gates run on `@score/dsl`, `@score/core`, `@score/math`, `@score/pattern`, `@score/components`, `@score/effects`.

## TDD Mandate

New features must follow red-green-refactor:
1. **Red** — write the failing test first
2. **Green** — write the minimum code to pass
3. **Refactor** — clean up without breaking tests

For GUI components: write the test file before `index.tsx`. The component API is derived from what the test needs, not the other way around.

## E2E Roadmap (Phase 15+)

**Tools:** Playwright + `electron-playwright-helpers`
**Scope:** Full app flows — splash → mode select → live code → play → stop
**Not yet:** No E2E in CI currently — infrastructure work deferred to Phase 15
**When:** After distribution strategy (ADR 019) is finalised and app is packaged

Planned E2E scenarios:
- New session → type code → Ctrl+Enter → hear audio
- Performance Mode → Tab toggle → canvas visible
- File save/open round-trip
- BPM change via slider → code updates → re-eval
