# Harpsichord in Score

Score doesn't have a dedicated `Harpsichord` component yet.
You build one using `Synth` — the settings below match how a harpsichord actually works physically.

---

## How a harpsichord works (and why these settings)

A harpsichord **plucks** its strings with a quill (plectrum). Unlike a piano, which hammers the string and can be played loud or soft, the harpsichord always plucks at the same volume. The key characteristics are:

| What | Why it sounds that way |
|------|------------------------|
| **Instant attack** | The quill snaps past the string — there's no gradual bow or hammer bloom |
| **Zero sustain** | After the pluck, the string rings freely but there's no energy being added — volume drops immediately |
| **Short-to-medium release** | The damper falls when you release the key — cuts the string's ring cleanly |
| **Bright, nasal tone** | The plucked string produces strong high harmonics. A bandpass or highpass filter captures this. |
| **Sawtooth or square wave** | Sawtooth has the most harmonics and most closely matches a plucked string's frequency content |

---

## Basic harpsichord patch

```js
import { Synth } from '@score/dsl'

const harpsichord = Synth({
  wave:  'sawtooth',
  gain:  0.25,

  // Harpsichord ADSR — pluck with immediate decay, no sustain
  envelope: {
    attack:  0.001,  // nearly instant — quill snaps the string
    decay:   0.35,   // string rings down over ~350ms
    sustain: 0.0,    // no sustain — string is plucking, not bowing
    release: 0.15,   // damper falls when key released
  },

  // Bandpass filter — captures the nasal, plucked character
  filter: {
    type:      'bandpass',
    frequency: 1400,   // center of the harpsichord's characteristic brightness
    Q:         1.2,    // mild resonance — adds slight "twang"
  },

  // Melody — harpsichord range is roughly C2 to C7
  pattern: ['E4', 0, 'D4', 0,  'C4', 0, 'B3', 0,  'A3', 0, 'G3', 0,  'A3', 0, 0, 0],
})
```

---

## Variations

### Brighter / more plucky

Shorter decay, higher filter frequency — sounds like a lighter-strung instrument or a smaller register.

```js
envelope: { attack: 0.001, decay: 0.2, sustain: 0.0, release: 0.08 },
filter:   { type: 'bandpass', frequency: 2200, Q: 1.5 },
```

### Warmer / lute-like

Longer decay, lower filter frequency, lower Q — sounds like a lute or theorbo (ancestor of harpsichord).

```js
envelope: { attack: 0.003, decay: 0.6, sustain: 0.0, release: 0.25 },
filter:   { type: 'lowpass', frequency: 900, Q: 0.8 },
```

### Clavichord (softer, more intimate)

Triangle wave, gentler filter — the clavichord tangents the string rather than plucking it.

```js
wave:     'triangle',
envelope: { attack: 0.005, decay: 0.4, sustain: 0.05, release: 0.2 },
filter:   { type: 'lowpass', frequency: 1100, Q: 0.7 },
```

---

## Common harpsichord patterns

Harpsichord is frequently used for baroque-style arpeggios and basso continuo lines.

```js
import { Synth } from '@score/dsl'

// Arpeggiated chord — Am triad, one note per 16th
const harpsichord = Synth({
  wave: 'sawtooth',
  gain: 0.2,
  envelope: { attack: 0.001, decay: 0.3, sustain: 0.0, release: 0.12 },
  filter:   { type: 'bandpass', frequency: 1400, Q: 1.2 },

  // A minor arpeggio up and back down
  pattern: ['A3', 'C4', 'E4', 'A4',  'E4', 'C4', 'A3', 0,
            'G3', 'B3', 'D4', 'G4',  'D4', 'B3', 'G3', 0],
})
```

### Using chordNotes for arpeggios

```js
import { Synth } from '@score/dsl'
import { chordNotes } from '@score/pattern'

// chordNotes returns ['A3', 'C4', 'E4'] for Am at octave 3
const [root, third, fifth] = chordNotes('Am', 3)

const harpsichord = Synth({
  wave: 'sawtooth',
  gain: 0.2,
  envelope: { attack: 0.001, decay: 0.3, sustain: 0.0, release: 0.12 },
  filter:   { type: 'bandpass', frequency: 1400, Q: 1.2 },

  pattern: [root, 0, third, 0,  fifth, 0, third, 0,
            root, 0, third, 0,  fifth, 0, 0, 0],
})
```

---

## Note range reference

Harpsichords typically span 4–5 octaves. The "sweet spot" for the characteristic sound:

| Octave | Character | Notes |
|--------|-----------|-------|
| 2 | Deep bass, resonant | Used for bass lines |
| 3 | Warm, full | Primary bass/mid range |
| 4 | Clear, bright | Primary melody range |
| 5 | Bright, cutting | Upper voice, ornaments |
| 6 | Very bright | Occasional high ornaments only |

---

## Planned: dedicated Harpsichord component

A future `Harpsichord` component is planned as part of the `@score/instruments` package.
It will include:
- Physical model of string pluck with spectral shaping
- Multiple 8' and 4' register simulation (same note, different octave voices)
- Lute stop (padded timbre)

Until then, the `Synth` patch above is the correct way to get a harpsichord sound.
