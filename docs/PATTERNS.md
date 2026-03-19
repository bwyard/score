# Patterns

Patterns control when notes and hits play. All pattern utilities are in `@score/pattern`.

```js
import { euclidean, fast, slow, rev, shift, degrade, every, stack, beat, scaleNotes, chordNotes } from '@score/pattern'
```

---

## Array patterns

The simplest pattern — a plain JavaScript array. 16 steps = one bar at 16th-note resolution.

```js
// Rhythmic: 1 = hit, 0 = rest
pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0]

// Melodic: note name or 0 (rest)
pattern: ['A2', 0, 'D3', 0,  'E3', 0, 'A3', 0]
```

Patterns loop automatically. An 8-step array repeats every half bar.

---

## `beat(...steps)`

Shorthand for writing an array literal. Identical output.

```js
beat(1, 0, 0, 0)               // → [1, 0, 0, 0]
beat(1, 0, 1, 0, 1, 0, 1, 0)  // → [1, 0, 1, 0, 1, 0, 1, 0]
```

---

## `euclidean(hits, steps, rotation?)`

Distributes `hits` as evenly as possible across `steps` using the Bjorklund algorithm.

```js
euclidean(3, 8)     // → [1,0,0,1,0,0,1,0]  Cuban clave
euclidean(5, 8)     // → [1,0,1,0,1,1,0,1]  bossa nova
euclidean(4, 16)    // → four-on-the-floor at 16th resolution
euclidean(3, 8, 2)  // → clave rotated 2 steps right
```

| Param | Type | Description |
|---|---|---|
| `hits` | `number` | Active steps to distribute |
| `steps` | `number` | Total pattern length |
| `rotation` | `number` | Optional phase offset (default `0`) |

### Well-known euclidean rhythms

| `euclidean(k, n)` | Name |
|---|---|
| `(2, 3)` | Tresillo (son clave 3-side) |
| `(3, 8)` | Cuban clave |
| `(4, 9)` | Turkish aksak |
| `(5, 8)` | Bossa nova |
| `(4, 16)` | Four-on-the-floor |
| `(7, 16)` | Dense syncopated |

---

## Function patterns

A function `(step, bar) => value` is called once per step per bar.

```js
// Alternate between two bass lines every bar
pattern: (step, bar) => {
  const lineA = ['A2', 0, 'D3', 0]
  const lineB = ['E2', 0, 'A2', 0]
  return (bar % 2 === 0 ? lineA : lineB)[step % 4]
}

// Extra kick hit on last bar of every 4
pattern: (step, bar) => {
  if (bar % 4 === 3 && step === 14) return 1
  return [1, 0, 0, 0,  1, 0, 0, 0][step % 8]
}
```

- `step` — 16th-note position within the bar (0–15 for 16 steps)
- `bar` — bar counter starting at 0, increments each bar

All transforms return function patterns and receive `step` and `bar` at runtime.

---

## Transforms

All transforms accept an array or function pattern and return a function pattern `(step, bar) => value`.

### `fast(n, pattern)`

Speed up by factor `n`. `fast(2, pat)` plays the pattern twice per bar.

```js
pattern: fast(2, [1, 0, 1, 0])        // 16th-note rush
pattern: fast(4, euclidean(3, 8))      // rapid euclidean fill
```

### `slow(n, pattern)`

Slow down by factor `n`. Each step plays for `n` times as long.

```js
pattern: slow(2, [0, 0, 1, 0,  0, 0, 1, 0])  // half-time snare
```

### `rev(pattern)`

Reverse the pattern — last step to first.

```js
pattern: rev(['C4', 'E4', 'G4', 'A4'])  // retrograde melody
```

### `shift(n, pattern)`

Rotate by `n` steps. Positive = shift right (later), negative = shift left (earlier).

```js
pattern: shift(1, [0, 0, 1, 0,  0, 0, 1, 0])  // snare one 16th late
pattern: shift(-2, euclidean(3, 8))             // clave shifted left 2
```

### `degrade(probability, pattern)`

Randomly silence hits. `probability` = chance (0–1) of dropping each active step per bar.

```js
pattern: degrade(0.3, [1, 1, 1, 1])    // drop ~30% of hits
pattern: degrade(0.5, euclidean(5, 8)) // sparse euclidean
```

### `every(n, transform, pattern)`

Apply `transform` on every `n`th bar. Original pattern on other bars.

```js
// Kick doubles speed every 4 bars
pattern: every(4, p => fast(2, p), [1, 0, 0, 0])

// Hi-hat reverses every other bar
pattern: every(2, rev, [1, 0, 1, 1])

// Degrade on bars 0, 8, 16 ...
pattern: every(8, p => degrade(0.5, p), [0, 0, 1, 0])
```

`transform` receives the current pattern and returns a new pattern.

---

## `stack(...patterns)`

Layer multiple patterns. At each step, returns the first non-zero value found across all patterns.

```js
// Kick + snare in one track
const groove = stack(
  [1, 0, 0, 0,  1, 0, 0, 0],  // kick hits
  [0, 0, 1, 0,  0, 0, 1, 0],  // snare hits
)

// Polyrhythmic overlay
const poly = stack(euclidean(3, 8), euclidean(5, 8))
```

---

## Scale and chord utilities

### `scaleNotes(key, startOctave?, octaves?)`

Returns all note names in a scale, ascending.

```js
scaleNotes('C', 4, 1)   // → ['C4','D4','E4','F4','G4','A4','B4']
scaleNotes('Am', 3, 1)  // → ['A3','B3','C4','D4','E4','F4','G4']
scaleNotes('C', 3, 2)   // → 14 notes spanning two octaves
```

| Param | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | — | `'C'` = C major, `'Am'` = A minor, `'F#'` = F# major |
| `startOctave` | `number` | `3` | Lowest octave |
| `octaves` | `number` | `1` | Number of octaves |

If the key contains `m` (and not `maj`), minor is used. Otherwise major.

Supported scale modes: `major`, `minor`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `locrian`, `pentatonic`, `blues`.

Feed directly into a Synth pattern:
```js
const melody = Synth({ pattern: scaleNotes('Am', 3, 1) })
```

### `chordNotes(chord, octave?)`

Returns the three notes of a triad `[root, third, fifth]`.

```js
chordNotes('Am', 3)  // → ['A3', 'C4', 'E4']
chordNotes('C', 4)   // → ['C4', 'E4', 'G4']
chordNotes('Dm', 3)  // → ['D3', 'F3', 'A3']
```

---

## Boolean pattern operations (`@score/math`)

```js
import { patternOr, patternAnd, patternXor, patternNot, tile, polyrhythm } from '@score/math'

patternOr([1,0,0,0], [0,0,1,0])   // → [1,0,1,0]  — hit where either hits
patternAnd([1,0,1,0], [1,0,0,0])  // → [1,0,0,0]  — hit only where both hit
patternXor([1,0,1,0], [1,0,0,0])  // → [0,0,1,0]  — hit where exactly one hits
patternNot([1,0,0,0])             // → [0,1,1,1]  — flip all
tile([1,0,0], 8)                  // → [1,0,0,1,0,0,1,0]  — fill to length
polyrhythm([1,0,0], [1,0,0,0])   // — 12-step 3-against-4 combination
```

See [MATH.md](MATH.md) for the full reference.
