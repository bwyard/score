# ADR 023 — Keyboard Shortcuts System

**Date:** 2026-03-23
**Status:** Proposed
**Deciders:** Project owner

---

## Context

Score Studio has 40+ interactive surfaces — mixer rows, the code editor, transport controls, export dialog, settings panel. Without a centralised shortcut system, keybindings scatter across components, conflict silently, and become impossible to document or customise. Power users expect full keyboard control; new users need a discoverable reference.

---

## Decision

Score Studio uses a **centralised shortcut registry** — a plain object constant:

```ts
const SHORTCUTS: Record<ShortcutId, ShortcutDef> = { ... }

type ShortcutDef = {
  keys: string[]        // e.g. ['Ctrl', 'Enter']
  description: string   // shown in the reference panel
  action: string        // dispatch identifier, NOT a function reference
}
```

The `action` field is a string identifier dispatched via the IPC bridge or a context reducer — never a direct function reference. This separates key-binding from behaviour and enables user overrides without touching component code.

**Built-in bindings:**

| Shortcut | Action | Description |
|---|---|---|
| Space | `transport.toggle` | Play / Stop |
| Ctrl+Enter | `eval.run` | Evaluate song file |
| Ctrl+Z | `history.undo` | Undo |
| Ctrl+Shift+Z | `history.redo` | Redo |
| Ctrl+S | `file.save` | Save |
| Escape | `panel.closeAll` | Close open panels |
| 1–4 | `mode.switch` | Switch view mode |

**User customisation:** overrides are stored in `score.json` under `"shortcuts": { "eval.run": ["Ctrl", "Shift", "Enter"] }`. Overrides merge with the registry at startup.

A `KeyboardShortcutsPanel` component (? icon or keyboard icon in toolbar) renders the full reference, grouped by category. The MCP server can read `SHORTCUTS` for documentation generation — this satisfies the MCP tool discoverability goal noted in project memory.

---

## Consequences

**Positive:**
- Single file of truth for all keybindings — no hunting across components
- Action-string dispatch means shortcuts work from any context (menu, panel, code editor)
- User customisation requires no code changes — only `score.json` edits
- MCP-readable registry enables automatic shortcut documentation

**Negative:**
- Action strings must be kept in sync with the dispatch layer — a typo in an action string fails silently
- Custom shortcuts stored in `score.json` are per-project, not global — users with multiple projects must set overrides in each (or use `~/.score/config.json`)

---

## Alternatives Considered

- **Per-component keybinding** — each component registers its own shortcuts. Rejected: conflicts are undetectable; no central reference possible.
- **Function references in registry** — `action: () => evalSong()`. Rejected: prevents serialisation for user overrides; couples registry to runtime context.
- **Electron globalShortcut API** — system-level shortcuts active even when Score Studio is not focused. Rejected: inappropriate for media keys; Space would intercept other applications.
