# Score — Synthesis Spec: Techno, TB-303 Acid Bass, Deep House

> Research-derived spec for pure-math instrument synthesis (no samples).
> Informs Score component roadmap Phases 2–5.

---

## Genre Instrument Inventory

### Techno (Detroit / Berlin)

| Sound | Method | Origin |
|---|---|---|
| Kick drum | Pitched sine + pitch envelope + noise click | TR-909 |
| Snare | Two triangle oscillators + white noise + HPF | TR-909 |
| Clap | Burst-gated white noise, 3–4 layers, 10–20ms apart | TR-909 |
| Closed hihat | 6 detuned square oscillators + bandpass + HPF | TR-808/909 |
| Open hihat | Same as closed, longer decay | TR-808/909 |
| Bass/lead | 2-op FM (carrier + modulator) | DX100 / DX7 |
| Pad/chord | Detuned saws + resonant lowpass + chorus | Juno-106 |
| Stab | Short-decay saw chord through resonant filter | Juno / Jupiter |

### Deep House (Chicago 80s — Larry Heard / Mr. Fingers)

| Sound | Method | Origin |
|---|---|---|
| Kick drum | Pure sine + longer pitch envelope | TR-808 |
| Hihat | 6-oscillator or white noise + HPF | TR-808 |
| Rimshot/clap | Noise burst + bandpass | TR-808 |
| Bass | Filtered sawtooth, slow attack | Juno-106 / Jupiter-8 |
| Rhodes pad | 2-op FM (DX7 E PIANO 1 algorithm) | Yamaha DX7 |
| Juno chord pad | Detuned saws + filter + chorus (heavier than techno) | Juno-106 |
| Sub bass | Pure sine wave | Any analog |
| Organ stab | Additive (harmonics of saw) | Hammond via Korg M1 |

### TB-303 Acid Bass

Signal chain:
```
Oscillator (saw or square)
  → WaveShaper (pre-filter saturation, tanh drive 0.2–0.4)  ← critical
  → Lowpass filter (18dB/oct ladder approx, Q 0–25)
       ↑ MEG envelope (attack 2ms fixed, decay 200–2000ms)
  → VCA (separate envelope from filter)
  → WaveShaper (post-filter soft-clip, very mild)
  → output
```

Five defining characteristics:
1. **Pre-filter saturation** — overdrives before the filter, creates squelch
2. **Filter envelope (MEG)** — fast attack (~2ms), variable decay, exponential cutoff sweep
3. **Accent** — boosts VCA +6dB, forces MEG decay to minimum (200ms), raises cutoff peak
4. **Slide** — pitch glides to next note in ~60ms; envelopes do NOT retrigger
5. **Diode ladder filter** — nonlinear, dirty resonance (Web Audio BiquadFilterNode is an approximation; AudioWorklet needed for full accuracy)

---

## Parameter Quick Reference

### TR-808 Kick
- Start freq: 55–80 Hz | End: 40–50 Hz | Pitch fall: 100–200ms | Amp decay: 600–800ms
- Pure sine, no noise click. Tune to track root note or fifth.

### TR-909 Kick
- Start freq: 150–200 Hz | End: 50–60 Hz | Pitch fall: 50–100ms | Amp decay: 400–700ms
- Add noise click at -12dB rel, decay 20–50ms.

### TR-909 Snare
- Osc A: 180 Hz | Osc B: 330 Hz | Noise HPF: 1800–2750 Hz
- Tone decay: 150–300ms | Noise decay: 200–400ms | Ratio: 40% tone / 60% noise

### TR-808 Hihat
- 6× square oscillators: ~205, 285, 365, 450, 535, 620 Hz
- Bandpass: 8–10 kHz | HPF: 7 kHz
- Closed decay: 40–80ms | Open decay: 200–500ms

### TB-303
- Filter cutoff base: 100–800 Hz | Env mod depth: 0–4 octaves | MEG attack: 2ms (fixed)
- MEG decay: 200–2000ms | Accent boost: +6dB VCA, forced 200ms decay | Slide glide: ~60ms

