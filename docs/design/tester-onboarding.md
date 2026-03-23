# Score Studio — Tester Onboarding

**Audience:** Coders, DJs, and music enthusiasts
**Release:** Tester build — Live Code mode only
**Last updated:** 2026-03-22

---

## What is Score Studio?

Score Studio is a live coding environment for writing EDM in JavaScript. You describe music as pure functions — no DAW drag-and-drop, no sample banks, no clip launching. You write code, hit eval, hear the result. Edit while it plays. Changes apply at the next bar boundary, no audio gap. It is the TidalCycles philosophy with a TypeScript runtime and a visual feedback layer on top.

The current tester build covers **Live Code mode only.** Produce, DJ Set, and Jam Session are scaffolded but disabled until later phases.

---

## Install and Launch

```bash
# Prerequisites: Node.js 20+, pnpm
git clone <repo-url> score && cd score
pnpm install && pnpm build
pnpm start   # launches Electron app
```

Select **Live Code** on the splash screen and click **Enter Mode**.

---

## The Interface

```
┌──────────────────────────────────────────────────────┐
│ ← Score  [Live Code]  ●128bpm  ▶ Play  ■ Stop  Bar:0 │  ← TransportBar
├──────────────┬───────────────────────────────────────┤
│              │  ┌─ Step Grid ─────────────────────┐  │
│  CODE        │  │ 🟠 kick  ██░░██░░██░░██░░  ▶   │  │
│  EDITOR      │  │ 🔴 snare ░░██░░██░░██░░██       │  │
│              │  │ 🟢 hihat ████████████████        │  │
│              │  └─────────────────────────────────┘  │
│              │  ┌─ Waveform ──────────────────────┐  │
│ ──────────── │  │  ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿              │  │
│  CONSOLE     │  └─────────────────────────────────┘  │
└──────────────┴───────────────────────────────────────┘
```

- **TransportBar** — pinned top, always visible. BPM is editable.
- **Code editor** — left pane. Ctrl+Enter to eval.
- **Console** — below editor. Eval status, errors, bar counter.
- **Visualizer panels** — right side, all draggable and resizable.
  - Toggle panels: Grid | Scope | FFT | Piano | Mixer | Console | Ref

---

## Starter Song

The editor loads with a STARTER template. Hit Play immediately to hear it, then modify.

```js
import { Song, Kick, Snare, HiHat, Synth, Arp } from '@score/dsl'
import { Reverb, Delay } from '@score/effects'
import { euclidean } from '@score/pattern'

const kick  = Kick({ pattern: euclidean(4, 16), volume: 0.9 })
const snare = Snare({ pattern: euclidean(2, 16, 8), volume: 0.7 })
const hihat = HiHat({ pattern: euclidean(8, 16), volume: 0.4 })

const bass = Synth({
  wave: 'sawtooth',
  frequency: 65.41,
  pattern: [1,0,0,1,0,0,1,0, 1,0,0,1,0,0,0,0],
  filter:  { type: 'lowpass', frequency: 400 },
  effects: [Reverb({ decay: 1.5, mix: 0.2 })],
  gain: 0.6,
})

const lead = Arp({
  notes: ['C3','Eb3','G3','Bb3'],
  mode: 'up',
  rate: 2,
  wave: 'triangle',
  gain: 0.4,
  effects: [Delay({ time: 0.1875, feedback: 0.35, mix: 0.25 })],
})

export default Song({ bpm: 128, tracks: [kick, snare, hihat, bass, lead] })
```

---

## Key Concepts

**`euclidean(hits, steps, offset?)`** — spreads `hits` evenly across `steps` using Bjorklund algorithm. `euclidean(3,8)` = the classic 3-against-8 pattern. Offset shifts the phase.

**`pattern`** — array of `1`/`0` for rhythm, or note strings for pitch (`['C3','G3']`). Length defines the loop.

**Hot reload** — edit code, press `Ctrl+Enter`. If playing, change applies at next bar boundary with no audio gap (listen for the downbeat). The console shows "Swap queued".

**`patch()` vs `update()`** — internally, BPM and volume changes use `patch()` (instant, no restart). Structural changes (new tracks, new patterns) use `update()` (bar-boundary swap).

**`bars` counter** — available in code as a live variable. Use it to create arrangement logic:
```js
// Only play the lead after bar 8
const lead = bars > 8 ? Arp({ ... }) : null
```

---

## DSL Reference

### Instruments (`@score/dsl`)
| Factory | Props |
|---|---|
| `Kick` | `pattern, volume` |
| `Snare` | `pattern, volume` |
| `HiHat` | `pattern, volume, open?` |
| `Synth` | `wave, frequency, pattern, filter?, effects?, gain, adsr?` |
| `Sample` | `path, pattern, loop?, playbackRate?, gain` |
| `Arp` | `notes, mode, rate, wave, gain, effects?` |
| `Song` | `bpm, tracks` |

### Effects (`@score/effects`)
`Reverb`, `Delay`, `Distortion`, `Compressor`, `EQ`, `Chorus`, `Flanger`, `Phaser`, `BitCrusher`, `Limiter`, `Sidechain`, `Gate`, `StereoWidener`, `AutoPan`, `Saturation`

### Patterns (`@score/pattern`)
`euclidean`, `beat`, `stack`, `rev`, `every`, `shift`, `slow`, `fast`, `degrade`, `humanize`, `scaleNotes`, `chordNotes`

### Math / Stochastic (`@score/math`)
`drunk`, `markov`, `lorenz`, `logistic`, `fibonacci`, `polyrhythm`, `circleOfFifths`

---

## What to Test

**Core flow:**
- Write a song, eval, hear audio. Does it work?
- Edit a pattern while playing — does the hot-swap land cleanly on the bar?
- Change BPM in transport bar — does tempo shift instantly?
- Introduce a typo — does the old song keep playing? Does the error show clearly?

**Visualizers:**
- Does the Step Grid cursor animate correctly per step?
- Does the Waveform respond to the audio signal?
- Do visualizers update correctly after a hot-swap?

**Mixer:**
- Mute/unmute tracks — instant?
- Volume sliders — smooth?

**Panels:**
- Drag and resize panels — do they behave?
- Close and reopen via toolbar buttons — does state restore?

**File ops:**
- Save to disk, reopen — does code reload and re-eval correctly?

---

## What to Ignore / Known Gaps

- **Produce, DJ Set, Jam Session** — disabled. Stubs only.
- **Monaco IDE** — using plain textarea for now. IntelliSense coming Phase 13f.
- **808/909 accurate drums** — current `Kick`/`Snare`/`HiHat` are generic stubs. Genre-accurate synthesis (t160–t166) is the next instrument pass.
- **TB-303, FM synth (Rhodes), SubtractiveSynth** — not yet built. Roadmap Phases 2–3.
- **Panel layout persistence** — resets on app restart.
- **MIDI input** — Phase 12b (Jam mode).
- **SuperCollider backend** — Phase 12c. Currently Web Audio only.

---

## Reporting Issues

Include:
1. The code that triggered it (paste the full Song)
2. What you expected vs what happened
3. Console output (copy the error text)
4. App state: playing/stopped, BPM, which panels were open

File at the Score repo issues page. Tag: `tester-release`.

---

## Useful Reading

- `docs/LIVE_CODING.md` — live coding patterns and bar-counter arrangements
- `docs/PATTERNS.md` — full pattern function reference
- `docs/EXAMPLES.md` — full song examples
- `docs/design/synthesis-spec.md` — what instruments are coming (808/909/303/Rhodes)
- `docs/design/wireframes/` — full UI spec for all modes
