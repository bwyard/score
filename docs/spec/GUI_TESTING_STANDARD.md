# GUI Testing Standard — Score Studio

> Maintained by the Score team. Update this document when new patterns are established.
> All GUI tests must follow these standards. PRs that add components without tests will be rejected.

---

## Philosophy (Kent C. Dodds)

> "The more your tests resemble the way your software is used, the more confidence they give you."

Tests prove the component *works for the user*, not that it *exists as written*.
Test behavior. Never test implementation details (internal state, CSS classes, refs).

---

## Testing Pyramid

```
          ┌─────────────┐
          │     E2E     │  Playwright — full Electron app, critical journeys
          ├─────────────┤  Phase 15+ (planned)
          │ Integration │  Multi-component flows, IPC-mocked end-to-end
          ├─────────────┤
          │  Component  │  React Testing Library — current primary layer
          ├─────────────┤
          │    Unit     │  Pure functions only (codePatcher, math helpers)
          └─────────────┘
```

### Unit tests
- For pure functions only: `codePatcher.ts`, `getActiveLines()`, `noteHz()`, etc.
- No DOM, no React — just function input/output
- Fast: all unit tests should complete in <1s total

### Component tests (React Testing Library)
- One test file per component: `Foo.tsx` → `Foo.test.tsx`
- Test from the user's perspective: what they see and what they can do
- Mock only: IPC bridge (`window.electron`), canvas APIs, timers

### Integration tests
- Multi-component: e.g. LiveCode + MixerStrip + engine IPC all wired
- Mock the main-process IPC handler, let the renderer flow naturally
- Test user journeys: "user evals code → mixer strips appear → user drags fader → volume changes"

### E2E tests (Planned — Phase 15+)
- Framework: [Playwright](https://playwright.dev/) + [electron-playwright-helpers](https://github.com/spaceagetv/electron-playwright-helpers)
- Target journeys (not implementation):
  - Eval a song → audio engine boots → bar counter increments
  - Adjust BPM via slider → BPM in code updates
  - Export to WAV → file appears on disk
  - Open a `.score` file → code loads in editor
- Do NOT test individual component interactions in E2E — those belong in component tests

---

## TDD Workflow (Required for all new components)

```
1. Write the test file (failing) — describes the contract
2. Run: pnpm --filter @score/gui test → see RED
3. Write the minimum component code to pass
4. Run tests → GREEN
5. Refactor → tests still GREEN
```

No new component ships without a passing test file. No exceptions.

---

## Query Priority

Use the highest-confidence query available. In order of preference:

| Priority | Query | When to use |
|----------|-------|-------------|
| 1 | `getByRole('button', { name: /mute/i })` | All interactive elements |
| 2 | `getByLabelText(/volume/i)` | Form inputs with labels |
| 3 | `getByText(/kick/i)` | Static displayed text |
| 4 | `getByPlaceholderText` | Inputs with placeholder only |
| 5 | `getByTestId` | **Last resort only** — non-semantic elements (canvases, custom widgets) |

Never query by className, id, or style. If you can't query without a `data-testid`,
add an `aria-label` to the element instead.

---

## `userEvent` over `fireEvent`

`fireEvent` fires a single synthetic DOM event. Real users fire a sequence
(pointerdown → pointerup → click → focus changes). Use `userEvent` for all interactions.

```typescript
// ✗ Do NOT use
import { fireEvent } from '@testing-library/react'
fireEvent.click(button)
fireEvent.change(input, { target: { value: '0.5' } })

// ✓ Use this
import userEvent from '@testing-library/user-event'
const user = userEvent.setup()
await user.click(button)
await user.clear(input)
await user.type(input, '0.5')
```

Note: `userEvent.setup()` must be called *before* `render()` in v14.

---

## Standard Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen }                        from '@testing-library/react'
import userEvent                                 from '@testing-library/user-event'
import { MyComponent }                           from '../src/renderer/components/shared/MyComponent.js'
import type { MyComponentProps }                 from '../src/renderer/components/shared/MyComponent.js'

// ── Default props ─────────────────────────────────────────────────────────────

const defaultProps: MyComponentProps = {
  // Required props with sensible defaults
}

// ── Setup helper ─────────────────────────────────────────────────────────────

const setup = (overrides: Partial<MyComponentProps> = {}) => {
  const user = userEvent.setup()
  const result = render(<MyComponent {...defaultProps} {...overrides} />)
  return { user, ...result }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MyComponent — rendering', () => {
  it('renders the component name or key content', () => {
    setup()
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})

describe('MyComponent — interactions', () => {
  it('calls onSomething when button clicked', async () => {
    const onSomething = vi.fn()
    const { user } = setup({ onSomething })
    await user.click(screen.getByRole('button', { name: /something/i }))
    expect(onSomething).toHaveBeenCalledOnce()
  })
})

describe('MyComponent — props variants', () => {
  it('does not crash with minimal props', () => {
    expect(() => setup()).not.toThrow()
  })
})
```

---

## What NOT to Test

- ✗ CSS class names or inline styles
- ✗ Internal React state
- ✗ Whether a component re-renders
- ✗ Ref values
- ✗ Implementation details of child components (test those separately)
- ✗ That a function was called with `new` (never relevant in functional components)

---

## Accessibility Requirements

Every interactive element must have an accessible name. Tests verify this implicitly
by using `getByRole` with `{ name: }`. If `getByRole` can't find it, the element
lacks an accessible name — fix the component, not the test.

```typescript
// ✓ Button with aria-label
<button aria-label="Mute kick track" onClick={onMute}>M</button>

// ✓ Input with visible label
<label htmlFor="vol-0">Volume</label>
<input id="vol-0" type="range" />

// ✓ Input with aria-label (when visible label not feasible)
<input type="range" aria-label="Volume" />
```

---

## Mocking Canvas and IPC

```typescript
// In tests/setup.ts (already configured):
// - HTMLCanvasElement.getContext() → mock returns null
// - ResizeObserver → mock stub
// - window.electron → mock IPC bridge

// To mock IPC in a specific test:
vi.spyOn(window.electron.ipcRenderer, 'on').mockImplementation(...)
vi.spyOn(window.electron.ipcRenderer, 'send').mockImplementation(vi.fn())
```

---

## Coverage Thresholds (enforced in CI)

| Metric | Threshold |
|--------|-----------|
| Statements | 90% |
| Branches | 85% |
| Functions | 90% |
| Lines | 90% |

New components must not reduce coverage below these thresholds.
