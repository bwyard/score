# Sample Instrument

Play audio files — WAV, MP3, OGG, or FLAC — triggered by a step pattern.

```js
import { Song, Sample } from '@score/dsl'
```

---

## Basic usage

```js
import { Song, Sample } from '@score/dsl'

const kick = Sample({
  path: './sounds/kick.wav',
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.9,
})

export default Song({ bpm: 128, tracks: [kick] })
```

`path` is the only required prop. Relative paths resolve from the song file's directory.

---

## `Sample(props)` reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `path` | `string` | **required** | Path to the audio file. Absolute or relative to the song file. |
| `pattern` | `number[]` | `[1,0,0,...0]` | Trigger pattern. `1` = play, `0` = rest. Loops automatically. |
| `volume` | `number` | `1.0` | Playback volume 0–1. |
| `rate` | `number` | `1.0` | Playback rate. `1.0` = original pitch. `2.0` = octave up. `0.5` = octave down. |
| `loop` | `boolean` | `false` | Loop the sample continuously on each trigger. |
| `effects` | `EffectDescriptor[]` | `[]` | Effects chain — see [EFFECTS.md](EFFECTS.md). |

---

## Supported formats

WAV, MP3, OGG, FLAC.

---

## Patterns

Same pattern system as all instruments. `1` = hit, `0` = rest. Shorter patterns loop.

```js
// Four-on-the-floor
const kick = Sample({
  path: './sounds/kick.wav',
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
})

// Offbeat snare
const clap = Sample({
  path: './sounds/clap.wav',
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
})

// Euclidean hi-hat
import { euclidean } from '@score/pattern'
const hat = Sample({
  path: './sounds/hat.wav',
  pattern: euclidean(5, 16),
  volume: 0.4,
})
```

---

## Pitch shifting with `rate`

`rate` changes both playback speed and pitch (vinyl-style):

```js
const normal = Sample({ path: './sounds/chord.wav', rate: 1.0 })  // original
const high   = Sample({ path: './sounds/chord.wav', rate: 2.0 })  // +1 octave
const low    = Sample({ path: './sounds/chord.wav', rate: 0.5 })  // -1 octave
const fifth  = Sample({ path: './sounds/bass.wav',  rate: 1.498 }) // +7 semitones
```

---

## Looping

```js
const drone = Sample({
  path: './sounds/pad.wav',
  pattern: [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
  loop: true,
  volume: 0.3,
})
```

---

## Effects on samples

```js
import { Song, Sample } from '@score/dsl'
import { Reverb, Delay } from '@score/effects'

const snare = Sample({
  path: './sounds/snare.wav',
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.7,
  effects: [
    Reverb({ roomSize: 0.4, wet: 0.2 }),
    Delay({ time: 0.125, feedback: 0.2, mix: 0.15 }),
  ],
})

export default Song({ bpm: 128, tracks: [snare] })
```

---

## Full sample kit example

```js
// sample-kit.js
import { Song, Sample } from '@score/dsl'
import { euclidean } from '@score/pattern'

const kick = Sample({
  path: './sounds/kick.wav',
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.9,
})

const snare = Sample({
  path: './sounds/snare.wav',
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.7,
})

const hat = Sample({
  path: './sounds/hat.wav',
  pattern: euclidean(7, 16),
  volume: 0.4,
})

const clap = Sample({
  path: './sounds/clap.wav',
  pattern: [0, 0, 0, 0,  0, 0, 1, 0,  0, 0, 0, 0,  0, 0, 1, 0],
  volume: 0.5,
})

export default Song({ bpm: 130, tracks: [kick, snare, hat, clap] })
```

---

## Notes

- Samples are decoded once at engine start — zero disk I/O during playback.
- Each trigger creates a fresh buffer source (Web Audio one-shot pattern).
- Audio files are gitignored. The repo has a `samples/` directory — add your own files there.
- Score does not bundle any audio files.
