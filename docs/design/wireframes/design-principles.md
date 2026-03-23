# Score Studio — Design Principles

These principles govern the visual and interaction design of all four Score Studio modes:
Live Code, DJ Set, Jam Session, and Produce. They are not aspirational — they are
constraints. Every screen decision should be traceable to one of these.

---

## 1. Code as Source of Truth

The song or set is always a `.ts` file. It is reproducible, version-controlled, and
human-readable. There is no hidden state that lives only in the UI.

- Opening a `.ts` file and pressing Play produces exactly what was produced last time.
- Saving a session saves the code, not a snapshot of audio state.
- If a set requires audio files (sample decks), those paths are declared in the code.
- The file is the performance artifact. The audio output is a consequence of running it.

---

## 2. Unified Performance Model

Live Code, DJ Set, Jam Session, and Produce are all expressions of the same Song engine.
There are no hard walls between modes. The engine does not know which mode is active.

- A song running in Live Code and a Code Deck running in DJ Set use identical runtime.
- Hot-swap (Ctrl+Enter at bar boundary) works the same in both modes.
- Switching modes does not restart the engine or reset audio state.
- Shared components (TransportBar, visualizers, Monaco editor) appear in all modes that
  need them — they are not reimplemented per mode.

---

## 3. Deck-as-Song

In DJ Set, a deck can be a running Song (live-coded, pure math synthesis) or a sample
(audio file player). Both are equal citizens in the signal chain.

- Both deck types output to a GainNode. The crossfader has no knowledge of which type
  is on each side.
- A Code Deck is a Song engine running in a lane — same hot-swap, same visualizers,
  same eval model.
- A full DJ set with two Code Decks requires zero audio files and is fully reproducible
  from the `.ts` set file alone.
- The deck type toggle (Code / Sample) is a first-class UI element, not a hidden setting.

---

## 4. Code IS the Show

Screen projection of the Monaco editor and visualizers is the performance aesthetic.
This is algorave style. The visuals are not supplementary — they are part of the art.

- The editor and visualizers must be projection-legible: high contrast, large fonts,
  clear real-time motion.
- The default layout for Live Code and DJ Set Code Decks puts the editor prominently,
  not tucked in a corner.
- Animations in the visualizers (step cursor, waveform, spectrum bars) are continuous
  and responsive — never static or batched at a slow frame rate.
- Artists should be able to go full-screen on the visualizer or editor column
  independently for projection.

---

## 5. Hot-Swap is the Interaction Model

Ctrl+Enter at bar boundary. No restarts, no gaps. The music never stops.

- Applying a code change does not restart the audio context or reset the transport.
- Changes are queued and applied on the next bar boundary (TidalCycles-style).
- The REPL log confirms when a change was accepted and when it took effect.
- Error in new code: the previous version keeps running. The error is surfaced in the
  REPL log but does not interrupt playback.
- This applies to Live Code mode and Code Decks in DJ Set equally.

---

## 6. Math over Samples Where Possible

Generate from functions first, load files second.

- Live Code and Jam Session are synthesis-first. No sample loading in the primary flow.
- Produce and DJ Set (Sample Deck) support samples, but they are opt-in, not default.
- The song language encourages function-based instrument descriptors:
  `Synth({ wave: 'sawtooth' })` not `Sample({ file: './synth.wav' })`.
- This is both a philosophical stance (code as source of truth) and a practical one:
  no audio files bundled, no gitignored asset sprawl in pure-code projects.

---

## 7. Backend Agnostic

Web Audio today, SuperCollider in Phase 12c. The artist's code never changes when the
backend swaps.

- Song files and set files import from `@score/*` packages only. No Web Audio API
  surfaces exposed to song authors.
- The `AudioComponent` interface is the contract. Backends implement it; songs consume it.
- UI visualizers read from the Score engine abstraction layer, not directly from
  `AnalyserNode` or equivalent backend primitives.
- When a backend is swapped, the only thing that changes is the Score internals.
  Every existing `.ts` song file continues to run without modification.

---

## Application to Screens

| Principle | Live Code | DJ Set | Jam Session | Produce |
|---|---|---|---|---|
| Code as source of truth | Song file | Set file (`.ts`) | Session file | Project file |
| Unified engine | Primary | Code Deck shares engine | Shared engine | Shared engine |
| Deck-as-Song | N/A (single Song) | Code Deck + Sample Deck | N/A | N/A |
| Code IS the show | Editor + visualizers front and centre | Editor visible in Code Deck | Performance panel | Less prominent |
| Hot-swap | Ctrl+Enter, bar boundary | Ctrl+Enter on active Code Deck | Live param changes | Offline edit |
| Math over samples | Synthesis-first | Sample Deck is opt-in | Synthesis-first | Both equally valid |
| Backend agnostic | Always | Always | Always | Always |
