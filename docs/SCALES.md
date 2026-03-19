# Scales and Harmony

Scale and chord utilities come from `@score/pattern`. Tuning systems come from `@score/math`.

```js
import { scaleNotes, chordNotes } from '@score/pattern'
import { circleOfFifths, just, pythagorean, meantone, edo19, edo31 } from '@score/math'
```

---

## Note name format

All note names follow the format: **letter** + optional **accidental** + **octave number**.

- Letters: `A` `B` `C` `D` `E` `F` `G`
- Accidentals: `#` (sharp) or `b` (flat). No double accidentals.
- Octave: `0`–`8`. Middle C = `C4`.

### Chromatic reference C4–B4

| Note | Frequency | Enharmonic |
|---|---|---|
| `C4` | 261.63 Hz | — |
| `C#4` / `Db4` | 277.18 Hz | C# = Db |
| `D4` | 293.66 Hz | — |
| `D#4` / `Eb4` | 311.13 Hz | D# = Eb |
| `E4` | 329.63 Hz | — |
| `F4` | 349.23 Hz | — |
| `F#4` / `Gb4` | 369.99 Hz | F# = Gb |
| `G4` | 392.00 Hz | — |
| `G#4` / `Ab4` | 415.30 Hz | G# = Ab |
| `A4` | 440.00 Hz | — |
| `A#4` / `Bb4` | 466.16 Hz | A# = Bb |
| `B4` | 493.88 Hz | — |

### Practical ranges

| Register | Notes | Typical use |
|---|---|---|
| Sub-bass | `A0`–`A1` | Sub bass, 808 kicks |
| Bass | `A1`–`A2` | Bass lines |
| Low-mid bass | `A2`–`A3` | Bass leads, low synths |
| Mid | `A3`–`A4` | Leads, chords |
| High | `A4`–`A5` | Bright leads, arps |
| Air | `A5`–`C8` | Pads, shimmer |

---

## `scaleNotes(key, startOctave, octaves)`

Returns an array of note name strings for the given scale.

```js
scaleNotes('C', 4, 1)
// => ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']

scaleNotes('A', 3, 2)
// => ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5']
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `key` | `string` | Root note and scale type. Format: `'<note> <scale>'` or just `'<note>'` for major. Examples: `'C major'`, `'A minor'`, `'D dorian'`, `'G'`. |
| `startOctave` | `number` | Octave to start on. Default `4`. |
| `octaves` | `number` | Number of octaves to return. Default `1`. |

### All supported scales

| Scale name | Intervals (semitones from root) | Character |
|---|---|---|
| `major` | 0, 2, 4, 5, 7, 9, 11 | Bright, resolved |
| `minor` | 0, 2, 3, 5, 7, 8, 10 | Dark, melancholic |
| `dorian` | 0, 2, 3, 5, 7, 9, 10 | Minor with raised 6th. Funky, modal. |
| `phrygian` | 0, 1, 3, 5, 7, 8, 10 | Minor with flat 2nd. Dark, Iberian, metal. |
| `lydian` | 0, 2, 4, 6, 7, 9, 11 | Major with raised 4th. Dreamy, floating. |
| `mixolydian` | 0, 2, 4, 5, 7, 9, 10 | Major with flat 7th. Bluesy, rock. |
| `locrian` | 0, 1, 3, 5, 6, 8, 10 | Diminished. Unstable, tense. |
| `pentatonic` | 0, 2, 4, 7, 9 | Major pentatonic. Open, universal. |
| `minor pentatonic` | 0, 3, 5, 7, 10 | Minor pentatonic. Blues foundation. |
| `blues` | 0, 3, 5, 6, 7, 10 | Minor pentatonic + tritone. |
| `harmonic minor` | 0, 2, 3, 5, 7, 8, 11 | Minor with raised 7th. Classical, exotic. |
| `melodic minor` | 0, 2, 3, 5, 7, 9, 11 | Raised 6th and 7th ascending. Jazz. |
| `whole tone` | 0, 2, 4, 6, 8, 10 | Six equal tones. Dreamy, ambiguous. |
| `diminished` | 0, 2, 3, 5, 6, 8, 9, 11 | Alternating whole/half steps. Eight notes. Tense, symmetrical. |
| `chromatic` | 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 | All 12 semitones. |

### Examples

```js
// A natural minor — classic dark bass line foundation
scaleNotes('A minor', 2, 1)
// => ['A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3']

// D dorian — funky modal feel, two octaves
scaleNotes('D dorian', 3, 2)
// => ['D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']

// E blues — for a lead pattern
scaleNotes('E blues', 4, 1)
// => ['E4', 'G4', 'A4', 'Bb4', 'B4', 'D5']

// F# harmonic minor — raised 7th creates strong leading tone
scaleNotes('F# harmonic minor', 3, 1)
// => ['F#3', 'G#3', 'A3', 'B3', 'C#4', 'D4', 'E#4']

// G whole tone — ambiguous, floating
scaleNotes('G whole tone', 4, 1)
// => ['G4', 'A4', 'B4', 'C#5', 'D#5', 'F5']
```

### Using scaleNotes in a pattern

```js
import { Synth } from '@score/dsl'
import { scaleNotes } from '@score/pattern'

