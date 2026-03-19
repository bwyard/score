# Examples

Eight complete runnable songs. All work with `score play <filename>`. Add `--watch` to edit live.

---

## 1. Minimal techno

Four-on-the-floor kick, offbeat hi-hat, sawtooth bass. 125 BPM.

```js
// minimal-techno.js
import { Song, Kick, HiHat, Synth } from '@score/dsl'

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  synth: { frequency: 65, pitchDrop: 0.12 },
  volume: 0.9,
})

const hihat = HiHat({
  pattern: [0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0],
  volume: 0.3,
})

const bass = Synth({
  wave: 'sawtooth',
  gain: 0.28,
  envelope: { attack: 0.003, decay: 0.08, sustain: 0.5, release: 0.04 },
  filter: { type: 'lowpass', frequency: 700, Q: 1.5 },
  pattern: ['A2', 0, 0, 0,  'A2', 0, 'G2', 0,  'A2', 0, 0, 0,  'E2', 0, 0, 0],
})

export default Song({ bpm: 125, key: 'Am', tracks: [kick, hihat, bass] })
```

---

## 2. Euclidean drums

Three euclidean rhythms layered into a polyrhythmic groove.

```js
// euclidean-drums.js
import { Song, Kick, Snare, HiHat } from '@score/dsl'
import { euclidean, stack } from '@score/pattern'

const kick = Kick({
  pattern: euclidean(4, 16),
  volume: 0.9,
})

const snare = Snare({
  pattern: euclidean(3, 16, 4),
  volume: 0.55,
})

const hihat = HiHat({
  pattern: stack(euclidean(5, 16), euclidean(3, 16, 8)),
  volume: 0.2,
})

export default Song({ bpm: 132, tracks: [kick, snare, hihat] })
```

---

## 3. Chaos bass (Lorenz attractor)

Bass frequencies driven by the x-axis of a Lorenz attractor.

```js
// chaos-bass.js
import { Song, Kick, Synth } from '@score/dsl'
import { createLorenz, range, normalize, clip } from '@score/math'

const lorenz = createLorenz()
const xs = Array.from({ length: 16 }, () => lorenz.next().x)
const bassFreqs = clip(40, 300, range(40, 300, normalize(xs.map(v => Math.abs(v)))))

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.9,
})

const bass = Synth({
  wave: 'sawtooth',
  gain: 0.25,
  envelope: { attack: 0.005, decay: 0.15, sustain: 0.5, release: 0.06 },
  filter: { type: 'lowpass', frequency: 600 },
  pattern: bassFreqs,
})

export default Song({ bpm: 128, tracks: [kick, bass] })
```

---

## 4. Fibonacci kick

Kick hits at Fibonacci positions. Hi-hat fills the gaps.

```js
// fibonacci-kick.js
import { Song, Kick, HiHat, Synth } from '@score/dsl'
import { fibonacciRhythm, patternNot } from '@score/math'

const fibPat = fibonacciRhythm(16)

const kick = Kick({
  pattern: fibPat,
  volume: 0.85,
})

const hihat = HiHat({
  pattern: patternNot(fibPat),
  volume: 0.18,
})

const pad = Synth({
  wave: 'triangle',
  gain: 0.12,
  envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.2 },
  pattern: ['A3', 0, 0, 0,  'C4', 0, 0, 0,  'E4', 0, 0, 0,  'G4', 0, 0, 0],
})

export default Song({ bpm: 120, key: 'Am', tracks: [kick, hihat, pad] })
```

---

## 5. Markov melody

Melody driven by a 3-state Markov chain. Musically coherent, different every run (change the seed for a new variation).

