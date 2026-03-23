# Component: Piano Roll

**Status:** ⬜ Planned — Phase 11b
**Package:** `@score/gui`

## Purpose

Note grid showing active pitches per track over time.
Rows = pitches (C0–C8), columns = steps/bars.
Standard DAW piano roll view.

## Wireframe

```
┌─ Piano Roll ────────────────────────────────────────┐
│                                                      │
│  C5 │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  B4 │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  A4 │░░░░██████░░░░░░░░░░██████░░░░░░░░░░░░░░░░░░  │
│  G4 │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  F4 │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  E4 │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  D4 │██████░░░░░░░░░░██████░░░░░░░░░░░░░░░░░░░░░░  │
│  C4 │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│     └────────────────────────────────────────────  │
│      bar 1          bar 2          bar 3            │
└──────────────────────────────────────────────────────┘
```

## Behaviour

- Rows: chromatic pitches, labelled on left (C, D, E… with octave)
- Black key rows visually distinguished (darker background)
- Active notes highlighted per track colour
- Playhead cursor column advances with `engine:step`
- Scrollable vertically (pitch range) and horizontally (bars)

## Open Questions

- Multi-track overlay (all tracks on one roll, colour coded) or single track at a time?
- Read-only view or editable (click to add/remove notes)?