const scale = scaleNotes('A minor', 3, 2)
// scale[0] = 'A3', scale[1] = 'B3', scale[2] = 'C4', ...

const arp = Synth({
  wave: 'triangle',
  gain: 0.2,
  envelope: { attack: 0.005, decay: 0.12, sustain: 0.0, release: 0.08 },
  pattern: [scale[0], 0, scale[2], 0,  scale[4], 0, scale[7], 0,
            scale[4], 0, scale[2], 0,  scale[0], 0, 0,        0],
})
```

---

## `chordNotes(chord, octave)`

Returns an array of note name strings for a chord.

```js
chordNotes('Am', 3)
// => ['A3', 'C4', 'E4']

chordNotes('C', 4)
// => ['C4', 'E4', 'G4']
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `chord` | `string` | Chord symbol. Root note + quality suffix. Examples: `'C'`, `'Am'`, `'G7'`, `'Fmaj7'`. |
| `octave` | `number` | Octave of the root note. |

### Supported chord types

| Suffix | Full name | Intervals from root | Example |
|---|---|---|---|
| _(none)_ | Major | 0, 4, 7 | `'C'` |
| `m` | Minor | 0, 3, 7 | `'Am'` |
| `7` | Dominant 7th | 0, 4, 7, 10 | `'G7'` |
| `maj7` | Major 7th | 0, 4, 7, 11 | `'Cmaj7'` |
| `min7` | Minor 7th | 0, 3, 7, 10 | `'Amin7'` |
| `sus2` | Suspended 2nd | 0, 2, 7 | `'Dsus2'` |
| `sus4` | Suspended 4th | 0, 5, 7 | `'Asus4'` |
| `dim` | Diminished | 0, 3, 6 | `'Bdim'` |
| `aug` | Augmented | 0, 4, 8 | `'Eaug'` |

### Examples

```js
chordNotes('Am', 3)   // => ['A3', 'C4', 'E4']
chordNotes('F', 3)    // => ['F3', 'A3', 'C4']
chordNotes('G7', 3)   // => ['G3', 'B3', 'D4', 'F4']
chordNotes('Cmaj7', 4) // => ['C4', 'E4', 'G4', 'B4']
chordNotes('Bdim', 3) // => ['B3', 'D4', 'F4']
```

### Using chordNotes in a Synth pattern

```js
import { Synth } from '@score/dsl'
import { chordNotes } from '@score/pattern'

// Pad plays chord tones on beat 1 of each bar using a function pattern
const pad = Synth({
  wave: 'triangle',
  gain: 0.15,
  envelope: { attack: 0.4, decay: 0.1, sustain: 0.9, release: 0.8 },
  pattern: (step, bar) => {
    const chords = ['Am', 'F', 'C', 'G']
    const chord = chords[bar % 4]
    const notes = chordNotes(chord, 3)
    if (step === 0) return notes[0]
    if (step === 4) return notes[1]
    if (step === 8) return notes[2]
    return 0
  },
})
```

---

## Tuning systems

Import from `@score/math`. Each function returns a frequency in Hz for a given MIDI note number or note name.

```js
import { just, pythagorean, meantone, edo19, edo31 } from '@score/math'
```

All tuning functions share the signature: `tuning(note: string | number): number` returning Hz.

Apply to a Synth by converting note names to Hz via the tuning function:

```js
import { Synth } from '@score/dsl'
import { just } from '@score/math'
import { scaleNotes } from '@score/pattern'

const scale = scaleNotes('C major', 3, 1)
const justScale = scale.map(note => just(note))

const bass = Synth({
  wave: 'sine',
  gain: 0.35,
  pattern: justScale,
})
```

### Tuning system reference

| Function | System | Character | Use when |
|---|---|---|---|
| `just()` | Just intonation | Pure intervals. Beatless perfect fifths and thirds. | Drone music, static harmony, pure chord voicings. |
| `pythagorean()` | Pythagorean | Pure fifths, wide thirds. | Medieval, early music, parallel fifths. |
| `meantone()` | Quarter-comma meantone | Pure major thirds, slightly narrow fifths. | Renaissance and baroque music. |
| `edo19()` | 19-tone equal division of the octave | Better minor thirds than 12-TET. Xenharmonic. | Microtonal composition, extended harmony. |
| `edo31()` | 31-tone equal division of the octave | Near-just intervals. Very fine resolution. | Complex microtonal work, xenharmonic pop. |

### `just(note)`

Returns the just-intonation frequency for a note name. Intervals are pure ratios (5-limit just intonation): unison 1:1, perfect fifth 3:2, major third 5:4.

```js
just('A4')   // => 440.0
just('E5')   // => 660.0    (pure 3:2 fifth above A4)
just('C#5')  // => 550.0    (pure 5:4 major third above A4)
```

### `pythagorean(note)`

Generates frequencies by stacking pure fifths (3:2) from a reference pitch. Major thirds are wide (~81:64). Sounds open and hollow.

