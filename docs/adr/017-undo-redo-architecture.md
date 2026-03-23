# ADR 017 — Undo/Redo Architecture

**Date:** 2026-03-23
**Status:** Proposed
**Deciders:** Project owner

---

## Context

Score Studio writes GUI interactions back to the song file as chain method calls via `codePatcher` (ADR 014). Undo must reverse both the code change and the live audio state simultaneously. Traditional undo systems use a command pattern (Command, CommandHistory classes) — this is incompatible with Score's zero-class, functional constraint (ADR 001).

---

## Decision

Score Studio uses an **immutable code-string history** for undo/redo.

The undo buffer is a plain array of code strings — the raw editor content at each saved point:

```ts
const undoStack: string[] = []
const redoStack: string[] = []
```

**On every `codePatcher` call:**
1. Push the pre-change code string onto `undoStack`
2. Clear `redoStack`
3. Apply the patch, set editor content, trigger eval

**Ctrl+Z (undo):**
1. Pop from `undoStack` → push current code onto `redoStack`
2. Set editor content to popped string
3. Trigger eval — audio state is restored as a side effect

**Ctrl+Shift+Z (redo):** symmetric pop from `redoStack`.

Maximum stack depth: **50 entries**. Oldest entries are dropped when the limit is reached.

Re-eval on undo is acceptable because eval completes in < 50ms and is the existing hot-swap path (ADR 007). There is no separate "undo audio" logic — restoring the code string and re-evaluating achieves both in one step.

**Anti-decision:** Do NOT implement a command pattern with `Command` or `CommandHistory` constructs. This would introduce classes and mutable object state — both forbidden by ADR 001.

---

## Consequences

**Positive:**
- No command-pattern infrastructure; zero classes required
- Code and audio state are always in sync after undo — single re-eval achieves both
- The undo buffer is inspectable as a plain array — trivially serialisable if needed
- Consistent with the thesis: code is the source of truth; undoing means restoring prior code

**Negative:**
- Each undo entry is a full code string — memory cost scales with file size × depth (acceptable for typical song files < 5 KB)
- Undo granularity is per-`codePatcher` call, not per-character — mid-type undo is not supported
- Redo stack is cleared on any new edit — standard UX but may surprise users

---

## Alternatives Considered

- **Command pattern** — `Command` objects with `execute`/`undo` methods. Rejected: requires classes; would need per-method inverse logic for 40+ chain methods.
- **AST-level diffing** — parse song.ts to AST, store AST diffs. Rejected: overkill; adds a parser dependency and defeats the "code string is truth" principle.
- **Disk-based undo** — write each undo state to a temp file. Rejected: I/O latency; unnecessary when in-memory fits within 50 × 5 KB ≈ 250 KB.
