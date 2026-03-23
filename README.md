# Score

> A production-level, component-based audio framework for creating EDM music in JavaScript.

**Status:** Active development — Phase 13 (GUI + bidirectional wiring). Score Studio running. Friday demo target: full band playable in GUI.

---

## What is Score?

Score is two things simultaneously:

1. **A framework** (TypeScript) — the engine, components, effects, sequencer, mixer, CLI, and GUI
2. **A language** (plain JavaScript) — the song file format that musicians and developers use to write music as code

The core philosophy: **a song is a pure function of time.** Every note, pattern, effect value, and arrangement decision is written by hand. No AI generates any musical content — ever.

Score is part of a larger ecosystem. See [ROADMAP.md](./docs/ROADMAP.md) for the full picture.

---

## Song files look like this

```js
import { Song, Kick808, Snare, HiHat, Bass303, Pad } from '@score/dsl'

// Drums — pattern array (1 = hit, 0 = rest)
const kick  = Kick808({ pattern: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], volume: 0.75 })
const snare = Snare({   pattern: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], volume: 0.5  })
const hihat = HiHat({   pattern: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], volume: 0.2  })

// Melodic — chain API
const bass = Bass303('A2')
  .filter(600)
  .resonance(0.4)
  .pattern([1,0,0,0, 0,0,1,0, 1,0,0,0, 0,1,0,0])
  .volume(0.7)

const pad = Pad('A3')
  .attack(0.3)
  .release(1.2)
  .reverb(0.3)
  .volume(0.35)

export default Song({ bpm: 128, tracks: [kick, snare, hihat, bass, pad] })
```

---

## Score Studio (GUI)

Score Studio is the Electron-based GUI that ships with Score. It runs your song file live — edit code on the left, hear and see changes in real time.

- **Live Code mode** — code editor wired to the engine. BPM and step changes sync back into the code.
- **Performance mode** — full-screen audio visualizer. Theme declared in song file.
- **Punchcard grid** — click steps to toggle them. Changes write back to the song file.
- **Instrument panel** — adjust chain parameters live.

```bash
# From the score repo
cd packages/gui && pnpm dev
```

---

## CLI

```bash
score play <song.js>              # Play a song file
score play <song.js> --watch      # Live reload on every save
score new song <name>             # Create a new song from template
score list <song.js>              # Show song info and track list
score export <song.js>            # Render to WAV
score repl                        # Interactive REPL
score doctor                      # Check system requirements
```

---

## Packages

| Package | Purpose |
|---|---|
| `@score/core` | AudioContext, AudioGraphManager, ScoreError |
| `@score/components` | Kick, Snare, HiHat, Synth, FMSynth, SubtractiveSynth |
| `@score/effects` | Reverb, Delay, Filter, Compressor, Sidechain, EQ, Phaser |
| `@score/dsl` | Song, Track, chain API (Bass303, Pad, Pluck, Rhodes) |
| `@score/sequencer` | Transport, Clock, TempoMap, TemporalTick |
| `@score/mixer` | Mixer, Channel, return bus, master chain |
| `@score/math` | Chaos, fractals, stochastic (Lorenz, logistic map, OUProcess) |
| `@score/modulation` | LFO, ADSR, ramp/sine, automation wiring |
| `@score/pattern` | Euclidean rhythms, combinators, permutations |
| `@score/visuals` | Visual themes, rendering targets, per-song canvas |
| `@score/cli` | play, repl, list, export, new, doctor |
| `@score/midi` | WebMIDI bridge, Pioneer XDJ profiles |
| `@score/session` | Jam session, WebSocket sync |
| `@score/mcp` | MCP servers for Claude Code integration |
| `@score/gui` | Score Studio — Electron DAW interface |

---

## Requirements

- Node.js 20+
- pnpm 10+

---

## License

Open source — license TBD. Author: Bree Yard.
