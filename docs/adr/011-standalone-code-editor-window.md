# ADR 011 — Standalone Code Editor Window (`score edit`)

## Status
Proposed

## Context

Score Studio is a full IDE: code editor, mixer, visualizer, DJ deck, all in one window. For live performance and focused coding sessions, users want a minimal "code-only" window without the full production UI — launched directly from the command line.

Use cases:
- `score edit <songfile>` — open a file and code, eval on save or Ctrl+Enter, output in a side panel
- Multi-monitor setup — code on one screen, Score Studio production view on another
- Algorave / live performance — full-screen code window, audience sees code + output visualization only
- Quick iteration without opening the full IDE

The panel pop-out architecture (ADR 006) handles detaching any panel from within Score Studio. This ADR covers launching a standalone editor as a first-class CLI entry point, separate from the full Score Studio launch.

## Decision

Add a `score edit [songfile]` command to `@score/cli` that launches a minimal Electron window in **code-only mode**:

- Reuses the same Electron shell and IPC bridge as Score Studio (ADR 009)
- Opens with only the Monaco code editor panel and an eval output console — no mixer, no visualizer, no DJ deck
- Mode is passed via IPC on window creation: `{ mode: 'code-only', file: '<path>' }`
- Eval runs on `Ctrl+Enter` (line/selection) or `Ctrl+Shift+Enter` (full file)
- Output (log lines, errors, ScoreError messages) streams to a collapsible console panel below the editor
- Audio plays through the same engine as Score Studio — no separate audio context
- Window title: `Score — <filename>`

### CLI interface

```bash
score edit                          # open blank editor
score edit path/to/song.js          # open file
score edit path/to/song.js --eval   # open and eval immediately on launch
```

### Relation to Score Studio

`score studio` and `score edit` share:
- The same Electron main process shell
- The same IPC bridge (ADR 009)
- The same eval sandbox (ADR 008)
- The same audio engine

They differ only in which panels are rendered. Score Studio loads the full workspace layout; `score edit` loads the `code-only` layout preset.

A future `score studio --mode code` flag is equivalent to `score edit` with no file argument.

### Multi-monitor workflow

When both windows are open simultaneously:
- Each has its own Monaco instance and eval scope
- Audio context is shared — both windows drive the same engine
- Song state is not synced between windows (separate eval scopes)
- This is intentional: two independent live coding streams is a valid performance pattern

## Consequences

- Reduces barrier to entry — `score edit mysong.js` is a one-liner to start coding
- Enables clean multi-monitor setups without running two full Score Studio instances
- Consistent with the thesis: the code editor is the primary interface; everything else is optional UI
- Requires Electron window creation to accept a `mode` parameter — small addition to the IPC bridge
- No new dependencies — Electron and Monaco are already present

## Notes

- `score repl` (browser-based, no Electron) is a lighter alternative worth revisiting post-Phase 13
- Panel pop-out (ADR 006) and standalone `score edit` are complementary, not competing
