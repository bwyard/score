# Song Format

A Score song is a plain ES module. It runs directly — never compiled. The only requirement is a default export of `Song(...)`.

## Minimal song

```js
import { Song, Kick } from '@score/dsl'

const kick = Kick({ pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0] })

export default Song({ bpm: 128, tracks: [kick] })
```

## `Song(props)` reference

| Prop | Type | Required | Description |
|---|---|---|---|
| `bpm` | `number` | Yes | Beats per minute. Must be > 0. |
| `tracks` | `InstrumentDescriptor[]` | Yes | At least one instrument. |
| `key` | `string` | No | Key string for metadata — `'Am'`, `'C'`, `'F#'`. |
| `genre` | `string` | No | Genre label for metadata — `'techno'`, `'deep-house'`. |

`key` and `genre` are metadata only — display, not playback.

## Allowed imports

Song files may import from:

```js
import { Song, Kick, Snare, HiHat, Synth, Sequence } from '@score/dsl'
import { euclidean, fast, slow, rev, shift, degrade, every, stack, beat, scaleNotes, chordNotes } from '@score/pattern'
import { Delay, Reverb, Filter, Distortion, EQ, Compressor } from '@score/effects'
import { fibonacci, entropy, createLorenz, logisticMap, drunk, markov } from '@score/math'
import { describe } from '@score/musical'
import { myKit } from './sounds/my-kit.js'  // local relative imports
```

Plain JavaScript is fine — `Math`, array methods, object literals, `const`, arrow functions.

## Blocked imports

The following are rejected by the AST validator **before any code runs**. Errors print the line number and a fix suggestion.

| Blocked | Reason |
|---|---|
| `fs`, `node:fs`, `fs/promises` | Filesystem access |
| `child_process`, `node:child_process` | Shell execution |
| `net`, `node:net` | Network sockets |
| `http`, `node:http`, `https`, `node:https` | HTTP |
| `os`, `node:os` | OS info |
| `crypto`, `node:crypto` | Crypto |
| `worker_threads`, `node:worker_threads` | Threading |

Also blocked:
- `eval()` calls
- `new Function()` calls
- `process.*` access
- Dynamic `import()` expressions

To skip validation for trusted files (dev only):
```bash
score play --trust my-song.js
```

## Code style

```js
// Correct
import { Song, Kick } from '@score/dsl'
const kick = Kick({ pattern: [1, 0, 0, 0] })
export default Song({ bpm: 140, tracks: [kick] })

// Wrong — do not use:
var kick = ...          // no var
function myFn() {}      // no function declarations
class MySong {}         // no classes
new AudioContext()      // no new
require('something')    // no require
```

## `Sequence()` DSL

Parses a space-separated string of note names and rests. `.` = rest.

```js
import { Sequence } from '@score/dsl'

Sequence('A2 . D3 . F3 . E3 .')
// → ['A2', null, 'D3', null, 'F3', null, 'E3', null]
```

Pass to a Synth's `sequence` prop:

```js
const lead = Synth({
  wave: 'sawtooth',
  sequence: Sequence('A3 . C4 . E4 . G4 .'),
})
```

## `describe()` — plain language hints

From `@score/musical`. Converts a description to an instrument descriptor using a fixed vocabulary table — no AI.

```js
import { describe } from '@score/musical'

const kick = describe('loud punchy kick hits every beat')
const bass = describe('warm sawtooth bass low frequency')
```

Unrecognized words are ignored. The returned descriptor can be used as a track directly.
