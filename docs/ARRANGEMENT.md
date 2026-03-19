# Arrangement

The arrangement system controls which tracks play during which bars. Sections play sequentially, then loop back to the beginning.

```js
import { Song, Kick, Snare, HiHat, Synth } from '@score/dsl'
import { Intro, Buildup, Drop, Breakdown, Outro } from '@score/dsl'

const kick  = Kick({ pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0] })
const snare = Snare({ pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0] })
const hihat = HiHat({ pattern: [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0], volume: 0.25 })
const bass  = Synth({ wave: 'sawtooth', gain: 0.3, pattern: ['A2', 0, 'A2', 0,  'D3', 0, 'E3', 0] })
const pad   = Synth({ wave: 'triangle', gain: 0.12, envelope: { attack: 0.4, decay: 0.1, sustain: 0.85, release: 0.8 }, pattern: ['C3', 0, 0, 0,  'E3', 0, 0, 0] })

export default Song({
  bpm: 128,
  tracks: [kick, snare, hihat, bass, pad],
  arrangement: [
    Intro(8, [hihat]),
    Buildup(8, [hihat, kick]),
    Drop(32, [kick, snare, hihat, bass]),
    Breakdown(16, [pad, bass]),
    Drop(32, [kick, snare, hihat, bass, pad]),
    Outro(8, [hihat, kick]),
  ],
})
```

---

## How sections work

Each section specifies a duration in bars and a list of tracks that play during that section. All other tracks in `song.tracks` are muted for that section's duration.

- **Bar boundaries** — section transitions are exact. When bar N ends and section M begins, the muted/unmuted state switches instantly at the start of the next bar.
- **Track identity** — tracks are matched by object reference. Pass the same variable — not a copy, not a new call to the instrument factory.
- **Looping** — after the last section completes, the arrangement loops back to the first section. The entire arrangement repeats indefinitely until stopped.
- **Unlisted tracks** — any track in `song.tracks` that does not appear in a section's track list is silenced for that section. Its audio engine keeps running; only its output is muted.

### What "muted" means

A muted track's synthesizer continues receiving step clock events — it does not pause. Only its volume output is suppressed. This means pattern state, envelopes, and effects continue to process. When the track becomes active again, there is no startup latency.

---

## Section constructors

All section constructors are imported from `@score/dsl`. They return plain descriptor objects.

```js
import { Intro, Buildup, Drop, Breakdown, Outro } from '@score/dsl'
```

### `Intro(bars, tracks)`

Opening section. Establishes groove with reduced elements.

| Parameter | Type | Description |
|---|---|---|
| `bars` | `number` | Duration of this section in bars. |
| `tracks` | `Track[]` | Array of track objects that play. All others in `song.tracks` are muted. |

### `Buildup(bars, tracks)`

Tension before a drop. Typically adds elements progressively — model each step with a separate Buildup section, or use function patterns that respond to `bar` number.

| Parameter | Type | Description |
|---|---|---|
| `bars` | `number` | Duration in bars. |
| `tracks` | `Track[]` | Active tracks for this section. |

### `Drop(bars, tracks)`

Full energy section. Usually the most tracks active.

| Parameter | Type | Description |
|---|---|---|
| `bars` | `number` | Duration in bars. |
| `tracks` | `Track[]` | Active tracks for this section. |

### `Breakdown(bars, tracks)`

Reduced section after or between drops. Strips back to pads and minimal percussion.

| Parameter | Type | Description |
|---|---|---|
| `bars` | `number` | Duration in bars. |
| `tracks` | `Track[]` | Active tracks for this section. |

### `Outro(bars, tracks)`

Closing section. Mirror of Intro — typically strips back to minimal elements.

| Parameter | Type | Description |
|---|---|---|
| `bars` | `number` | Duration in bars. |
| `tracks` | `Track[]` | Active tracks for this section. |

---

## Track identity

Tracks must be the same object reference that was passed to `song.tracks`. Do not re-call the instrument factory inside the arrangement.

```js
// Correct — same variable reference
const kick = Kick({ ... })
const arr = Drop(32, [kick])

// Wrong — new object, will not match
const arr = Drop(32, [Kick({ ... })])
```

If a track appears in `arrangement` sections but is not in `song.tracks`, it has no effect — the section lists are filtered against `song.tracks`.

---

## Common patterns

### Intro → Buildup → Drop (8-8-32)

The standard EDM structure. Hihat-only intro, kick added in buildup, full drop:

```js
arrangement: [
  Intro(8, [hihat]),
  Buildup(8, [hihat, kick]),
  Drop(32, [kick, snare, hihat, bass, pad]),
  Outro(8, [kick, hihat]),
]
```

### Progressive buildup with multiple Buildup sections

Add elements step by step across four 4-bar sections:

