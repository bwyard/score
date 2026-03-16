# Score

> A production-level, component-based audio framework for creating EDM music in JavaScript.

**Status:** Early development — Phase 1 scaffold complete.

---

## What is Score?

Score is two things simultaneously:

1. **A framework** (TypeScript) — the engine, components, effects, sequencer, mixer, CLI, and GUI that power everything
2. **A language** (plain JavaScript) — the song file format that musicians and developers use to write music as code

The core philosophy: **music is code, code is music.** Every note, pattern, effect value, and arrangement decision is written by hand. No AI generates any musical content — ever.

## Song files look like this

```js
const kick = Kick({
  sample:  './samples/kicks/deep-kick.wav',
  pattern: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
  volume:  0.9,
})

const bass = Synth({
  wave:     'sawtooth',
  filter:   { type: 'lowpass', frequency: 800 },
  sequence: Sequence('A1 A1 . C2 . G1 . .'),
})

export default Song({
  bpm:    140,
  key:    'Am',
  genre:  'techno',
  tracks: [kick, bass],
  arrangement: [
    Intro(4,  [kick]),
    Drop(16,  [kick, bass]),
    Outro(4,  [kick]),
  ],
})
```

## Three operational modes

| Command | Mode |
|---|---|
| `score play songs/track.js` | Play a finished song |
| `score live songs/track.js` | Live coding — hot reload on save |
| `score repl songs/track.js` | REPL — type commands, hear changes instantly |

## Target genres

House · Deep House · Techno · Industrial · Hardcore · Grime

## Packages

| Package | Purpose |
|---|---|
| `@score/core` | AudioContext, AudioGraphManager, ScoreError |
| `@score/components` | Kick, Snare, HiHat, Synth, Sample |
| `@score/effects` | Reverb, Delay, Filter, Compressor, Sidechain, EQ |
| `@score/dsl` | Song, Sequence, Pattern, Arrangement helpers |
| `@score/sequencer` | Transport, Clock, StepSequencer |
| `@score/mixer` | Mixer, Channel, master bus |
| `@score/cli` | play, live, repl, render commands |
| `@score/midi` | WebMIDI, Pioneer XDJ profiles |
| `@score/mcp` | MCP servers for Claude Code integration |
| `@score/gui` | React DAW interface (Phase 13) |

## Requirements

- Node.js 20+
- pnpm 10+

## Status

Building in phases. See `SCORE_HANDOFF.md` for the full architecture and 17-phase build plan.

Phase 12 is the milestone that matters: `score play songs/first-track.js` runs and makes music.

## License

TBD
