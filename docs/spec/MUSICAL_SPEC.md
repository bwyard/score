# @score/musical — Plain Language DSL Spec (Phase 9d)

`describe()` translates plain English descriptions of musical decisions
into Score component props. No AI. No generation. Just a vocabulary lookup table.

---

## Design Goal

Any musician can write Score on day one — even without a programming background.

```js
// Developer syntax — explicit component model
const kick = Kick({
  pattern:   [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
  sidechain: true,
  volume:    0.9,
})

// Musician syntax — plain language
const kick = describe('deep kick hits every beat pumps hard loud')
```

**Same audio. Different surface.** Both are permanent. The choice is the artist's.

---

## The `describe()` Function

Tokenises the string and matches phrases to component props via vocabulary tables.
No AI involved — purely a lookup table and phrase matcher.

### Vocabulary

```
Phrase                        Maps to
──────────────────────────    ────────────────────────────────────
"deep kick"                → Kick({ synth: { frequency: 58, pitchDrop: 0.06 } })
"punchy kick"              → Kick({ synth: { frequency: 80, pitchDrop: 0.03 } })
"tight kick"               → Kick({ synth: { frequency: 100, pitchDrop: 0.02 } })
"hits every beat"          → pattern: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
"hits on 2 and 4"          → pattern: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]
"straight eighths"         → pattern: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]
"triplet feel"             → swing: 0.67
"pumps hard"               → sidechain: true, compression: { ratio: 6 }
"pumps gently"             → sidechain: true, compression: { ratio: 2 }
"sits far back in reverb"  → reverb: 0.75
"sits in reverb"           → reverb: 0.45
"sits in reverb slightly"  → reverb: 0.25
"dry"                      → reverb: 0, delay: 0
"loud"                     → volume: 0.85
"quiet"                    → volume: 0.45
"whisper"                  → volume: 0.2
"gritty"                   → distortion: 0.2
"overdriven"               → distortion: 0.5
"warm fm bass"             → FM({ modRatio: 1, modIndex: 3 })
"soft string pad"          → PhysicalString({ coef: 0.3, decay: 4 })
"filter wanders slowly"    → filter: { frequency: OUProcess({ theta: 0.01, sigma: 0.05 }) }
```

---

## Arrangement in Plain Language

```js
const arrangement = song`
  intro 8 bars
    just hihat

  drop 32 bars
    full kit
    bass and pad
    kick pumps hard

  breakdown 16 bars
    strip to sax and pad
    let it breathe
`
```

Produces identical output to the explicit `Song({ arrangement: [...] })` format.

---

## What `describe()` Does NOT Do

- Does not generate musical decisions
- Does not choose patterns, notes, or arrangements on behalf of the artist
- Does not use AI — ever, under any circumstances
- Only translates descriptions of decisions the artist has *already made*

All creative decisions are always the artist's.

---

## Learning Path This Creates

```
Week 1  — artist writes: describe('deep kick hits every beat pumps hard')
          Score Studio shows the code equivalent in the side panel
          Artist sees: pattern: [1,0,0,0,1,0,0,0]

Week 4  — artist starts writing pattern arrays directly

Week 8  — artist discovers euclidean(3, 8) and @score/pattern
          starts exploring functional transformations
          learning through music
```

---

## Package Structure

```
@score/musical
└── src/
    ├── vocabulary/
    │   ├── sounds.ts        ← instrument character descriptors
    │   ├── patterns.ts      ← rhythm plain language
    │   ├── feel.ts          ← sidechain, humanize, distortion
    │   ├── space.ts         ← reverb/delay descriptions
    │   ├── volume.ts        ← loud/quiet/whisper
    │   └── arrangement.ts   ← intro/drop/breakdown words
    ├── parser.ts            ← tokenizer + component builder
    ├── describe.ts          ← describe() exported function
    └── index.ts
```

---

## Test Strategy

~25 tests:
- Each vocabulary phrase maps to expected props
- Unknown phrases produce ScoreError with suggestion
- Ambiguous phrases default to most common interpretation
- Combination phrases compose correctly
- Output of `describe()` === output of equivalent explicit code
