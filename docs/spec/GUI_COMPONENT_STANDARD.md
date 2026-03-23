# GUI Component Standard — Score Studio

> Maintained by the Score team. All GUI components in `packages/gui` must follow these standards.
> These apply to both `src/renderer/` React components and `src/main/` Electron code.

---

## Core Principle

Score Studio follows the same functional philosophy as the audio engine:
**no classes, no mutation, const + arrow functions only.**

The GUI is a pure function of state. Components receive props, render output, fire callbacks.
No component owns state it doesn't need — lift state to the minimum common ancestor.

---

## React Component Rules

### 1. Functional components only

```typescript
// ✓ Correct
export const MixerStrip = (props: MixerStripProps): JSX.Element => {
  return <div>...</div>
}

// ✗ Never use
export class MixerStrip extends React.Component { ... }
export const MixerStrip: React.FC<MixerStripProps> = (props) => { ... }  // No React.FC
```

### 2. Props are always `readonly`

```typescript
// ✓ Correct — all fields readonly
export type MixerStripProps = {
  readonly name:     string
  readonly volume:   number
  readonly onVolume: (v: number) => void
}

// ✗ Avoid mutable props
export type MixerStripProps = {
  name: string  // mutable — will not be linted but is wrong by convention
}
```

### 3. No React.FC

`React.FC` implicitly adds `children` to props and has other subtle issues.
Declare props explicitly with a named type and let TypeScript infer the return.

### 4. Named exports only

```typescript
// ✓ Correct — named export
export const InstrumentPanel = (props: InstrumentPanelProps): JSX.Element => { ... }
export type { InstrumentPanelProps }

// ✗ No default exports from component files
export default InstrumentPanel  // don't do this
```

### 5. One component per file

Each `.tsx` file exports one primary component. Supporting sub-components
(small presentational fragments) may co-exist in the same file but should be
unexported unless they are independently useful.

---

## Styling Rules

### Inline styles for dynamic values, class names for static layout

Score Studio uses no CSS-in-JS library (no emotion, styled-components, etc.).

```typescript
// ✓ Dynamic value → inline style
<div style={{ opacity: muted ? 0.4 : 1, backgroundColor: accent }} />

// ✓ Static layout → inline style object constant or className
const styles = {
  strip: { display: 'flex', flexDirection: 'column' as const, width: 56 },
} as const
<div style={styles.strip} />
```

Keep style objects outside the render function (as `const` at module level)
to avoid object recreation on every render.

---

## Accessibility Rules

Every interactive element must have an accessible name. This is both a usability
requirement and a testability requirement — tests use `getByRole({ name: })` to find
interactive elements. If the element has no accessible name, the test can't find it.

```typescript
// ✓ Accessible mute button
<button
  aria-label={`Mute ${trackName}`}
  aria-pressed={muted}
  onClick={onMute}
>
  M
</button>

// ✓ Accessible slider
<label htmlFor={`vol-${trackIndex}`}>Volume</label>
<input
  id={`vol-${trackIndex}`}
  type="range"
  min={0} max={1} step={0.01}
  value={volume}
  onChange={e => onVolume(parseFloat(e.target.value))}
/>

// ✗ Inaccessible — no name, no label
<button onClick={onMute}>M</button>
<input type="range" onChange={...} />
```

---

## Electron IPC Rules

**Never import directly from `'electron'` in renderer code.** The renderer process
does not have direct access to the Electron API. All IPC goes through the preload bridge.

```typescript
// ✓ Correct — use the preload bridge
window.electron.ipcRenderer.send('transport:play')
window.electron.ipcRenderer.on('engine:state', handler)

// ✗ Never do this in renderer
import { ipcRenderer } from 'electron'  // breaks in renderer process
```

**IPC channels are typed.** All channel names and payloads are defined in
`packages/gui/src/main/ipc-types.ts`. Never use string literals for channel names
outside that file — import the type.

---

## State Management Rules

### Lift state minimally

Don't add state to a component unless it owns that state. If two components need
the same state, lift it to their common ancestor.

### Callbacks, not shared state

Components communicate upward via callbacks (`onVolume`, `onMute`, `onChange`).
They never reach into sibling or parent components.

### `useEffect` discipline

- One concern per `useEffect`
- Always include a cleanup function if registering listeners or timers
- Dependencies array must be complete — no `eslint-disable` for exhaustive-deps

```typescript
// ✓ Cleanup always provided
useEffect(() => {
  const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [onClose])
```

---

## File Structure

```
packages/gui/
├─ src/
│  ├─ renderer/
│  │  ├─ components/
│  │  │  ├─ shared/         # Reusable components (MixerStrip, InstrumentPanel, etc.)
│  │  │  └─ <FeatureName>/  # Feature-specific (LiveCode/, SplashScreen/, etc.)
│  │  └─ lib/               # Pure renderer utilities (codePatcher, getActiveLines)
│  └─ main/                 # Electron main process
│     ├─ index.ts           # Main entry + IPC handlers
│     └─ ipc-types.ts       # Shared IPC channel type definitions
└─ tests/
   ├─ setup.ts              # Global test setup (canvas mock, IPC mock)
   └─ *.test.tsx            # One per component/utility
```

---

## Component Checklist (before submitting a PR)

- [ ] Functional component, `const` + arrow, no class
- [ ] Props typed as `readonly` named type (exported)
- [ ] All interactive elements have accessible names
- [ ] No direct `import ... from 'electron'` in renderer
- [ ] Style constants defined outside render
- [ ] `useEffect` cleanups present for all listeners/timers
- [ ] Test file exists with: rendering, interactions, props variants, edge cases
- [ ] Tests use `userEvent` not `fireEvent`
- [ ] Tests query by role/label/text (not `data-testid` unless necessary)
- [ ] `pnpm --filter @score/gui test` passes
- [ ] `pnpm --filter @score/gui typecheck` passes
