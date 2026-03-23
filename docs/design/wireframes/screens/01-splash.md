# Screen: Splash / Mode Select

**Status:** ✅ In scope — tester release
**Phase:** 13
**Route:** App entry point

## Purpose

First screen the artist sees. Select a mode and hardware level before entering the studio.

## Wireframe

```
┌─────────────────────────────────────┐
│           SCORE STUDIO              │
│                                     │
│  ┌──────────┐  ┌──────────┐         │
│  │ Live Code│  │ Produce  │         │
│  │  ACTIVE  │  │ DISABLED │         │
│  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐         │
│  │  DJ Set  │  │   Jam    │         │
│  │ DISABLED │  │ DISABLED │         │
│  └──────────┘  └──────────┘         │
│                                     │
│  Hardware: [Headphones ▾]           │
│                    [ Enter Mode → ] │
└─────────────────────────────────────┘
```

## Behaviour

- Live Code is pre-selected on load
- Start button enabled immediately (pre-selection, no click required)
- Disabled modes are visually greyed out — not clickable
- Hardware selector: Headphones / Studio Monitors / PA System / XDJ-RX3 / XDJ-XZ
- Clicking a disabled mode shows tooltip: "Coming soon"

## Tester Release Notes

- Only Live Code enabled for tester release (t158)
- Produce, DJ Set, Jam greyed out with "Coming soon" tooltip
- Hardware selector present but only affects audio routing — no MIDI required

## Open Questions

- Should disabled modes be hidden entirely or visible-but-greyed?
- Should hardware level be skippable (default to Headphones silently)?
