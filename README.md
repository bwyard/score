# Score

> A production-level, component-based audio framework for creating EDM music in JavaScript.

**Status:** Active development — Phases 1–12 (scaffold) complete. Phase 12b (jam session) next.

---

## What is Score?

Score is two things simultaneously:

1. **A framework** (TypeScript) — the engine, components, effects, sequencer, mixer, CLI, and GUI that power everything
2. **A language** (plain JavaScript) — the song file format that musicians and developers use to write music as code

The core philosophy: **music is code, code is music.** Every note, pattern, effect value, and arrangement decision is written by hand. No AI generates any musical content — ever.

## Song files look like this

```js
import { Song, Kick, Synth, Sequence, Intro, Drop, Outro } from '@score/dsl'

const kick = Kick({
  pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  volume: 0.9,
})

const bass = Synth({
  wave: 'sawtooth',
  filter: { type: 'lowpass', frequency: 800 },
  sequence: Sequence('A1 A1 . C2 . G1 . .'),
})

export default Song({
  bpm: 140,
  key: 'Am',
  genre: 'techno',
  tracks: [kick, bass],
  arrangement: [Intro(4, [kick]), Drop(16, [kick, bass]), Outro(4, [kick])],
})
```

## Deterministic Reproducibility

Score's thesis is that **a song is a pure function of time** — same inputs always produce identical output. Stochastic pattern functions (`degrade`, `humanize`, `drunk`) draw from a seeded PRNG provided by [`@prime/prime-random`](../prime/packages/prime-random), a sibling workspace dependency. Calling `Song({ seed: 42 })` always produces the exact same patterns, timings, and arrangement on every run. If no seed is provided, Score falls back to `Date.now()` and logs the generated seed to the console so any session can be reproduced exactly by passing that value back as `seed`.

## CLI commands

| Command                              | What it does                                    |
| ------------------------------------ | ----------------------------------------------- |
| `score play <song.js>`               | Play a song file                                |
| `score play <song.js> --watch`       | Live reload — hot-swap on every file save       |
| `score repl`                         | Interactive REPL — load, play, patch live       |
| `score list <song.js>`               | Show song info and track list                   |
| `score export <song.js>`             | Render song to WAV                              |
| `score export <song.js> --bars 16`   | Render a fixed number of bars                   |
| `score new song <name>`              | Create a new song from template                 |
| `score doctor`                       | Check system requirements                       |

### Watch mode

`--watch` reloads on every save. If the new file has an error, the previous version keeps playing. Add `--trust` to skip the AST security scan on each reload.

Score diffs the incoming song against the running engine: BPM and per-track volume changes apply live without a restart. Structural changes (new tracks, different instruments) trigger a full engine swap at the next bar boundary.

### REPL commands

```
load <file>         Load a song file (.js / .mjs)
play                Start playback
stop                Stop playback
patch bpm=<n>       Change BPM live
patch vol=<n>       Change master volume live (0–1)
status              Show loaded file, BPM, bar count, play state
help                Show this list
exit                Quit
```

## Target genres

House · Deep House · Techno · Industrial · Hardcore · Grime

## Packages

| Package            | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `@score/core`      | AudioContext, AudioGraphManager, ScoreError                    |
| `@score/components`| Kick, Snare, HiHat, Synth, Sample, Theremin, Sax, Arp         |
| `@score/effects`   | Reverb, Delay, Filter, Compressor, Sidechain, EQ, Phaser, etc. |
| `@score/dsl`       | Song, Track, Sequence, arrangement section factories           |
| `@score/sequencer` | Transport, Clock, TempoMap, Swing/Groove                       |
| `@score/mixer`     | Mixer, Channel, return bus, master chain, hard limiter         |
| `@score/math`      | Chaos, fractals, stochastic processes, tuning, transforms      |
| `@score/modulation`| LFO, ADSR, ramp/sine/cosine sources, automation wiring         |
| `@score/pattern`   | Pattern combinators, Euclidean rhythms, permutations           |
| `@score/musical`   | Natural language instrument description (`describe()`)         |
| `@score/cli`       | play, repl, list, export, new, doctor commands                 |
| `@score/midi`      | WebMIDI bridge, Pioneer XDJ profiles, controller mappings      |
| `@score/session`   | Jam session — engine + MIDI coordination for live performance  |
| `@score/mcp`       | MCP servers for Claude Code integration                        |
| `@score/gui`       | Score Studio — React DAW interface (Phase 13)                  |

## Requirements

- Node.js 20+
- pnpm 10+

## Open issues

- [#22](https://github.com/bwyard/score/issues/22) — Standardise CLI switches and `--help` across all commands. The CLI currently hand-rolls flag parsing per-command with no consistent `--help` output format or unknown-flag handling. This needs a project-wide standard before more commands are added.

## Status

Building in phases. See `SCORE_HANDOFF.md` for the full architecture and phase plan.

Phase 12 is the milestone that matters: `score play songs/first-track.js` runs and makes music.

## License

TBD