### DX7 Rhodes (FM)
- Carrier: sine at noteFreq | Modulator: sine at noteFreq × 1.273
- Index at attack: 3–6 | Index at sustain: 0.5–1.5 | Index decay: 300ms
- Amp ADSR: A=5ms, D=variable, S=0.6, R=400ms
- Delayed vibrato: onset 1–2s, ±5–10 Hz rate, 4–5 Hz

### Juno-106 Pad
- 2–6× sawtooth, ±5–15 cents detune | Sub: square at ÷2
- Filter: lowpass 800–3000 Hz | Q: 0.3–2.5
- Chorus: rate 0.1–0.5 Hz, depth 5–15ms | Reverb mix: 20–60%

---

## Reverb + Delay Characteristics by Genre

### Techno
- Kick: long dark reverb (2–4s), sidechained against kick (pumping space)
- Snare: medium room (0.8–1.5s), HPF send at 300–400 Hz
- Pads: large hall (3–6s), 20–40% mix
- Delay: dotted-eighth on leads (time = 60/BPM × 0.75s), feedback 25–40%

### Deep House
- Style: **plate reverb** (smooth, dense, bright) — not hall
- Decay: 1.5–3s on pads and Rhodes
- **Pre-delay: 20–40ms** — separates dry source from reverb tail ← missing from createReverb
- Mix: Rhodes 25–40%, Juno pad 40–60%, kick 0–10%
- Delay: slapback 80–150ms on Rhodes, or dotted-eighth at 10–15% on chords

---

## Gap Analysis — Missing Score Primitives

### Instruments (none exist yet)

| Component | Genre | Priority |
|---|---|---|
| `createKick808` | Deep house, techno | High — Phase 2 |
| `createKick909` | Techno | High — Phase 2 |
| `createSnare909` | Techno | High — Phase 2 |
| `createHihat808` | Techno, deep house | High — Phase 2 |
| `createClap909` | Techno | Medium — Phase 2 |
| `createCowbell808` | Techno | Low |
| `createBass303` | Acid techno | High — Phase 3 |
| `createFMSynth` | Rhodes, techno lead | High — Phase 3 |
| `createSubtractiveSynth` | Juno pad, bass | High — Phase 2 |

### Effect Gaps

| Missing | Affects | Notes |
|---|---|---|
| Pre-delay on `createReverb` | Deep house | Add `preDelay?: number` prop |
| Ladder filter (AudioWorklet) | 303 accuracy | Not fakeable at high Q with BiquadFilterNode |
| Reverb color/brightness | Genre differentiation | Plate vs hall |

### Modulation Gaps

| Missing | Affects | Notes |
|---|---|---|
| Clean FM routing factory | All FM | `_connectTo` exists — needs factory in `@score/components` |
| Delayed LFO onset | Rhodes vibrato | Add `delayOnset?: number` to LFOProps |
| Portamento/slide state | 303 | `slide: boolean` prop, inter-note state threading |
| Modulation index envelope | FM piano | ADSR on modulation depth, not just amplitude |

---

## Implementation Phases

### Phase 2 — First Instrument Pass
1. `createKick808` — pitched-sine + pitch-envelope pattern
2. `createKick909` — extends kick with noise click
3. `createHihat808` — 6-oscillator metallic cymbal
4. `createSnare909` — 2 oscillators + noise
5. `createSubtractiveSynth` — general saw/square + filter + ADSR

### Phase 3 — FM + Complex Synthesis
6. `createFMSynth` — 2-op FM, covers Rhodes + techno leads
7. `createBass303` — wraps SubtractiveSynth with MEG/VEG/accent/slide

### Phase 4 — Effect Upgrades
8. Pre-delay on `createReverb`
9. Delayed onset on `createLFO`
10. Modulation index ADSR on `createFMSynth`

### Phase 5+ — Advanced Accuracy
11. `createLadderFilter` — AudioWorklet nonlinear ladder for authentic 303/Moog emulation