```js
pythagorean('D4')  // => 293.33 Hz (pure fifth chain from C)
```

### `meantone(note)`

Quarter-comma meantone. Fifths are narrowed slightly to produce pure major thirds. Standard tuning for harpsichords and organs before equal temperament.

### `edo19(note)`

19 equal divisions of the octave. Each step = 63.16 cents. Minor thirds are closer to just than 12-TET. Good for diatonic music with richer harmony.

### `edo31(note)`

31 equal divisions of the octave. Each step = 38.71 cents. Closely approximates 5-limit just intonation. The most harmonically rich of the available microtonal systems.

---

## `circleOfFifths(n)`

Returns the note name at position `n` on the circle of fifths, starting at C (position 0).

```js
import { circleOfFifths } from '@score/math'

circleOfFifths(0)  // => 'C'
circleOfFifths(1)  // => 'G'
circleOfFifths(7)  // => 'E'
```

### Full table

| Position | Note | Key signature | Relative minor |
|---|---|---|---|
| 0 | C | 0 sharps/flats | A minor |
| 1 | G | 1 sharp (F#) | E minor |
| 2 | D | 2 sharps | B minor |
| 3 | A | 3 sharps | F# minor |
| 4 | E | 4 sharps | C# minor |
| 5 | B | 5 sharps | G# minor |
| 6 | F# / Gb | 6 sharps / 6 flats | D# / Eb minor |
| 7 | Db | 5 flats | Bb minor |
| 8 | Ab | 4 flats | F minor |
| 9 | Eb | 3 flats | C minor |
| 10 | Bb | 2 flats | G minor |
| 11 | F | 1 flat (Bb) | D minor |

Positions wrap modulo 12: `circleOfFifths(13)` === `circleOfFifths(1)` === `'G'`.

---

## Practical examples

### 1. Minor key bass line using `scaleNotes`

```js
import { Song, Synth } from '@score/dsl'
import { scaleNotes } from '@score/pattern'

const scale = scaleNotes('A minor', 2, 1)
// ['A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3']

const bass = Synth({
  wave: 'sawtooth',
  gain: 0.3,
  envelope: { attack: 0.005, decay: 0.08, sustain: 0.6, release: 0.04 },
  filter: { type: 'lowpass', frequency: 800, Q: 1.2 },
  pattern: [
    scale[0], 0,        scale[0], 0,
    scale[2], 0,        scale[4], 0,
    scale[3], 0,        scale[3], 0,
    scale[1], scale[0], 0,        0,
  ],
})

export default Song({ bpm: 130, key: 'Am', tracks: [bass] })
```

### 2. Four-chord progression using `chordNotes`

```js
import { Song, Synth, Kick, Snare, HiHat } from '@score/dsl'
import { chordNotes } from '@score/pattern'

const pad = Synth({
  wave: 'triangle',
  gain: 0.12,
  envelope: { attack: 0.5, decay: 0.1, sustain: 0.85, release: 1.0 },
  pattern: (step, bar) => {
    const progression = ['Am', 'F', 'C', 'G']
    const notes = chordNotes(progression[bar % 4], 3)
    if (step === 0) return notes[0]
    if (step === 6) return notes[1]
    if (step === 10) return notes[2]
    return 0
  },
})

const kick = Kick({ pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0] })
const snare = Snare({ pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0] })
const hihat = HiHat({ pattern: [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0], volume: 0.2 })

export default Song({ bpm: 125, key: 'Am', tracks: [kick, snare, hihat, pad] })
```

### 3. Just intonation bass

```js
import { Song, Synth } from '@score/dsl'
import { just } from '@score/math'
import { scaleNotes } from '@score/pattern'

const scale = scaleNotes('C major', 2, 1)
const justFreqs = scale.map(n => just(n))
// Pure-ratio frequencies: no beating intervals

const bass = Synth({
  wave: 'sine',
  gain: 0.4,
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.1 },
  pattern: [
    justFreqs[0], 0, justFreqs[0], 0,
    justFreqs[4], 0, justFreqs[4], 0,
    justFreqs[3], 0, justFreqs[5], 0,
    justFreqs[4], 0, 0,            0,
  ],
})

export default Song({ bpm: 96, tracks: [bass] })
```

### 4. Circle-of-fifths chord progression

```js
import { Song, Synth } from '@score/dsl'
import { circleOfFifths } from '@score/math'
import { chordNotes } from '@score/pattern'

// Build a descending-fifths chord sequence: C → F → Bb → Eb
const roots = [0, 11, 10, 9].map(n => circleOfFifths(n))
// => ['C', 'F', 'Bb', 'Eb']

const pad = Synth({
  wave: 'triangle',
  gain: 0.14,
  envelope: { attack: 0.6, decay: 0.1, sustain: 0.9, release: 1.2 },
  pattern: (step, bar) => {
    const notes = chordNotes(roots[bar % 4] + 'maj7', 3)
    if (step === 0) return notes[0]
    if (step === 8) return notes[2]
    return 0
  },
})

export default Song({ bpm: 100, tracks: [pad] })
```
