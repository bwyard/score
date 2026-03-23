# Screen: DJ Set Mode

**Status:** ⬜ Future — not in tester release
**Phase:** 12e
**Route:** Entered from splash → DJ Set

## Purpose

Two-deck performance view. Each deck can be either a running **Song engine** (live-coded,
pure math synthesis) or a **Sample deck** (audio file player). Both deck types are equal
citizens — both feed a GainNode, and the crossfader adjusts the pair. A full DJ set can
be a `.ts` file, version controlled, no audio files required.

Live Code and DJ Set share the same Song engine. A Code Deck in DJ Set is a Song running
in a lane — the same hot-swap interaction model applies (Ctrl+Enter at bar boundary).

Screen projection of the Monaco editor and visualizers IS the performance (algorave style).
The visuals are not supplementary — they are part of the art.

## Wireframe — Dual Deck (Code Deck A + Sample Deck B)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Score  [DJ Set]  ●140bpm  ▶ Play  ■ Stop  Bar:8                   │  ← TransportBar
├──────────────────────────────┬───────────────────────────────────────┤
│  DECK A          [CODE DECK ▼]│  DECK B          [SAMPLE DECK ▼]    │
│  Song: set-a.ts               │  File: —                             │
│  BPM: 140  Key: Am            │  BPM: —   Key: —                     │
│                               │                                      │
│  ┌─ Monaco Editor ──────────┐ │  ┌─ Waveform ──────────────────┐    │
│  │ const kick = Kick({      │ │  │  ░░░░░░░░░░░░░░░░░░░░░░░░   │    │
│  │   pattern: [1,0,0,0],    │ │  │  [Drag audio file here]     │    │
│  │   volume: 0.9            │ │  └─────────────────────────────┘    │
│  │ })                       │ │                                      │
│  │ export default Song({    │ │  [▶ CUE] [▶ PLAY]                   │
│  │   bpm: 140,              │ │  [LOOP ←][LOOP →]                   │
│  │   tracks: [kick]         │ │  [hot cue 1-4]                      │
│  │ })                       │ │                                      │
│  └──────────────────────────┘ │  Hi  ──●──                          │
│                               │  Mid ──●──                          │
│  ┌─ Spectrum ───────────────┐ │  Lo  ──●──                          │
│  │  ▁▂▄▇█▇▄▂▁               │ │                                      │
│  └──────────────────────────┘ │                                      │
│  ┌─ Waveform ───────────────┐ │                                      │
│  │  ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿        │ │                                      │
│  └──────────────────────────┘ │                                      │
│                               │                                      │
│  Hi  ──●──                    │                                      │
│  Mid ──●──                    │                                      │
│  Lo  ──●──                    │                                      │
├───────────────────────────────┴──────────────────────────────────────┤
│              [───────────────●───────────────]                       │
│                          Crossfader                                  │
│              Gain A ──●──          Gain B ──●──                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Deck Type Toggle

Each deck has a **[CODE DECK ▼] / [SAMPLE DECK ▼]** toggle in its header. Switching
changes the deck's content area:

| Deck Type | Content Area | Load Target |
|---|---|---|
| Code Deck | Monaco editor + Spectrum + Waveform visualizers | `.ts` song file or live-typed code |
| Sample Deck | Waveform + file loader | Audio file (WAV, AIFF, MP3, FLAC) |

A set can be any combination: Code+Code, Sample+Sample, or Code+Sample (shown above).

## Layout

| Zone | Content |
|---|---|
| Top-left | Deck A — type toggle, content area (editor or waveform), EQ |
| Top-right | Deck B — type toggle, content area (editor or waveform), EQ |
| Bottom | Crossfader + per-deck gain |

## Code Deck Behaviour

- Loads a `.ts` song file from disk, or accepts live-typed code
- Same hot-swap model as Live Code: Ctrl+Enter applies changes at next bar boundary
- Visualizers (Spectrum, Waveform, Step Grid) render the running Song in real time
- Song engine is shared with Live Code mode — no separate runtime
- BPM is read from `Song({ bpm: ... })` and displayed in the deck header
- Code deck output feeds the deck's GainNode exactly as a sample deck does

## Sample Deck Behaviour

- Drag-and-drop audio file onto the waveform area to load
- Auto-BPM detection and musical key detection (harmonic mixing)
- Hot cues + loop points
- Deck A ↔ B BPM sync (master/slave)
- XDJ-RX3 / XDJ-XZ hardware profiles (Phase 12)

## Signal Flow

```
Deck A (Song engine or AudioBufferSourceNode)
  └── GainNode A ──┐
                   ├── CrossfaderNode ── Master GainNode ── AudioContext.destination
Deck B (Song engine or AudioBufferSourceNode)
  └── GainNode B ──┘
```

Both deck types connect identically to the signal chain. The crossfader has no knowledge
of whether a deck is running a Song or playing a file.

## Set File Format

A full DJ set is a `.ts` file. Code decks are embedded inline. Sample decks reference
file paths. The entire performance is reproducible and version-controlled:

```ts
// set-friday.ts
import { DJSet, CodeDeck, SampleDeck } from '@score/dj'

export default DJSet({
  bpm: 140,
  decks: [
    CodeDeck({ song: './songs/techno-a.ts' }),
    SampleDeck({ file: './samples/break.wav' }),
  ],
})
```

## Features (Phase 12e scope)

- Code Deck / Sample Deck toggle per deck
- Code Deck: Monaco editor, hot-swap at bar boundary (shared Song engine)
- Code Deck: Spectrum + Waveform visualizers live-rendering the running Song
- Sample Deck: auto-BPM detection, key detection, hot cues, loop points
- Track library / crate management (sample files)
- Deck A ↔ B BPM sync (master/slave)
- Crossfader + per-deck EQ (Hi/Mid/Lo) and gain
- Set recording to WAV
- `.ts` set file format — version controlled, no audio files required for Code Deck sets
- XDJ-RX3 / XDJ-XZ hardware profiles (Phase 12)
