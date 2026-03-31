# Score

> A production-level, component-based EDM audio framework for creating music as code in TypeScript/JavaScript.

**Author:** Bree Yard
**Status:** Active development — Phase 13 (Score Studio GUI). Tester release in progress.

---

## What is Score?

Score is two things simultaneously:

1. **A framework** (TypeScript) — the engine, instruments, effects, sequencer, mixer, CLI, and GUI
2. **A language** (plain ESM) — the song file format that musicians and developers use to write music as code

The core philosophy: **a song is a pure function of time.** Every note, pattern, effect value, and arrangement decision is written by hand. No AI generates any musical content — ever.

---

## Song files look like this

```js
import { Song, Kick808, Snare909, Hihat808, Bass303, Pad } from '@score/dsl'

// Drums — euclidean shorthand: Kick808(n) spreads n hits over 16 steps
const kick  = Kick808(4).volume(0.8)
const snare = Snare909(2).volume(0.55)
const hihat = Hihat808(8).volume(0.25)

// Or explicit step indices
// const kick = Kick808().hits(0, 4, 8, 12).volume(0.8)

// Melodic — note array pattern: strings are pitches, 0 is a rest
const bass = Bass303('A2')
  .cutoff(600)
  .resonance(0.4)
  .pattern(['A2', 0, 0, 0, 'D3', 0, 0, 0])
  .volume(0.7)

const pad = Pad('A3')
  .attack(0.3)
  .release(1.2)
  .reverb(0.3)
  .volume(0.4)

export default Song({ bpm: 128, tracks: [kick, snare, hihat, bass, pad] })
```

Chain methods are fully type-safe. `Bass303().cutoff(600).volume(0.8)` returns `Bass303Part` — sub-type methods are preserved through every composition step.

---

## Score Studio (GUI)

Score Studio is the Electron-based GUI that ships with Score. Edit code on the left, hear and see changes in real time.

- **Live Code mode** — code editor wired to the engine. Ctrl+Enter evals. BPM, step toggles, and mixer changes write back to the code.
- **Performance mode** — full-screen audio visualizer. Theme declared in song file.
- **Punchcard grid** — click steps to toggle. Changes write back to the editor.
- **Mixer** — per-track volume/mute faders. Drag to update `.volume()` in code.
- **Import toggle** — hide/show the import block for a cleaner editing view.

```bash
# From the score repo root
pnpm --filter @score/gui dev
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
| `@score/core` | AudioContext backend, ScoreError, UID |
| `@score/components` | Kick808/909, Snare909, Hihat808, FMSynth, SubtractiveSynth, Bass303, Pad, Rhodes, Pluck |
| `@score/effects` | Reverb, Delay, Filter, Compressor, EQ, Distortion, Chorus, Phaser, Flanger, Limiter, Gate, Saturation, AutoPan, BitCrusher, StereoWidener |
| `@score/dsl` | Song, Track, chain API (Bass303, Pad, Pluck, Rhodes, Kick808, etc.), `ChainMethods<T>` |
| `@score/sequencer` | Transport, step sequencer, bar callbacks |
| `@score/mixer` | Mixer, channel strips, return bus, master chain |
| `@score/math` | Chaos math — Lorenz, logistic map, OUProcess (stochastic basis) |
| `@score/modulation` | LFO, ADSR, ramp/sine/OU, automation wiring |
| `@score/pattern` | Euclidean rhythms, combinators, reverse, shift, degrade |
| `@score/visuals` | Visual themes, rendering targets, per-song canvas |
| `@score/cli` | play, repl, list, export, new, doctor |
| `@score/midi` | WebMIDI bridge, Pioneer XDJ profiles |
| `@score/session` | Jam session, WebSocket sync |
| `@score/mcp` | MCP tools for Claude Code integration |
| `@score/gui` | Score Studio — Electron DAW interface |

---

## Development

```bash
# Install dependencies
pnpm install

# Build all library packages (Turborepo, cached)
pnpm turbo build --filter='!@score/gui'

# Run all tests
pnpm test

# Type-check everything
pnpm typecheck

# Start Score Studio (Electron dev server)
pnpm --filter @score/gui dev
```

**Node.js 20 LTS** and **pnpm 10+** required.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating. To report a security issue, see [SECURITY.md](./SECURITY.md).

---

## License

Apache License 2.0. Use freely — personal, commercial, open source. See [LICENSE](./LICENSE). Author: Bree Yard.
