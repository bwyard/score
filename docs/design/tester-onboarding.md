# Score Studio — Tester Onboarding

**Audience:** Coders, DJs, and music enthusiasts
**Release:** Tester build — Live Code mode
**Last updated:** 2026-04-05

---

## What is Score Studio?

Score Studio is a live coding environment for writing EDM in JavaScript. You describe music as pure functions — no DAW drag-and-drop, no sample banks, no clip launching. You write code, hit eval, hear the result. Edit while it plays. Changes apply at the next bar boundary, no audio gap.

The current tester build covers **Live Code mode.** Produce, DJ Set, and Jam Session are scaffolded but disabled until later phases.

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
│  MONACO      │  │ kick  ██░░██░░██░░██░░           │  │
│  EDITOR      │  │ snare ░░░░██░░░░░░██░░           │  │
│  (Monaco     │  │ hihat ████████████████            │  │
│   IntelliSense│  └─────────────────────────────────┘  │
│   + step     │  ┌─ Scope / Waveform ──────────────┐  │
│   highlight) │  │  ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿              │  │
│              │  └─────────────────────────────────┘  │
│ ──────────── │  ┌─ Reference ─────────────────────┐  │
│  CONSOLE     │  │  Drums / Melodic / Chain methods │  │
└──────────────┴───────────────────────────────────────┘
```

- **TransportBar** — pinned top. BPM is live-editable.
- **Monaco editor** — left pane. Full IntelliSense, step highlighting as the track plays.
- **Console** — below editor. Eval status, errors, bar counter.
- **Visualizer panels** — right side, all draggable and resizable.
  - Toggle: Grid | Scope | FFT | Mixer | Console | Reference
- **Reference panel** — in-app DSL cheatsheet. Click an instrument name to insert a snippet.

---

## Starter Song

The editor loads with a working starter. Hit **▶ Run** to hear it, then modify.

```js
import { Song, Kick808, Snare909, Hihat808, Bass303 } from '@score/dsl'

const kick  = Kick808(4).decay(0.7).volume(0.8)
const snare = Snare909(2).decay(0.2).volume(0.55)
const hihat = Hihat808(8).decay(0.08).volume(0.25)
const bass  = Bass303('A2').cutoff(600).resonance(0.4)
  .pattern(['A2', 0, 0, 0,  'D3', 0, 0, 0,  'A2', 0, 0, 0,  'D3', 0, 0, 0])
  .volume(0.6)

export default Song({ bpm: 128, tracks: [kick, snare, hihat, bass] })
```

---

## Chain API

Every instrument returns a chainable part. Methods return a new part — nothing is mutated.

```js
Kick808(4)                          // 4 euclidean hits across 16 steps
  .volume(0.9)                      // output level 0–1
  .decay(0.7)                       // amp envelope decay in seconds
  .reverb(0.1)                      // reverb wet 0–1
  .swing(0.05)                      // shuffle amount
  .mute()                           // mute at boot

Bass303('C2')
  .cutoff(800)                      // filter cutoff in Hz
  .resonance(2.0)                   // filter Q
  .accent([0, 4, 8])                // steps where velocity spikes
  .notes(['C2','D2','F2','G2'])     // pitch sequence
  .volume(0.7)
