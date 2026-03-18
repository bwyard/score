# Score Song Format

A Score song is a plain ES module that exports a `Song` definition as its default export.
The file is never compiled — it runs directly as ESM.

---

## Minimal song

```js
import { Song, Kick } from '@score/dsl'

const kick = Kick({ pattern: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0] })

export default Song({ bpm: 128, tracks: [kick] })
```

---

## Full example

```js
import { Song, Kick, Snare, HiHat, Synth, Intro, Drop, Breakdown, Outro } from '@score/dsl'
import { euclidean } from '@score/pattern'

// ── Drums ────────────────────────────────────────────────────────────────────

const kick = Kick({
  pattern: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
  volume:  0.9,
})

const snare = Snare({
  pattern: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],  // backbeat
  volume:  0.7,
})

const hihat = HiHat({
  pattern: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],  // straight 8ths
  volume:  0.5,
  open:    false,
})

// ── Bass ──────────────────────────────────────────────────────────────────────

const bass = Synth({
  wave:    'sawtooth',
  gain:    0.3,
  pattern: ['A2', 0, 0, 0,  'A2', 0, 0, 0,  'F2', 0, 0, 0,  'G2', 0, 0, 0],
  envelope: { attack: 0.003, decay: 0.06, sustain: 0.5, release: 0.04 },
  filter:   { type: 'lowpass', frequency: 800, Q: 1.5 },
})

// ── Pad ───────────────────────────────────────────────────────────────────────

const pad = Synth({
  wave:    'sawtooth',
  gain:    0.2,
  pattern: ['A4', 0, 0, 0,  0, 0, 0, 0,  'F4', 0, 0, 0,  'G4', 0, 0, 0],
  envelope: { attack: 0.3, decay: 0.1, sustain: 0.8, release: 0.5 },
  filter:   { type: 'lowpass', frequency: 1200, Q: 0.8 },
})

// ── Song ──────────────────────────────────────────────────────────────────────

export default Song({
  bpm:    128,
  key:    'Am',
  genre:  'deep house',
  tracks: [kick, snare, hihat, bass, pad],

  arrangement: [
    Intro({     bars: 8,  tracks: [hihat] }),
    Buildup({   bars: 8,  tracks: [hihat, snare] }),
    Drop({      bars: 32, tracks: [kick, snare, hihat, bass, pad] }),
    Breakdown({ bars: 16, tracks: [pad, bass] }),
    Drop({      bars: 32, tracks: [kick, snare, hihat, bass, pad] }),
    Outro({     bars: 8,  tracks: [hihat, pad] }),
  ],
})
```

---

## Song props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `bpm` | `number` | Yes | Tempo in beats per minute |
| `tracks` | `InstrumentDescriptor[]` | Yes | All instruments used in the song |
| `key` | `string` | No | Musical key, e.g. `'Am'`, `'Cmaj'` (informational) |
| `genre` | `string` | No | Genre label (informational) |
| `arrangement` | `SectionDefinition[]` | No | Section list. If omitted, all tracks play the full song. |
| `backend` | `'web-audio'` | No | Audio backend. Defaults to `'web-audio'`. |

---

## Arrangement sections

Sections define which tracks play during each part of the song.
Each section runs for the specified number of bars, then the next section starts.

```js
import { Intro, Buildup, Drop, Breakdown, Outro } from '@score/dsl'
```

| Function | `sectionType` | Typical role |
|----------|--------------|--------------|
| `Intro({ bars, tracks })` | `'intro'` | Opening — sparse, hook reveal |
| `Buildup({ bars, tracks })` | `'buildup'` | Rising energy before the drop |
| `Drop({ bars, tracks })` | `'drop'` | Full arrangement, peak energy |
| `Breakdown({ bars, tracks })` | `'breakdown'` | Strip back — emotional contrast |
| `Outro({ bars, tracks })` | `'outro'` | Fade out, strip down |

### Bars reference

At 128 BPM: 1 bar = 4 beats = 1.875 seconds.
| Bars | Duration at 128 BPM |
|------|---------------------|
| 4 | 7.5 sec |
| 8 | 15 sec |
| 16 | 30 sec |
| 32 | 60 sec |
| 64 | 2 min |

A typical club track: Intro (8) + Buildup (8) + Drop (32) + Breakdown (16) + Drop (32) + Outro (8) = 104 bars ≈ 3:15.

---

## Imports

Score uses `@score/dsl` as the main import for song files.

```js
// Instruments
import { Kick, Snare, HiHat, Synth } from '@score/dsl'

// Song structure
import { Song, Intro, Buildup, Drop, Breakdown, Outro, Track } from '@score/dsl'

// Pattern utilities (optional)
import { euclidean, fast, slow, rev, every, degrade, shift } from '@score/pattern'
import { scaleNotes, chordNotes } from '@score/pattern'
```

---

## CLI commands

```bash
# Play a song
score play songs/my-track.js

# Play with live reload on save
score play songs/my-track.js --watch

# Create a new song from template
score new song my-track

# Check system health
score doctor
```

---

## Allowed in song files

Song files can use:
- All `@score/*` packages
- Local relative imports (`./sounds/my-lib.js`)
- Standard JavaScript globals: `Math`, `Array`, `Object`, `Map`, `Set`, `String`, `Number`, `JSON`
- `console.log` for debugging

Song files **cannot** use:
- Node.js built-in modules (`fs`, `child_process`, `net`, etc.)
- `process.*`
- `eval()` or `new Function()`
- `setTimeout` / `setInterval` (use the Score transport)
- `require()` (use ESM `import`)

This restriction protects you from malicious song files from untrusted sources.
Use `score play --trust <file>` to skip validation during development of your own tools.
