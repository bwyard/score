# Score — Thesis Compliance

> **Thesis:** Temporal assembly — no STORE, no JUMP, only APPEND+ADVANCE.
> A song is a pure function of time. Math reads as music.

## The Rule by Layer

### Layer 1 — `@score/*` packages (strict)

Everything in `packages/` except `packages/gui/` must be **purely functional**.

**Required:**
- `const` + arrow functions everywhere — no `function` declarations
- Factory functions returning plain objects — `createX(props)` not `new X()`
- Immutable by default — never mutate inputs; return new objects/arrays
- Pure functions where possible — same inputs, same outputs, no hidden side effects
- No `let` — use `const` with spreading/mapping to produce new state
- No classes — not even private ones
- `ScoreError` factory for all errors — never `throw new Error(...)`

**Example — correct:**
```ts
export const createKick = (props: KickProps): KickDescriptor => ({
  _type: 'InstrumentDescriptor',
  instrumentType: 'kick',
  props,
})
```

**Example — wrong:**
```ts
class Kick {              // ❌ class
  constructor(props) { this.props = props }  // ❌ mutation
}
let volume = 0.9          // ❌ let
```

### Layer 2 — `packages/gui/src/main/` (functional with IO boundary)

Main process code (Electron IPC handlers, file I/O, engine bridge) is **functional** but has explicit IO boundaries.

**Required:**
- Same rules as Layer 1 for all pure logic
- IO boundaries (IPC sends, file reads, engine calls) are **annotated** with `// BOUNDARY — IO:`
- No classes

**Exempt:**
- `ipcMain.on(...)` — event registration is necessarily imperative
- `app.on(...)` — Electron lifecycle hooks

### Layer 3 — `packages/gui/src/renderer/` (React patterns allowed)

Renderer code uses **idiomatic React**. The thesis applies to all non-React logic.

**Allowed (React idioms):**
- `useState`, `useRef`, `useEffect`, `useCallback`, `useMemo` — hooks are the React functional pattern
- `useEffect` with cleanup — standard React subscription pattern
- Component local state — acceptable; components are pure functions of props+state

**Still required:**
- Zero classes in component files
- Zero `let` — use `const` + `useState`/`useReducer` for mutable state
- Helper functions inside components must be `const` arrow functions
- Styles as `const` objects, never mutated

**Example — correct:**
```tsx
export const MyComponent = ({ value }: Props) => {
  const [active, setActive] = useState(false)
  const handleClick = useCallback(() => { setActive(v => !v) }, [])
  return <button onClick={handleClick}>{value}</button>
}
```

**Example — wrong:**
```tsx
class MyComponent extends React.Component { ... }  // ❌ class
let counter = 0                                     // ❌ module-level let
function handleClick() { ... }                      // ❌ function declaration
```

## Never Allowed (any layer)

| Pattern | Why |
|---------|-----|
| `class` | Violates functional principle — use factory functions |
| `let` (module-level or non-loop) | Use `const`; mutable state goes in React `useState` |
| `new Error(...)` | Use `ScoreError(...)` — consistent error factory |
| Mutating props/state | Produce new objects: `{ ...old, key: newValue }` |
| `function` declarations | Use `const fn = () => ...` |
| `any` type | TypeScript strict mode — always type explicitly |
| `setTimeout`/`Date.now()` for scheduling | Use `audioContext.currentTime` |
| Exposing Web Audio API to song files | Always abstracted by the engine |

## Exemptions

| Pattern | Where | Why |
|---------|-------|-----|
| React hooks (`useState` etc.) | `renderer/components/`, `renderer/hooks/` | Idiomatic React — these ARE the functional pattern for UI |
| `useRef` for DOM/editor refs | `renderer/` | No alternative in React for DOM refs |
| `ipcMain.on` / `app.on` | `main/` | Electron event API — no functional alternative |
| Electron `webContents.send` | `main/` | IO boundary — annotated |
| `requestAnimationFrame` loop | `renderer/hooks/` | Browser animation API — no functional alternative |
| `console.log` in Song factory | `dsl/src/song.ts` | Intentional IO — logs seed for reproducibility |

## Checking Your Work

Before every commit, verify:
1. `grep -r '\bclass\b' packages/` — must return zero results outside `node_modules`
2. `grep -r '\blet\b' packages/` — review each hit; module-level `let` is always wrong
3. `grep -r 'function ' packages/` — should only be in test mocks and JSX event types
4. `pnpm typecheck` — must pass with zero `any` escapes beyond pre-existing suppressions
