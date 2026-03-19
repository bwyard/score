# Getting Started

Play your first song in under 5 minutes.

## Install

```bash
git clone <repo-url> score
cd score
pnpm install
pnpm build
```

## Run the CLI

Two ways to run Score. Pick one.

**Built CLI (after `pnpm build`):**
```bash
node packages/cli/dist/index.js play <song.js>
```

**Direct TypeScript (no build step, requires tsx):**
```bash
node --import tsx/esm packages/cli/src/index.ts play <song.js>
```

For convenience, add a shell alias:
```bash
alias score="node /path/to/score/packages/cli/dist/index.js"
```

All examples in these docs use `score play <file>` — substitute the full path if you haven't set the alias.

## Check your setup

```bash
score doctor
```

Checks Node.js version (requires v20+), pnpm, and `node-web-audio-api`. Fix anything marked `✗` before continuing.

## Your first song

```bash
score new song my-first-song
score play my-first-song.js
```

Press `Ctrl+C` to stop.

## Write a song from scratch

```js
import { Song, Kick } from '@score/dsl'

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.9,
})

export default Song({ bpm: 128, tracks: [kick] })
```

```bash
score play kick-only.js
```

## A full beat

```js
import { Song, Kick, Snare, HiHat, Synth } from '@score/dsl'

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.9,
})

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.6,
})

const hihat = HiHat({
  pattern: [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0],
  volume: 0.25,
})

const bass = Synth({
  wave: 'sawtooth',
  gain: 0.3,
  envelope: { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.05 },
  filter: { type: 'lowpass', frequency: 900 },
  pattern: ['A2', 0, 'A2', 0,  0, 'A2', 0, 'D3',  'E3', 0, 'E3', 0,  0, 'A3', 0, 0],
})

export default Song({
  bpm: 128,
  key: 'Am',
  tracks: [kick, snare, hihat, bass],
})
```

## Live reload

```bash
score play my-song.js --watch
```

Save the file. Score reloads within ~300ms. If the reload fails, the previous version keeps playing and the error prints to the terminal.

## CLI reference

| Command | Description |
|---|---|
| `score play <file.js>` | Play a song |
| `score play --watch <file.js>` | Play with live reload on save |
| `score play --trust <file.js>` | Skip the security scan (dev only) |
| `score new song <name>` | Create a song from the template |
| `score doctor` | Check system requirements |
| `score --version` | Print version |

`--watch` and `--trust` can be combined: `score play --watch --trust my-song.js`

## Next steps

- [INSTRUMENTS.md](INSTRUMENTS.md) — Kick/Snare/HiHat/Synth reference
- [PATTERNS.md](PATTERNS.md) — euclidean, transforms, scale utilities
- [EXAMPLES.md](EXAMPLES.md) — 8 complete runnable songs
- [LIVE_CODING.md](LIVE_CODING.md) — hot reload workflow
- [MATH.md](MATH.md) — chaos, stochastic, and sequence math
- [SONG_FORMAT.md](SONG_FORMAT.md) — Song() props and security model
