# Gregorian Chant in Score

Gregorian chant is implementable in Score **right now** using `Synth` + church modes from `@score/pattern`.
Some characteristics are fully supported; two require workarounds or future features.

---

## What Gregorian chant is (and why it maps to Score the way it does)

| Characteristic | What it means | Score equivalent |
|----------------|---------------|-----------------|
| **Monophonic** | Single melodic line — no chords, no harmony | One `Synth` track, no polyphony |
| **Church modes** | Not major/minor — uses Dorian, Phrygian, Lydian, Mixolydian | `scaleNotes('Dm', ...)` etc. — all 8 modes in `@score/pattern` |
| **Free rhythm** | Rhythm follows syllable stress of Latin text — not metered | Approximated with sparse patterns + long BPM |
| **Monastic vocal timbre** | Pure, hollow, resonant — no vibrato | `sine` or `triangle` wave, slow attack, no filter |
| **Stepwise motion** | Melodies move mostly by one or two semitones | Write note names that step up/down the scale |
| **No percussion** | Completely unmetered — no kick, snare, hi-hat | Just the `Synth` track |

---

## What works right now

### Modal scales

All eight church modes are in `@score/pattern`. They were the harmonic system for a thousand years before major/minor took over.

```js
import { scaleNotes } from '@score/pattern'

// The 8 church modes — each starting on a different degree of C major
scaleNotes('Dm', 3)   // Dorian    — D E F G A B C D  (minor, but raised 6th — sounds medieval)
scaleNotes('Em', 3)   // Phrygian  — E F G A B C D E  (very dark, Spanish/Byzantine flavour)
scaleNotes('F', 3)    // Lydian    — F G A B C D E F  (major, raised 4th — ethereal, floating)
scaleNotes('G', 3)    // Mixolydian — G A B C D E F G (major, lowered 7th — ancient, modal rock)
scaleNotes('Am', 3)   // Aeolian   — natural minor
scaleNotes('C', 3)    // Ionian    — natural major (least common in chant)
```

Gregorian chant uses primarily **Dorian** and **Phrygian** modes. These sound distinctly "ancient" to modern ears because they predate the major/minor system.

### Basic chant voice

```js
import { Synth } from '@score/dsl'

const chantVoice = Synth({
  wave: 'sine',        // pure tone — closest to unadorned vocal resonance
  gain: 0.3,

  envelope: {
    attack:  0.08,   // slow bloom — voices don't punch, they swell
    decay:   0.05,
    sustain: 0.85,   // held, sustained — chant notes are long
    release: 0.3,    // gentle fade — no abrupt cut-off
  },

  // No filter — the absence of filtering gives it openness/purity
  // (A soft lowpass can warm it if you want more "cathedral" resonance)
})
```

### A chant phrase in Dorian mode

Gregorian chant moves stepwise. A typical phrase ascends and descends gently within an octave.

```js
import { Song, Synth } from '@score/dsl'
import { scaleNotes } from '@score/pattern'

// Dorian scale notes for reference: D E F G A B C D
const chant = Synth({
  wave: 'sine',
  gain: 0.3,
  envelope: { attack: 0.08, decay: 0.05, sustain: 0.85, release: 0.3 },

  // Ascending phrase then descending — classic chant contour
  // 0s create space between notes (the "breath" between syllables)
  pattern: [
    'D4', 0, 'E4', 0,   'F4', 0, 'G4', 0,   // rise
    'A4', 0,  0,   0,   'G4', 0, 'F4', 0,   // peak, hold, descend
    'E4', 0, 'D4', 0,    0,   0,  0,   0,   // resolve, rest
  ],
})

export default Song({
  bpm:    52,     // very slow — chant is not metered but this creates the long-note feel
  tracks: [chant],
})
```

### Phrygian mode (dark, Byzantine)

The Phrygian mode has a distinctive half-step at the bottom (E–F) that gives it a deeply archaic flavour. Used in chants associated with Holy Week and Easter.

```js
const chant = Synth({
  wave: 'sine',
  gain: 0.3,
  envelope: { attack: 0.1, decay: 0.05, sustain: 0.85, release: 0.4 },

  // Phrygian: E F G A B C D E — note the E→F half-step at the start
  pattern: [
    'E4', 0, 'F4', 0,   'G4', 0, 'A4', 0,
    'G4', 0, 'F4', 0,   'E4', 0,  0,   0,
  ],
})
```

