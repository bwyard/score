# Live Coding

Score's `--watch` mode reloads your song every time you save. Use it to hear changes instantly while writing.

## Start a watch session

```bash
score play my-song.js --watch
```

Every file save triggers a reload within ~300ms. If the new file has an error, the **previous version keeps playing** and the error prints to the terminal. Fix it and save again.

Add `--trust` to skip the security scan on each reload (faster for trusted files):

```bash
score play --watch --trust my-song.js
```

## Workflow

1. Open `my-song.js` in your editor
2. Start `score play my-song.js --watch` in a terminal
3. Edit and save — hear changes immediately
4. Keep the terminal visible — error messages appear there on bad reloads

## Function patterns with bar counter

The most powerful live coding tool: function patterns that change behavior by bar number.

```js
import { Song, Kick, HiHat, Synth } from '@score/dsl'

const kick = Kick({
  volume: 0.9,
  // Extra hit at step 12 on every 4th bar
  pattern: (step, bar) => {
    if (bar % 4 === 3 && step === 12) return 1
    return [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0][step]
  },
})

const bass = Synth({
  wave: 'sawtooth',
  gain: 0.28,
  envelope: { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.05 },
  filter: { type: 'lowpass', frequency: 900 },
  // Alternate two bass lines every 2 bars
  pattern: (step, bar) => {
    const lineA = ['A2', 0, 'A2', 0,  0, 'G2', 0, 'E2']
    const lineB = ['E2', 0, 'E2', 0,  0, 'A2', 0, 'G2']
    return (bar % 2 === 0 ? lineA : lineB)[step % 8] ?? 0
  },
})

export default Song({ bpm: 128, tracks: [kick, bass] })
```

`step` = 16th-note position within the bar (0–15 for 16 steps). `bar` = bar count from 0.

## Conditional variation with `every()`

`every(n, transform, pattern)` applies a transform on every `n`th bar — no manual bar checks needed.

```js
import { Song, Kick, HiHat } from '@score/dsl'
import { every, fast, degrade, euclidean } from '@score/pattern'

const kick = Kick({
  volume: 0.9,
  // Doubles speed every 4 bars — classic techno buildup
  pattern: every(4, p => fast(2, p), [1, 0, 0, 0]),
})

const hihat = HiHat({
  volume: 0.2,
  // Degrades 30% every other bar — loose, live feel
  pattern: every(2, p => degrade(0.3, p), euclidean(8, 16)),
})

export default Song({ bpm: 130, tracks: [kick, hihat] })
```

## Evolving patterns with math

```js
import { Song, Synth } from '@score/dsl'
import { createLorenz, range, normalize } from '@score/math'

// Lorenz attractor x-values mapped to filter frequencies
const lorenz = createLorenz()
const xs = Array.from({ length: 16 }, () => lorenz.next().x)
const filterFreqs = range(200, 2000, normalize(xs.map(v => Math.abs(v))))

// filterFreqs[step] changes each step — wire it in a function pattern
const bass = Synth({
  wave: 'sawtooth',
  gain: 0.28,
  envelope: { attack: 0.005, decay: 0.1, sustain: 0.5, release: 0.05 },
  filter: { type: 'lowpass', frequency: 900 },
  pattern: ['A2', 0, 'A2', 0,  0, 'D3', 0, 'E3'],
})

export default Song({ bpm: 128, tracks: [bass] })
```

## Tips

**Iterate on BPM last.** BPM changes require a full reload and can feel jarring mid-session. Get patterns right first, then dial the tempo.

**Keep instruments independent.** Array-pattern instruments are static anchors. Function-pattern instruments vary freely. Keep kick and snare static while you experiment with melody.

**Use seeds.** `drunk()` and `markov()` take a `seed` parameter. Change the seed to get a different variation of the same character:

```js
drunk(0.1, 16, 42)  // version A
drunk(0.1, 16, 17)  // version B — same character, different walk
```

**Keep levels conservative.** Set `gain` and `volume` to 0.1–0.3 during live sessions. Easy to accidentally clip when iterating fast.

**Error messages are your friend.** The terminal shows line numbers and fix suggestions on validation errors. The old version keeps playing — you never lose the beat.
