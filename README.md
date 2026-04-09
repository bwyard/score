# Score

[![CI](https://github.com/bwyard/score/actions/workflows/ci.yml/badge.svg)](https://github.com/bwyard/score/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](./LICENSE)
[![Node ≥20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org)

> A production-grade, component-based EDM audio framework. Write music as code in TypeScript — no samples, no MIDI files, no drag-and-drop. Every note, pattern, and arrangement is a pure function of time.

**Author:** Bree Yard — [breeyard.dev](https://breeyard.dev)
**Status:** Phase 13 of 17 — stable core, Score Studio GUI in active development

<!-- TODO: add a GIF or screenshot of Score Studio here once captured -->
<!-- ![Score Studio](./docs/assets/score-studio.gif) -->

---

## What is Score?

Score is a professional music production framework and a live coding environment built on the Web Audio API.

**As a framework** — 15 TypeScript packages covering synthesis, effects, sequencing, mixing, modulation, MIDI, and an Electron GUI. Built with a strict functional architecture: no classes, no mutation, every component is a factory function.

**As a language** — song files are plain ESM. Import instruments, chain methods, export a `Song`. The engine evaluates it and plays it. Live reload while you write.

The core thesis: **a song is a pure function of time.** No AI generates musical content — ever.

---

## Song files look like this

```js
import { Song, Kick808, Snare909, Hihat808, Bass303, Pad } from '@score/dsl'

const kick  = Kick808(4).volume(0.8)
const snare = Snare909(2).volume(0.55)
const hihat = Hihat808(8).volume(0.25)

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

Chain methods are fully type-safe — `Bass303().cutoff(600).volume(0.8)` returns `Bass303Part`, sub-type methods preserved through every composition step.

---

## Score Studio

Score Studio is the Electron-based live coding environment that ships with Score.

<!-- TODO: replace with actual demo link once deployed -->
<!-- **[→ Try the tester demo](https://score-tester.breeyard.dev)** -->

- **Live Code editor** — edit code, hit Ctrl+Enter, hear changes immediately
- **Punchcard grid** — click steps to toggle hits; changes write back to the editor
- **Mixer** — per-track volume and mute faders; drag to update `.volume()` in code
- **Performance mode** — full-screen audio visualizer, theme declared in the song file
- **Bug reporting** — in-app report button captures logs, code, and engine state

```bash
# Start Score Studio
pnpm --filter @score/gui dev
```

---

## CLI

```bash
score play <song.js>           # Play a song file
score play <song.js> --watch   # Live reload on save
score new song <name>          # Create a new song from template
score list <song.js>           # Show song info and track list
score export <song.js>         # Render to WAV
score repl                     # Interactive REPL
score doctor                   # Check system requirements
```

---

## Packages

| Package | Purpose |
|---|---|
| `@score/core` | Audio context backend, ScoreError, UID |
| `@score/components` | Kick808/909, Snare909, Hihat808, FMSynth, SubtractiveSynth, Bass303, Pad, Rhodes, Pluck, WobbleBass |
| `@score/effects` | Reverb, Delay, Filter, Compressor, EQ, Distortion, Chorus, Phaser, Flanger, Limiter, Gate, Saturation, AutoPan, BitCrusher, StereoWidener |
| `@score/instruments` | Instrument registry — kick, snare, hihat, synth, arp, subsynth, pad, sample |
| `@score/dsl` | Song, chain API (Bass303, Pad, Kick808, etc.), arrangement blocks, modulation descriptors |
| `@score/sequencer` | Transport, clock, step sequencer |
| `@score/mixer` | Channel strips, return bus, master chain |
| `@score/modulation` | LFO, ADSR, automation, ramp, chaos sources |
| `@score/math` | Chaos math — Lorenz attractor, logistic map, Ornstein-Uhlenbeck process |
| `@score/pattern` | Euclidean rhythms, reverse, shift, degrade, swing |
| `@score/musical` | Music theory — scales, chord resolution, frequency mapping |
| `@score/visuals` | Visual themes, audio-reactive canvas rendering |
| `@score/midi` | WebMIDI bridge, Pioneer XDJ-RX3 profile |
| `@score/session` | Jam session, live patch updates |
| `@score/cli` | play, repl, list, export, new, doctor commands |
| `@score/mcp` | MCP server for Claude Code integration |
| `@score/gui` | Score Studio — Electron DAW |

---

## Architecture

Score is a strict functional TypeScript monorepo built with Turborepo and pnpm workspaces.

- **Zero classes** — every component is a factory function returning a plain object
- **No mutation** — config objects are never mutated; state is threaded explicitly
- **Web Audio API** — all synthesis runs in the audio thread, scheduled against `audioContext.currentTime`
- **Hardware boundary pattern** — audio nodes are the only mutable state; everything above is pure
- **Test coverage** — 90/85/90/90 thresholds enforced in CI (statements/branches/functions/lines)

---

## Development

```bash
pnpm install

# Build all library packages (Turborepo, cached)
pnpm turbo build --filter='!@score/gui'

# Run all tests
pnpm test

# Type-check everything
pnpm typecheck

# Lint
pnpm lint

# Start Score Studio
pnpm --filter @score/gui dev
```

**Node.js 20 LTS** and **pnpm 10+** required.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
To report a security issue see [SECURITY.md](./SECURITY.md).

---

## License

Apache License 2.0 — use freely in personal, commercial, and open source projects. See [LICENSE](./LICENSE).
