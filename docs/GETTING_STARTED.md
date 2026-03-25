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

const kick = Kick(4).volume(0.9)

export default Song({ bpm: 128, tracks: [kick] })
```

```bash
score play kick-only.js
```

`Kick(4)` — four euclidean hits across 16 steps. `4` is the hit count, not a beat position.

## A full beat

```js
import { Song, Kick, Snare, HiHat, Synth } from '@score/dsl'

const kick = Kick(4).volume(0.9)

const snare = Snare(2).volume(0.6)

const hihat = HiHat(8).volume(0.25)

const bass = Synth('sawtooth', 'A2')
  .filter(900)
  .notes(['A2', 'A2', 'D3', 'E3'])
  .volume(0.3)

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

---

## What's available in song files

Every importable symbol across all packages.

| Import | From | What it does |
|---|---|---|
| `Song` | `@score/dsl` | Song container — wraps tracks, bpm, key, arrangement |
| `Kick` | `@score/dsl` | Synthesized bass drum (sine + pitch drop) |
| `Snare` | `@score/dsl` | Synthesized snare drum |
| `HiHat` | `@score/dsl` | Synthesized hi-hat (closed and open) |
| `Kick808` | `@score/dsl` | TR-808 bass drum — deep sub, long decay |
| `Kick909` | `@score/dsl` | TR-909 bass drum — punchy body + transient click |
| `Snare909` | `@score/dsl` | TR-909 snare — pitched tone + noise body |
| `Hihat808` | `@score/dsl` | TR-808 hi-hat — metallic six-oscillator noise source |
| `Synth` | `@score/dsl` | Subtractive synth with ADSR, filter, and effects |
| `SubSynth` | `@score/dsl` | Full Juno-60/Minimoog model — unison, filter envelope |
| `FMSynth` | `@score/dsl` | 2-operator FM — DX7 Rhodes, metallic leads, bells |
| `Bass303` | `@score/dsl` | Roland TB-303 acid bass — squelch, resonance, accent, slide |
| `Arp` | `@score/dsl` | Arpeggiator cycling through a note list |
| `Theremin` | `@score/dsl` | Smooth pitch-glide melodic voice |
| `Sax` | `@score/dsl` | Stepped melodic voice with note sequence |
| `Sample` | `@score/dsl` | Audio file player with rate and pattern control |
| `Sequence` | `@score/dsl` | Parses space-separated note name strings into arrays |
| `Intro` | `@score/dsl` | Arrangement section — opening bars |
| `Buildup` | `@score/dsl` | Arrangement section — tension before drop |
| `Drop` | `@score/dsl` | Arrangement section — full energy section |
| `Breakdown` | `@score/dsl` | Arrangement section — stripped-back section |
| `Outro` | `@score/dsl` | Arrangement section — closing bars |
| `describe` | `@score/musical` | Attaches plain language hints to instruments |
| `euclidean` | `@score/pattern` | Generates euclidean (Bjorklund) rhythm patterns |
| `fast` | `@score/pattern` | Doubles pattern speed |
| `slow` | `@score/pattern` | Halves pattern speed |
| `rev` | `@score/pattern` | Reverses a pattern |
| `shift` | `@score/pattern` | Rotates a pattern left or right by N steps |
| `degrade` | `@score/pattern` | Randomly drops hits by a given probability |
| `every` | `@score/pattern` | Applies a transform every N bars |
| `stack` | `@score/pattern` | Combines two patterns by OR (either hit plays) |
| `beat` | `@score/pattern` | Builds a pattern from beat positions |
| `scaleNotes` | `@score/pattern` | Returns note name array for a scale and root |
| `chordNotes` | `@score/pattern` | Returns note name array for a chord symbol |
| `Delay` | `@score/effects` | Repeating echo effect (descriptor factory) |
| `Reverb` | `@score/effects` | Room/hall simulation (descriptor factory) |
| `Filter` | `@score/effects` | Biquad filter (descriptor factory) |
| `Distortion` | `@score/effects` | Waveshaping — soft, hard, or foldback |
| `EQ` | `@score/effects` | Three-band equalizer (descriptor factory) |
| `Compressor` | `@score/effects` | Dynamic range compression |
| `Limiter` | `@score/effects` | Brick-wall output limiter |
| `BitCrusher` | `@score/effects` | Bit depth and sample rate reduction |
| `Chorus` | `@score/effects` | LFO-modulated pitch doubling |
| `Phaser` | `@score/effects` | Allpass filter sweep |
| `Flanger` | `@score/effects` | Short modulated delay with feedback |
| `StereoWidener` | `@score/effects` | Mid-side stereo width control |
| `Gate` | `@score/effects` | Noise gate — silences signal below threshold |
| `fibonacci` | `@score/math` | Returns Fibonacci sequence values |
| `fibonacciRhythm` | `@score/math` | Builds a rhythm from Fibonacci intervals |
| `padovan` | `@score/math` | Padovan sequence generator |
| `tribonacci` | `@score/math` | Tribonacci sequence generator |
| `entropy` | `@score/math` | Measures information entropy of a pattern |
| `isMusical` | `@score/math` | Tests whether a pattern has musical properties |
| `density` | `@score/math` | Returns hit density of a pattern (0–1) |
| `patternOr` | `@score/math` | Boolean OR of two patterns |
| `patternAnd` | `@score/math` | Boolean AND of two patterns |
| `patternXor` | `@score/math` | Boolean XOR of two patterns |
| `patternNot` | `@score/math` | Boolean NOT of a pattern |
| `tile` | `@score/math` | Repeats a pattern to fill a target length |
| `polyrhythm` | `@score/math` | Combines patterns of different lengths into one |
| `range` | `@score/math` | Generates an array of evenly spaced values |
| `normalize` | `@score/math` | Scales values to 0–1 range |
| `clip` | `@score/math` | Clamps values to a min/max range |
| `smooth` | `@score/math` | Applies moving average smoothing |
| `quantize` | `@score/math` | Snaps values to a grid |
| `interp` | `@score/math` | Linear interpolation between two values |
| `drunk` | `@score/math` | Random walk generator |
| `markov` | `@score/math` | Markov chain sequence generator |
| `createOUProcess` | `@score/math` | Ornstein-Uhlenbeck stochastic process |
| `circleOfFifths` | `@score/math` | Returns note name at position N on circle of fifths |
| `just` | `@score/math` | Just intonation frequency from note name |
| `pythagorean` | `@score/math` | Pythagorean tuning frequency from note name |
| `meantone` | `@score/math` | Quarter-comma meantone frequency |
| `edo19` | `@score/math` | 19-TET frequency |
| `edo31` | `@score/math` | 31-TET frequency |
| `createLorenz` | `@score/math` | Lorenz attractor generator |
| `logisticMap` | `@score/math` | Logistic map chaos function |
| `logisticSequence` | `@score/math` | Sequence from iterated logistic map |
| `lyapunovExponent` | `@score/math` | Measures chaos intensity of a sequence |
| `lsystem` | `@score/math` | L-system string rewriting |
| `lsystemToPattern` | `@score/math` | Converts L-system output to a step pattern |
| `wolframCA` | `@score/math` | Wolfram elementary cellular automaton |
| `rk4` | `@score/math` | Runge-Kutta 4th order ODE integrator |

---

## Further reading

| File | Contents |
|---|---|
| [INSTRUMENTS.md](INSTRUMENTS.md) | All instruments — chain API reference |
| [EFFECTS.md](EFFECTS.md) | Chain effects methods + advanced descriptor factories |
| [SCALES.md](SCALES.md) | scaleNotes, chordNotes, tuning systems, circleOfFifths |
| [ARRANGEMENT.md](ARRANGEMENT.md) | Intro/Buildup/Drop/Breakdown/Outro — section-based arrangement |
| [SAMPLE.md](SAMPLE.md) | Sample instrument — file formats, paths, rate, looping |
| [PATTERNS.md](PATTERNS.md) | euclidean, transforms, pattern combinators |
| [MATH.md](MATH.md) | Chaos, stochastic, sequence, and generative math |
| [SONG_FORMAT.md](SONG_FORMAT.md) | Song() props, security model, key/bpm reference |
| [EXAMPLES.md](EXAMPLES.md) | 8 complete runnable songs |
| [LIVE_CODING.md](LIVE_CODING.md) | Hot reload workflow and live coding techniques |