### Cathedral reverb effect

Gregorian chant was composed for stone cathedrals with 8–10 second reverb tails.
The `@score/effects` package has a reverb you can apply:

```js
import { Song, Track, Synth } from '@score/dsl'
import { createReverb } from '@score/effects'

// Wrap in Track() to apply effects
const chant = Track(
  Synth({ wave: 'sine', gain: 0.3, envelope: { attack: 0.08, sustain: 0.85, release: 0.3 } }),
  { volume: 0.8 }
)
// (Full effects routing via @score/mixer — see SONG_FORMAT.md)
```

---

## What requires workarounds

### Free rhythm

Gregorian chant has **unmeasured rhythm** — note durations follow the syllable stress of Latin text, not a metronome. There is no beat grid.

**Current limitation:** Score uses a fixed BPM grid. Every note falls on a 16th-note step.

**Workaround:** Use a very slow BPM (40–60) and space notes with `0`s to simulate long/short duration contrast. Notes at adjacent steps sound legato; notes with `0` gaps sound separated.

```js
// Simulate long-short rhythm contrast at BPM 50
// Long note = one step, gap = two zeros
// Short note = one step, short gap = one zero
pattern: ['D4', 0, 0, 'E4', 0, 'F4', 0, 0, 0, 'E4', 0, 0, 'D4', 0, 0, 0]
//         long          short   long              medium     long (end)
```

**Future feature (Phase 9):** `@score/musical` will add a `describe()` function that can parse text rhythm directions. Phase 12 adds a neume notation importer.

### True vocal timbre

Score synthesizes sound — it cannot currently load vocal samples. A sine wave approximates the "pure tone" quality of chant, but it won't sound like actual monks.

**Current:** `wave: 'sine'` with slow envelope — recognizably chant-like in character.

**Future feature (Phase 4+):** Sample playback with `@score/sampler`. You'd load a chant vocal sample and use Score's pattern system to sequence it.

---

## Full working example — Kyrie (opening of the Ordinary)

```js
import { Song, Synth } from '@score/dsl'

// Kyrie Eleison — "Lord have mercy" — one of the oldest chants
// Mode: Dorian (D E F G A B C D)
// Phrase structure: Kyrie (3x), Christe (3x), Kyrie (3x)

const kyrie = Synth({
  wave: 'sine',
  gain: 0.28,
  envelope: {
    attack:  0.1,
    decay:   0.05,
    sustain: 0.8,
    release: 0.4,
  },

  // "Ky-ri-e  e-lei-son" — rising then falling phrase
  pattern: [
    // Kyrie
    'D4', 0, 'F4', 0,   'E4', 0,  0,  0,   // Ky  - ri  - e
    'G4', 0, 'A4', 0,   'G4', 0, 'F4', 0,  // e - le  - i -
    'E4', 0, 'D4', 0,    0,   0,  0,   0,  // son     (rest)

    // Christe (higher register)
    'F4', 0, 'G4', 0,   'A4', 0,  0,  0,
    'Bb4', 0, 'A4', 0,  'G4', 0, 'F4', 0,
    'E4', 0, 'D4', 0,    0,   0,  0,   0,
  ],
})

export default Song({
  bpm:    48,           // very slow — gives each step ~310ms
  key:    'Dm',         // Dorian
  genre:  'gregorian chant',
  tracks: [kyrie],
})
```

---

## Summary — what Score handles vs what's coming

| Feature | Status |
|---------|--------|
| Church modes (Dorian, Phrygian, Lydian, Mixolydian...) | **Now** — `scaleNotes()` in `@score/pattern` |
| Pure sine-wave vocal approximation | **Now** — `Synth({ wave: 'sine' })` |
| Slow envelope (swell and sustain) | **Now** — `envelope` props |
| Stepwise melodic writing | **Now** — write note names by hand or from `scaleNotes()` |
| Free/unmeasured rhythm | **Workaround** — slow BPM + manual `0` spacing |
| Cathedral reverb | **Now** — `@score/effects` reverb |
| Actual vocal samples | **Future** — Phase 4 sampler (`@score/sampler`) |
| Neume notation import | **Future** — Phase 12 decode |
| Natural language rhythm directions | **Future** — `@score/musical` `describe()` |
