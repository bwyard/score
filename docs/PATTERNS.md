# Score Patterns — DSL Reference

Patterns control when notes and hits play. Score supports three pattern formats.

---

## Array patterns (always available)

The simplest format. Each element is one 16th-note step.

```js
// 1 = play, 0 = silence
const kick = Kick({ pattern: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0] })

// For Synth, non-zero values are note names or Hz frequencies
const bass = Synth({ pattern: ['A2', 0, 0, 0,  'D3', 0, 0, 0] })
```

Patterns loop automatically. An 8-step pattern plays twice per bar.

---

## Euclidean patterns (`@score/pattern`)

Euclidean rhythms distribute hits as evenly as possible across steps.
They appear in African, Cuban, and Middle Eastern music — they sound right because they are mathematically even.

```js
import { euclidean } from '@score/pattern'

// euclidean(hits, steps, rotation?)
euclidean(4, 16)   // [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]  four on the floor
euclidean(3, 8)    // [1,0,0,1,0,0,1,0]   classic clave (Cuba/West Africa)
euclidean(5, 16)   // [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0]  bossa nova feel
euclidean(7, 16)   // denser, off-beat feel
euclidean(2, 3)    // son clave 3-side
```

### Rotation

Shifts the pattern by N steps (preserves the rhythm, changes where it starts):

```js
euclidean(3, 8, 2)  // start 2 steps later — [1,0,0,1,0,0,1,0] → [0,1,0,0,1,0,0,1]
```

### Well-known euclidean rhythms

| `euclidean(k, n)` | Pattern | Name |
|-------------------|---------|------|
| `(2, 3)` | `[1,0,1]` | Tresillo (son clave 3-side) |
| `(3, 4)` | `[1,0,1,1]` | Cumbia rhythm |
| `(3, 8)` | `[1,0,0,1,0,0,1,0]` | Cuban clave |
| `(4, 9)` | `[1,0,1,0,1,0,1,0,0]` | Turkish aksak |
| `(5, 8)` | `[1,0,1,0,1,1,0,1]` | Bossa nova |
| `(7, 8)` | `[1,0,1,1,1,1,1,1]` | Seven attacks in 8 |
| `(4, 16)` | 4-on-floor | House, techno |
| `(5, 16)` | Syncopated | Hip-hop, R&B |

---

## Pattern transforms (`@score/pattern`)

Transform functions take a pattern and return a new pattern. They compose freely.

```js
import { fast, slow, rev, every, degrade, shift, scaleNotes, chordNotes } from '@score/pattern'
```

### `fast(n, pattern)` — double time

Speeds the pattern up by a factor of `n`. At `n=2`, the pattern plays twice per bar.

```js
const hihat = HiHat({ pattern: fast(2, [1,0,1,0]) })
// The [1,0,1,0] pattern plays at 2x speed — 4 hits per step group instead of 2
```

### `slow(n, pattern)` — half time

Slows the pattern by a factor of `n`. At `n=2`, the pattern takes 2 bars.

```js
const bass = Synth({ pattern: slow(2, ['A2', 0, 'D3', 0, 'F3', 0, 'E3', 0]) })
// Plays through the pattern over 2 bars instead of 1
```

### `rev(pattern)` — reverse

Plays the pattern backwards.

```js
const snare = Snare({ pattern: rev([1,0,0,0, 1,0,0,0, 0,0,1,0, 0,0,0,0]) })
```

### `shift(n, pattern)` — rotate

Shifts the pattern start point by `n` steps. Equivalent to euclidean rotation.

```js
const kick = Kick({ pattern: shift(2, [1,0,0,0, 1,0,0,0]) })
// [0,0,1,0, 0,0,1,0] — same rhythm, 2 steps later
```

### `every(n, transform, pattern)` — conditional transform

Applies a transform every `n` bars. Leaves the pattern unchanged on other bars.

```js
// Every 4 bars, play the kick pattern double-time
const kick = Kick({
  pattern: every(4, p => fast(2, p), [1,0,0,0, 1,0,0,0])
})

// Every 8 bars, reverse the hihat
const hihat = HiHat({
  pattern: every(8, rev, [1,0,1,0, 1,0,1,0])
})
```

### `degrade(probability, pattern)` — random drops

Randomly silences hits with the given probability. `0` = keep all, `1` = drop all, `0.3` = drop 30%.
The randomness is deterministic within each bar — the same bar always sounds the same.

```js
const hihat = HiHat({
  pattern: degrade(0.25, [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1])  // drop ~25%
})
```

---

## Scale and chord utilities (`@score/pattern`)

### `scaleNotes(key, startOctave?, octaves?)` — get notes in a key

Returns all note names in a key as an array. Use these in a Synth pattern.

```js
import { scaleNotes } from '@score/pattern'

scaleNotes('Am', 2, 2)
// ['A2','B2','C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4']

scaleNotes('Cmaj', 3)   // one octave of C major from octave 3
// ['C3','D3','E3','F3','G3','A3','B3']
```

Supported scale names: `major`, `minor`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `locrian`, `pentatonic`, `blues`.

Key notation: `'Am'` or `'Amin'` = A minor. `'Cmaj'` or `'C'` = C major.

### `chordNotes(chord, octave?)` — get notes in a chord

Returns the three notes of a triad. Use for pad stabs, arpeggios, or chord comping.

```js
import { chordNotes } from '@score/pattern'

chordNotes('Am', 3)   // ['A3', 'C4', 'E4']   — A minor triad
chordNotes('C', 4)    // ['C4', 'E4', 'G4']   — C major triad
chordNotes('Dm', 3)   // ['D3', 'F3', 'A3']   — D minor triad
chordNotes('G', 3)    // ['G3', 'B3', 'D4']   — G major triad
```

---

## Function patterns (advanced)

A pattern can be a function `(step, bar) => value`. The engine calls it every step.

```js
// Rising bass line — different note each bar
const bass = Synth({
  pattern: (step, bar) => {
    const notes = ['A2', 'D3', 'F3', 'E3']
    if (step % 4 === 0) return notes[bar % notes.length]
    return 0
  }
})

// Infinite live-loop pattern — never the same twice
const hihat = HiHat({
  pattern: (step, bar) => Math.random() > 0.5 ? 1 : 0
})
```

Pattern functions receive:
- `step` — the current step within the bar (0-15 for 16 steps)
- `bar` — the current bar number (starts at 0, increments each bar)

---

## Note name reference

Format: **letter** + optional **# or b** + **octave number**

```
Octave 0  — sub-sub bass (rarely used)
Octave 1  — sub bass (808 territory: A1 = 55 Hz)
Octave 2  — bass (A2 = 110 Hz, deep bass line territory)
Octave 3  — low-mid (A3 = 220 Hz, bass guitar open A)
Octave 4  — mid (A4 = 440 Hz, standard tuning reference)
Octave 5  — upper-mid (A5 = 880 Hz, lead melodies)
Octave 6  — high (A6 = 1760 Hz, high leads, bells)
Octave 7  — very high (mostly percussion tone tuning)
```

Full chromatic scale from C4:
```
C4  C#4  D4  Eb4  E4  F4  F#4  G4  Ab4  A4  Bb4  B4
261  277  294  311  330  349  370  392  415  440  466  494 Hz
```

Sharps and flats are enharmonic equivalents:
- `'C#4'` = `'Db4'` (same note, two names)
- `'F#3'` = `'Gb3'`
- In Score, use whichever feels natural for the key you're in.
