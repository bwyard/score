# ADR-031 — DraggablePanel Layout System

**Status:** Accepted
**Date:** 2026-03-29
**Tickets:** t150, t151, t347
**Author:** score-w5

---

## Context

Score Studio has 7 floating panels: Punchcard (step grid), Scope (oscilloscope), Spectrum (FFT),
Piano Roll, Mixer, Console, and Reference. All are implemented as `DraggablePanel` components —
free-float, draggable by title bar, resizable via bottom-right handle, with keyboard nav
(Arrow to move, Shift+Arrow to resize, Escape to close).

Layout persistence is already wired (t218): each panel has a `panelId`, reports position via
`onMoved` callback, saved to disk via IPC `layout:save` / `layout:load`. Format: flat JSON map of
`panelId → { x, y, w, h }`.

Three layout models were evaluated before this decision:

| Model | Examples | Tradeoff |
|---|---|---|
| **Free-float with snap** | FL Studio, Max/MSP | Maximum flexibility; snap gives ergonomics without constraint |
| **Fixed zones / docked** | Ableton Live, Logic Pro | Fast for standard workflows; removes expressiveness |
| **Docker / tabbed containers** | Reaper, VSCode | Most powerful; highest complexity and implementation cost |

---

## Decision

**Free-float with edge snap and 16px grid snap.**

Score is a live performance tool first. Fixed zones would lock panels into positions that may not
suit a given set or stage configuration. Docked containers add structural complexity that is not
justified by the use case. Free-float with snap gives ergonomics (panels align cleanly) without
removing the performer's ability to arrange the workspace for their show.

VSCode-style docking is explicitly rejected for now. It may be revisited if the Produce mode
(timeline + clips) is implemented, where a more structured layout may be appropriate.

---

## Layout Model

### Snap behaviour

- **Grid snap (16px):** panel position snaps to 16px grid during drag. Aligns with keyboard step
  — `KEYBOARD_STEP` in `DraggablePanel.tsx` should be updated from 10 to 16 to match.
- **Edge snap (16px threshold):** when a panel is dragged within 16px of the viewport edge,
  it snaps flush to that edge.
- **Panel-to-panel snap:** deferred — not in this ADR. Track as t151 follow-on.
- **Free override:** holding Shift during drag bypasses snap for pixel-precise placement.

### Default layout

Panels open at sensible defaults when no saved layout exists:

| Panel | Default position | Default size |
|---|---|---|
| Punchcard | top-right | 480 × 160 |
| Scope | mid-right | 240 × 180 |
| Spectrum | mid-right (beside Scope) | 240 × 180 |
| Mixer | lower-right | 480 × 220 |
| Console | bottom strip (fixed) | full width × 120 |
| Piano Roll | floating centre | 480 × 240 |
| Reference | floating right | 320 × 400 |

Console is the only panel that starts as a **fixed bottom strip** — not draggable by default.
It may be promoted to a DraggablePanel in a future ADR if performers need to reposition it.

### Lock layout (performance mode)

A **lock layout** toggle freezes all panel positions during performance. When locked:
- Drag and resize gestures are disabled
- Keyboard move/resize shortcuts are disabled
- Close buttons are hidden
- A visible "LOCKED" indicator appears in the toolbar

This is the key distinction from FL Studio's pure free-float model. Score needs stability
during a live set — accidental drags should not interrupt a performance.

Lock state is not persisted — it resets to unlocked on each launch.

---

## Persistence Format

The existing `layout:save` / `layout:load` IPC format is kept unchanged:

```ts
type PanelLayout = {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

type PanelLayoutMap = Record<string, PanelLayout>
```

No migration needed. Snap config (grid size, edge threshold) is hardcoded in `DraggablePanel` —
not persisted per-panel.

---

## Keyboard Navigation

`DraggablePanel` already implements:
- **Arrow keys** — move panel by `KEYBOARD_STEP` px
- **Shift + Arrow** — resize panel by `KEYBOARD_STEP` px
- **Escape** — close panel (if `onClose` is provided)

Change required: align `KEYBOARD_STEP` from `10` to `16` to match grid snap increment.

---

## Data Structure Changes

`DraggablePanel` receives two new optional props:

```ts
/** Snap to 16px grid during drag. Default: true. */
readonly snapToGrid?: boolean

/** Snap to viewport edges within 16px threshold. Default: true. */
readonly snapToEdge?: boolean
```

Both default to `true`. Set to `false` for panels where pixel-precise free placement is needed.
`PanelLayout` storage format is unchanged — snap is a runtime behaviour, not a saved property.

---

## Open Questions

1. **Panel-to-panel snap** — should panels snap to the edges of other panels (magnetic snap)?
   Deferred. Track as t151 follow-on.

2. **Lock layout shortcut** — what key triggers lock? Candidate: `Ctrl+L` or toolbar toggle.
   Needs keyboard shortcut ADR (ADR-023) cross-reference before assigning.

3. **Reset to default layout** — should there be a "reset layout" option in the toolbar?
   Useful for performers who accidentally drag everything offscreen. Low-cost to add.

4. **Live Play API alignment** — when the Live Play API (t373) is implemented, live code
   streams will need their own panel layout preset separate from the arrangement layout.
   This ADR governs the panel mechanism; the Live Play preset is out of scope here.

---

## Modes Not in Scope (notated for future ADRs)

Score has multiple planned modes beyond LiveCode. This ADR governs the panel layout mechanism
only. Mode-specific panel presets are out of scope and tracked separately (t376, t177):

| Mode | Panel layout notes |
|---|---|
| **LiveCode** (current) | Free-float + snap. Console fixed bottom. Code editor primary surface. |
| **Performance / Algorave** | Full-screen code + visualizers. All chrome hidden. Lock layout by default. |
| **Produce** | Timeline + clips centre. Fixed zones may be appropriate here — revisit docking. |
| **DJ Set** | Deck A/B primary. Mixer always visible. Minimal panels. |
| **Jam** | MIDI grid primary. Piano roll docked bottom. |

Mode = saved panel layout preset, not a locked silo. Switching modes restores a saved layout.
The underlying `DraggablePanel` mechanism is identical across all modes.