```

**The `euclidean(hits, steps)` shorthand** — pass hit count as first arg to any drum:
```js
Kick808(4)     // 4 hits over 16 steps → [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
Hihat808(11)   // 11 hits → dense shuffled pattern
```

**Hot-swap** — edit code, press `Ctrl+Enter` or **▶ Run** while playing. The change queues and applies cleanly at the next bar boundary. No audio gap. The console shows "Swap queued".

---

## Available Instruments

### Drums
| Factory | Character |
|---|---|
| `Kick808()` | 808 sine kick — long decay, sub weight |
| `Kick909()` | 909 kick — noise click transient, punchy |
| `KickHardstyle()` | Reverse-bass pitch envelope + tanh drive |
| `KickHardcore()` | Hard-clip gabber kick, short decay (160–200 BPM) |
| `Snare909()` | 909 tone+noise snare |
| `Clap909()` | 4-layer staggered noise burst |
| `Hihat808()` | 6 detuned square oscs, closed hat |
| `HihatOpen808()` | Same as 808 hat with longer decay |

### Melodic
| Factory | Character |
|---|---|
| `Bass303(pitch)` | TB-303 acid bass — cutoff, resonance, accent, slide |
| `SuperSaw(pitch)` | JP-8080-style 7-oscillator detuned saw stack |
| `WobbleBass(pitch)` | Resonant sawtooth with LFO filter sweep |
| `SubSynth(pitch)` | Analogue subtractive, Juno-style |
| `FMSynth(pitch)` | 2-operator FM — DX7 Rhodes / metallic leads |
| `Pad(pitch)` | Long attack sustained pad |
| `Pluck(pitch)` | Fast attack/decay plucked string |
| `Rhodes(pitch)` | FM tine electric piano |
| `Sax(pitch)` | Sawtooth through bandpass, reedy character |
| `Theremin(pitch)` | Continuous sine with vibrato |
| `Arp(notes[])` | Cycles through note array per step |
| `Sample(path)` | One-shot sample playback |

---

## Effects

Effects attach via chain methods or `.effects([…])`:

```js
Bass303('C2').reverb(0.2).delay(0.375, 0.3).filter(800)
// or
Bass303('C2').effects([Reverb({ decay: 1.5, mix: 0.2 }), Delay({ time: 0.375 })])
```

Available: `Reverb`, `Delay`, `Filter`, `Distortion`, `Compressor`, `EQ`, `Limiter`, `BitCrusher`, `Chorus`, `Phaser`, `Flanger`, `StereoWidener`, `Gate`, `Saturation`, `AutoPan`

---

## What to Test

**Core flow:**
- Write a song, eval, hear audio
- Edit a pattern while playing — does the hot-swap land on the bar boundary?
- Change BPM in the transport bar — does tempo shift instantly?
- Introduce a typo — does the old song keep playing? Does the error show clearly in the console?

**New instruments (this build):**
- `KickHardstyle()` — try `.decay(0.8)` and crank BPM to 150
- `KickHardcore()` — 160–200 BPM, should feel clipped and punchy
- `Clap909()` — replace `Snare909` with `Clap909`
- `SuperSaw('C4').notes(['C4','E4','G4']).reverb(0.4)` — trance pad
- `WobbleBass('A1').volume(0.8)` — low frequency wobble

**Visualizers:**
- Does the Step Grid cursor animate correctly per step?
- Does the Waveform respond to audio?
- Do visualizers update correctly after a hot-swap?

**Monaco editor:**
- IntelliSense — does autocomplete suggest chain methods?
- Step highlight — does the active line flash as the track plays?

**Mixer:**
- Mute/unmute tracks — instant?
- Volume sliders — smooth?

**Panels:**
- Drag and resize panels — do they behave?
- Click an instrument name in the Reference panel — does it insert a snippet?

**Reporting issues:**
Use the **Report Issue** button in the app (captures code + logs + engine state automatically).
Include: what you expected vs what happened, and which mode/BPM/panels were open.

---

## Known Gaps (this build)

- **Produce, DJ Set, Jam Session** — disabled. Stubs only.
- **Panel layout persistence** — resets on app restart (t218).
- **Monaco step badges** — STEP/TOTAL pill per instrument line not yet implemented (t219).
- **MIDI input** — Jam mode only, Phase 12b.
- **`WobbleBass` LFO rate** — not yet sync'd to BPM automatically. Set `lfoRateHz` manually: `bpm / 60 * noteValue` (e.g. 140 BPM quarter-note wobble = 2.33 Hz).
- **`SuperSaw` / `WobbleBass` chain extras** — no `.detune()` or `.lfo()` chain methods yet; set via `props` if needed.

---

## Useful Reading

- `docs/design/DSL_REFERENCE.md` — full chain API reference
- `docs/design/synthesis-spec.md` — instrument design specs