```js
// markov-melody.js
import { Song, Kick, Snare, Synth } from '@score/dsl'
import { markov } from '@score/math'

const chain = markov([
  [0.5, 0.4, 0.1],
  [0.3, 0.3, 0.4],
  [0.2, 0.4, 0.4],
], 16, 77)

const noteMap = ['A3', 'C4', 'E4']
const melody  = chain.map(i => noteMap[i] ?? 'A3')

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.85,
})

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.5,
})

const lead = Synth({
  wave: 'sawtooth',
  gain: 0.2,
  envelope: { attack: 0.01, decay: 0.08, sustain: 0.4, release: 0.04 },
  filter: { type: 'bandpass', frequency: 2000, Q: 2.0 },
  pattern: melody,
})

export default Song({ bpm: 126, key: 'Am', tracks: [kick, snare, lead] })
```

---

## 6. Function pattern — bar variation

Instruments that change behavior based on bar number.

```js
// bar-variation.js
import { Song, Kick, HiHat, Synth } from '@score/dsl'

const kick = Kick({
  volume: 0.9,
  pattern: (step, bar) => {
    if (bar % 4 === 3 && step === 12) return 1
    return [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0][step]
  },
})

const hihat = HiHat({
  volume: 0.2,
  pattern: (step, bar) => {
    const base = [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0]
    if (bar % 8 === 7) return base[(step * 2) % 16]
    return base[step]
  },
})

const bass = Synth({
  wave: 'square',
  gain: 0.22,
  envelope: { attack: 0.003, decay: 0.1, sustain: 0.5, release: 0.05 },
  filter: { type: 'lowpass', frequency: 800 },
  pattern: (step, bar) => {
    const lineA = ['A2', 0, 'A2', 0,  0, 'G2', 0, 'E2']
    const lineB = ['E2', 0, 'E2', 0,  0, 'A2', 0, 'G2']
    return (bar % 2 === 0 ? lineA : lineB)[step % 8] ?? 0
  },
})

export default Song({ bpm: 128, key: 'Am', tracks: [kick, hihat, bass] })
```

---

## 7. scaleNotes melody

Melody built from all notes in A minor, reversed every other bar.

```js
// scale-melody.js
import { Song, Kick, Snare, HiHat, Synth } from '@score/dsl'
import { scaleNotes, rev, every } from '@score/pattern'

const scale = scaleNotes('Am', 3, 1)

const kick = Kick({
  pattern: [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.85,
})

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.5,
})

const hihat = HiHat({
  pattern: [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0],
  volume: 0.2,
})

const lead = Synth({
  wave: 'sawtooth',
  gain: 0.18,
  envelope: { attack: 0.008, decay: 0.12, sustain: 0.5, release: 0.06 },
  filter: { type: 'lowpass', frequency: 3000 },
  pattern: every(2, rev, scale),
})

export default Song({ bpm: 124, key: 'Am', tracks: [kick, snare, hihat, lead] })
```

---

## 8. Polyrhythm + effects

3-against-5 polyrhythm. Distortion and delay on the bass.

```js
// polyrhythm.js
import { Song, Kick, Snare, HiHat, Synth } from '@score/dsl'
import { Distortion, Delay } from '@score/effects'
import { euclidean, stack, shift } from '@score/pattern'
import { tile } from '@score/math'

const threes = tile(euclidean(3, 8), 16)
const fives  = tile(euclidean(5, 8), 16)

const kick = Kick({
  pattern: stack(threes, fives),
  volume: 0.85,
})

const snare = Snare({
  pattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
  volume: 0.5,
})

const hihat = HiHat({
  pattern: shift(1, stack(threes, fives)),
  volume: 0.18,
})

const bass = Synth({
  wave: 'sawtooth',
  gain: 0.25,
  envelope: { attack: 0.004, decay: 0.1, sustain: 0.55, release: 0.05 },
  filter: { type: 'lowpass', frequency: 750 },
  pattern: ['A2', 0, 'C3', 0,  'E3', 0, 'G2', 0,  'A2', 0, 'D3', 0,  'E3', 0, 'A2', 0],
  effects: [
    Distortion({ amount: 0.25 }),
    Delay({ time: 0.375, feedback: 0.3, mix: 0.2 }),
  ],
})

export default Song({ bpm: 128, key: 'Am', tracks: [kick, snare, hihat, bass] })
```
