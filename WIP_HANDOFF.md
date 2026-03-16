# Score — Architecture Handoff

> Read this before touching any code. This is the single source of truth for the Score framework.

---

## What is Score?

Score is two things simultaneously:

1. **A framework** (TypeScript) — the engine, components, effects, sequencer, mixer, CLI, and GUI
2. **A language** (plain JavaScript) — the song file format musicians and developers use to write music as code

**Core philosophy:** music is code, code is music. Every note, pattern, effect value, and arrangement decision is written by hand. No AI generates any musical content — ever.

---

## Identity

| Item | Value |
|---|---|
| Project name | Score |
| npm scope | `@score/*` |
| GitHub repo | `bwyard/score` |
| GUI name | TBD at Phase 13 (e.g. Score Studio) |
| CLI command | `score` |

---

## Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Package manager | pnpm | Workspaces |
| Monorepo | Turborepo | Task orchestration |
| Runtime | Node.js 20 LTS minimum | Song files run as plain ESM, never compiled |
| Audio (browser) | Web Audio API | Never exposed to song authors |
| Audio (Node) | node-web-audio-api | Polyfill for server-side rendering / CLI |
| Audio layer | Tone.js | Layer 1 abstraction over Web Audio API |
| Language | TypeScript strict | All framework code |
| Song files | Plain ESM JS | Never compiled, run directly by Node 20+ |
| Testing | Vitest | Coverage thresholds enforced in CI |
| GUI | React 18 + Vite | Phase 13 only |
| CLI runtime | tsx (dev) / Node built-ins | |
| Live coding | chokidar file watcher | `score live` command |
| CI | GitHub Actions | typecheck → lint → test → coverage |

### Coverage Thresholds (enforced in CI)

| Metric | Threshold |
|---|---|
| Statements | 90% |
| Branches | 85% |
| Functions | 90% |
| Lines | 90% |

---

## Packages

| Package | Purpose |
|---|---|
| `@score/core` | AudioContext factory, AudioGraphManager, WIPError |
| `@score/components` | Kick, Snare, HiHat, Synth, Sample components |
| `@score/effects` | Reverb, Delay, Filter, Compressor, Sidechain, EQ |
| `@score/dsl` | Song, Sequence, Pattern, Arrangement helpers |
| `@score/sequencer` | Transport, Clock, StepSequencer |
| `@score/mixer` | Mixer, Channel, master bus |
| `@score/cli` | play, live, repl, render commands |
| `@score/midi` | WebMIDI, Pioneer XDJ profiles |
| `@score/mcp` | MCP servers for Claude Code integration |
| `@score/gui` | React DAW interface (Phase 13) |

---

## Non-Negotiable Architecture Rules

1. **Song files are never compiled** — run directly as ES modules via Node 20
2. **Web Audio API is never exposed** to song authors — fully abstracted
3. **WIPError is the only error class** — never throw raw `Error` anywhere
4. **Tests and error handling ship with the component** — never backfilled later
5. **No AI generates music, patterns, or voices** — ever, under any circumstances
6. **No audio files bundled** — `samples/` is gitignored except `.gitkeep` and `README.md`
7. **GUI is built last** — Phase 13
8. **Every component implements the `AudioComponent` interface**
9. **Audio scheduling always uses `audioContext.currentTime`** — never `setTimeout` or `Date.now()`
10. **Song files use ESM, `const`, arrow functions, no classes**

---

## Song File Format

Song files are plain ESM JavaScript. They export a default `Song(...)` call. Example:

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

---

## CLI Modes

| Command | Mode |
|---|---|
| `score play songs/track.js` | Play a finished song |
| `score live songs/track.js` | Live coding — hot reload on save |
| `score repl songs/track.js` | REPL — type commands, hear changes instantly |

---

## Target Genres

House · Deep House · Techno · Industrial · Hardcore · Grime

---

## Build Phases

**Phase 12 is the milestone that matters:** `score play songs/first-track.js` runs and makes music.

| Phase | Name | Key deliverable |
|---|---|---|
| 1 | Scaffold | Monorepo stub, all packages, Vitest, ESLint, GH Actions CI |
| 1b | Codebase Intelligence MCP | Claude Code reads Score architecture via MCP |
| 2 | Core Engine | AudioContext, AudioGraphManager, WIPError |
| 3 | Synthesis | Math-generated sounds, oscillators |
| 4 | Sampler | WAV/MP3 sample loading and playback |
| 5 | DSL Components | Kick, Snare, HiHat, Synth, Sample |
| 6 | Effects | Reverb, Delay, Filter, Compressor, Sidechain, EQ |
| 7 | Mixer | Mixer, Channel, master bus |
| 8 | Sequencer + Transport | Clock, StepSequencer, Transport |
| 9 | Song Format | Song, Sequence, Pattern, Arrangement helpers |
| 10 | CLI | play, live, repl, render commands |
| 10b | Application MCP | Studio tools for composer workflow |
| 11 | Hot Reload + Live Coding | chokidar watcher, REPL |
| 12 | MIDI Bridge | First real music plays here |
| 13 | GUI | React DAW (Score Studio) |
| 14 | First Real Tracks | Production music written in Score |
| 15 | Beta Audit | Performance, API stability, docs |
| 15b | Framework MCP | External developers use Score via Claude |
| 16 | Release | npm publish, public announcement |
| 17 | v1.0 | Stable API, full test coverage, community |

---

## Error Design

```ts
// The ONLY error class in the entire framework
export class WIPError extends Error {
  constructor(
    message: string,
    public readonly context: {
      received?: unknown
      fix?: string
      docs?: string
      code?: string
    } = {}
  ) {
    super(message)
    this.name = 'WIPError'
  }
}
```

Usage:
```ts
throw new WIPError('AudioContext not initialized', {
  fix: 'Call createAudioContext() before loading components',
  docs: 'https://score.dev/docs/core#audio-context',
})
```

---

## AudioComponent Interface

Every component in `@score/components`, `@score/effects`, and `@score/mixer` must implement:

```ts
export interface AudioComponent {
  connect(destination: AudioNode): this
  disconnect(): this
  dispose(): void
}
```

---

## Folder Structure

```
score/
├── .github/
│   └── workflows/
│       └── ci.yml
├── packages/
│   ├── core/
│   ├── components/
│   ├── effects/
│   ├── dsl/
│   ├── sequencer/
│   ├── mixer/
│   ├── cli/
│   ├── midi/
│   ├── mcp/
│   └── gui/
├── songs/              ← song files go here (not compiled)
├── samples/            ← gitignored (user provides samples)
├── sounds/             ← gitignored (rendered audio output)
├── CLAUDE.md
├── AGENTS.md
├── WIP_HANDOFF.md      ← this file
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── eslint.config.js
└── vitest.workspace.ts
```

---

## Start-of-Session Checklist

1. Read `../claude-resources/sessions/score/current.md` — check session state
2. Read this file (`WIP_HANDOFF.md`) — confirm current phase
3. Read `AGENTS.md` — check what's in progress
4. Run `pnpm test` — confirm all tests passing
5. Confirm the session goal with the user

---

## Current Status

Phase 1 scaffold complete. All 10 `@score/*` packages stubbed with TypeScript, Vitest, ESLint.
CI pipeline running on GitHub Actions.

Next: Phase 1b (Codebase Intelligence MCP), then Phase 2 (Core Engine).
