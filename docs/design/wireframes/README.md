# Score Studio — Wireframes

Text-based wireframe specs for Score Studio (Electron GUI).
Intended for sketching in Excalidraw before implementation.

## Release Status

| Screen | Mode | Tester Release | Phase |
|---|---|---|---|
| [Splash](screens/01-splash.md) | Mode select | ✅ In scope | Phase 13 |
| [Live Code](screens/02-live-code.md) | Code editor + visualizers | ✅ In scope | Phase 13 / 11b |
| [Produce](screens/03-produce.md) | Arrangement + mixer | ⬜ Future | Phase 13b+ |
| [DJ Set](screens/04-dj-set.md) | Two-deck + crossfader | ⬜ Future | Phase 12e |
| [Jam Session](screens/05-jam-session.md) | MIDI hardware session | ⬜ Future | Phase 12b |

## Shared Components

| Component | Doc |
|---|---|
| TransportBar | [components/transport-bar.md](components/transport-bar.md) |
| Panel System | [components/panel-system.md](components/panel-system.md) |
| Step Grid | [components/step-grid.md](components/step-grid.md) |
| Waveform | [components/waveform.md](components/waveform.md) |
| Spectrum | [components/spectrum.md](components/spectrum.md) |
| Piano Roll | [components/piano-roll.md](components/piano-roll.md) |

## Layout Principles

- All panels are draggable and resizable (t146)
- Default layout defined per mode — artists can rearrange
- VSCode-style docking on roadmap
- TransportBar is always pinned to top — never moveable
- Disabled modes shown greyed out on splash (t158)