```js
arrangement: [
  Intro(4, [hihat]),
  Buildup(4, [hihat, kick]),
  Buildup(4, [hihat, kick, snare]),
  Buildup(4, [hihat, kick, snare, bass]),
  Drop(32, [kick, snare, hihat, bass, pad, lead]),
]
```

### Double drop with breakdown

First drop, strip back, second drop with everything:

```js
arrangement: [
  Intro(8, [hihat]),
  Buildup(8, [hihat, kick]),
  Drop(32, [kick, snare, hihat, bass]),
  Breakdown(16, [pad]),
  Drop(32, [kick, snare, hihat, bass, pad]),
]
```

### Minimal loop (no arrangement)

If `arrangement` is omitted, all tracks in `song.tracks` play simultaneously from the start and loop forever. Use this for sketching.

```js
export default Song({
  bpm: 128,
  tracks: [kick, snare, hihat, bass],
  // no arrangement — all tracks play at all times
})
```

---

## Complete example 1 — Four-section house track

```js
import { Song, Kick, Snare, HiHat, Synth } from '@score/dsl'
import { Intro, Buildup, Drop, Outro } from '@score/dsl'
import { Delay, Reverb } from '@score/effects'

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.9,
})

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.55,
})

const hihat = HiHat({
  pattern: [1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1],
  volume: 0.18,
})

const bass = Synth({
  wave: 'sawtooth',
  gain: 0.28,
  envelope: { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.05 },
  filter: { type: 'lowpass', frequency: 900, Q: 1.0 },
  pattern: ['A2', 0, 'A2', 0,  'D3', 0, 'E3', 0,  'F3', 0, 'E3', 0,  'D3', 0, 0, 0],
})

const pad = Synth({
  wave: 'triangle',
  gain: 0.12,
  envelope: { attack: 0.6, decay: 0.2, sustain: 0.8, release: 1.5 },
  pattern: ['C4', 0, 0, 0,  0, 0, 0, 0,  'A3', 0, 0, 0,  0, 0, 0, 0],
  effects: [Reverb({ decay: 4.0, mix: 0.4 })],
})

export default Song({
  bpm: 126,
  key: 'Am',
  tracks: [kick, snare, hihat, bass, pad],
  arrangement: [
    Intro(8,  [hihat]),
    Buildup(8, [hihat, kick]),
    Drop(32,  [kick, snare, hihat, bass]),
    Breakdown(16, [pad]),
    Drop(32,  [kick, snare, hihat, bass, pad]),
    Outro(8,  [hihat]),
  ],
})
```

---

## Complete example 2 — Techno track with layered buildup

```js
import { Song, Kick, Snare, HiHat, Synth } from '@score/dsl'
import { Intro, Buildup, Drop, Breakdown, Outro } from '@score/dsl'
import { Filter, Distortion } from '@score/effects'

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.95,
  synth: { frequency: 65, pitchDrop: 0.07 },
})

const snare = Snare({
  pattern: [0, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0],
  volume: 0.6,
})

const hihat = HiHat({
  pattern: [0, 1, 0, 1,  0, 1, 0, 1,  0, 1, 0, 1,  0, 1, 0, 1],
  volume: 0.2,
})

const openHat = HiHat({
  pattern: [0, 0, 0, 0,  0, 0, 0, 1,  0, 0, 0, 0,  0, 0, 0, 1],
  volume: 0.3,
  open: true,
})

const bass = Synth({
  wave: 'square',
  gain: 0.25,
  envelope: { attack: 0.002, decay: 0.05, sustain: 0.5, release: 0.03 },
  filter: { type: 'lowpass', frequency: 600, Q: 2.5 },
  pattern: ['A1', 0, 'A1', 0,  'A1', 0, 'A1', 0,  'A1', 0, 'A1', 0,  'G1', 0, 'F1', 0],
  effects: [Distortion({ amount: 0.3, mode: 'soft' })],
})

const acid = Synth({
  wave: 'sawtooth',
  gain: 0.2,
  envelope: { attack: 0.005, decay: 0.15, sustain: 0.4, release: 0.05 },
  filter: { type: 'lowpass', frequency: 1200, Q: 8.0 },
  pattern: ['A3', 0, 'C4', 0,  'E3', 0, 'A3', 0,  'G3', 0, 'A3', 0,  'F3', 0, 'E3', 0],
})

export default Song({
  bpm: 138,
  key: 'Am',
  tracks: [kick, snare, hihat, openHat, bass, acid],
  arrangement: [
    Intro(8,      [hihat]),
    Buildup(4,    [hihat, kick]),
    Buildup(4,    [hihat, openHat, kick]),
    Buildup(4,    [hihat, openHat, kick, snare]),
    Buildup(4,    [hihat, openHat, kick, snare, bass]),
    Drop(32,      [kick, snare, hihat, openHat, bass, acid]),
    Breakdown(8,  [bass, acid]),
    Drop(32,      [kick, snare, hihat, openHat, bass, acid]),
    Outro(8,      [kick, hihat]),
  ],
})
```
