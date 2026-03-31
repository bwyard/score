## Session & Todo System

Shared session state and todos live in `../claude-resources/` (one level up).

- Session file: `../claude-resources/sessions/score/current.md`
- Session history: `../claude-resources/sessions/score/s000-s009/` etc.
- Todo CLI: `node ../claude-resources/todos/todo.js list --project score`
- Dashboard: `node ../claude-resources/todos/todo.js dashboard`
- Nav hub: `../claude-resources/CLAUDE.md`

Read `current.md` at the start of every session. Update it and write a closed session log at the end.

---

# Score — EDM Audio Framework

> **Name locked:** Score. npm scope `@score/*`. Repo `bwyard/score`.
> GUI name (e.g. Score Studio) to be decided at Phase 13.

This file is the authoritative project briefing. Read it fully before touching any file.
Full architecture spec: `SCORE_HANDOFF.md`

## Core Philosophy

**Math reads as music.** Frequencies, rhythms, harmonics, envelopes — a song is a pure function of time.

Describe music with functions, not data. No sample banks, no hardcoded patterns — generate everything at evaluation time. Pure functional throughout: same inputs, same outputs, no side effects, no state. TypeScript ESM strict mode, no `any`.

This is what makes SCORE a reference implementation rather than just another audio library.

**Probabilistic / diffusion direction (roadmap):** Granular synthesis via probabilistic grain scattering, spectral diffusion, stochastic resonance, generative composition. The chaos math already in `@score/math` (Lorenz, logistic map, OUProcess) is the foundation — this capability is planned, not immediate.

## Quick Reference

- **Runtime:** Node 20 LTS minimum. Song files run as plain ESM, never compiled.
- **Package manager:** pnpm
- **Monorepo:** Turborepo
- **Audio:** Web Audio API + node-web-audio-api (Node polyfill) + `@score/sequencer` (Transport / Clock)
- **Testing:** Vitest — coverage thresholds enforced in CI (90/85/90/90)
- **CI:** typecheck → lint → test → coverage. No merge if CI fails.

## Code Style — Modern Functional

**Everything is functional.** Framework and song files share the same style.

- **Factory functions, not classes** — `createMixer(props)` returns a plain object, not `new Mixer()`
- **Props and state** — components receive props (config) and manage state like React components
- **Composition over inheritance** — combine small functions, don't extend base classes
- **Immutable by default** — config objects are never mutated; produce new state instead
- **Pure functions where possible** — predictable inputs/outputs, no hidden side effects
- **`const` + arrow functions** — no `let`, no `function` declarations, no classes
- **No exceptions** — `ScoreError` is a factory function, not a class
- **Minimize comments** — code is self-documenting through descriptive names. Keep: TSDoc on public exports, BOUNDARY annotations, section dividers, genuinely non-obvious WHY. Remove everything else.

The song language should feel like writing Svelte — declarative, component-based, props in, music out:

```js
const kick = Kick({ sample: './samples/kick.wav', pattern: [1, 0, 0, 0], volume: 0.9 })
const bass = Synth({ wave: 'sawtooth', filter: { type: 'lowpass', frequency: 800 } })
export default Song({ bpm: 140, tracks: [kick, bass] })
```

## Non-Negotiable Rules

1. Song files are **never compiled** — run directly as ES modules
2. Web Audio API is **never exposed** to song authors — fully abstracted
3. **ScoreError** is the only error factory — never throw raw `Error`
4. Tests and error handling **ship with the component** — never backfilled
5. **No AI** generates music, patterns, or full songs — ever. AI may generate **base instrument descriptors** (single timbre, single note, no patterns, no arrangements) as starting points for human live coding.
6. **No audio files bundled** — `samples/` is gitignored except `.gitkeep` and `README.md`
7. GUI is built **last** (Phase 13)
8. Every component implements the `AudioComponent` interface (as a plain object shape, not a class)
9. Audio scheduling always uses `audioContext.currentTime` — never `setTimeout` or `Date.now()`
10. **All code is functional** — factory functions, `const`, arrow functions, zero classes
11. **Every public export gets TSDoc** — `/** */` block with `@param`, `@returns`, `@example`, `@throws {ScoreError}`. Standard in `docs/spec/TSDOC_STANDARD.md`. No undocumented public exports.
12. **Accessibility ships with the component** — every new GUI component must meet the checklist below before merging. Never backfilled. WCAG 2.1 AA is the target.

## Accessibility — Required for Every New GUI Component

Score Studio targets WCAG 2.1 AA. Accessibility is **non-negotiable** — it ships with the component, not as a follow-up.

### Checklist (must pass before PR merges)

**ARIA — every interactive element must have:**
- `aria-label` or visible label associated via `aria-labelledby`
- `role` attribute if the element is not a native HTML element (e.g. `<div role="button">`)
- `aria-pressed` on toggle buttons (play/stop, mute, step cells)
- `aria-live="polite"` on regions that update dynamically (console, status)
- `aria-describedby` on complex widgets explaining their semantics

**Keyboard — every interactive element must support:**
- `Tab` / `Shift+Tab` to reach the element (do not suppress focus)
- `Enter` or `Space` to activate buttons and toggles
- `Escape` to close dialogs, panels, and pickers
- `Arrow keys` on grids and sliders
- Draggable panels: `Arrow keys` to move, `Shift+Arrow` to resize

**Focus management — every modal/dialog must:**
- Trap focus on open — Tab cycles only within the dialog
- Set initial focus to the first interactive element or the dialog heading
- Return focus to the trigger element on close

**Tests — every new component test must include:**
```ts
import { axe } from '../setup.js'
it('has no axe violations', async () => {
  const { container } = render(<MyComponent />)
  expect(await axe(container)).toHaveNoViolations()
})
```

**Canvas elements must have:**
- `role="img"` + `aria-label` describing what is shown
- `aria-describedby` linking to a hidden element with full semantics

### What "accessibility ships with the component" means in practice

When writing a new component:
1. Use `<button>` not `<div onClick>` — native elements give keyboard and ARIA for free
2. If you must use a `<div>`, add `role`, `tabIndex={0}`, `onKeyDown` with Enter+Space handling
3. Add `aria-label` to every button — never rely on icon-only labels
4. Write the axe test before opening the PR

### What is already covered

`vitest-axe` is configured in `packages/gui/tests/setup.ts` — `axe` is exported and ready.
All existing components have ARIA roles and labels. Gaps are tracked as t355–t364 in `docs/ROADMAP.md`.

---

## Target Genres — Full EDM Library

Score aims to cover every major electronic genre. Each genre has specific synthesis requirements that drive the instrument roadmap.

### Completed / In Progress
| Genre | Key Instruments | Status |
|---|---|---|
| Techno | Kick909, Snare909, Hihat808, acid bass | Drums done, Bass303 pending |
| Deep House | Kick808, Hihat808, Rhodes pad, sub bass | Drums done, FM Rhodes pending |
| Acid House | Bass303 (303 squelch) | t166 — pending |
| Detroit Techno | Kick808, Kick909, FM leads | Drums done |
| Chicago House | Kick909, piano, organ | Drums done |

### Planned — Synthesis Required
| Genre | Key Synthesis Gap | Priority |
|---|---|---|
| Trance / Progressive | Supersaw (detuned saw stack), arpeggiator | Phase 12d-1 |
| Hardstyle | Reverse-bass kick (pitch sweeps UP then drops), distortion on body | New — createKickHardstyle |
| Hardcore / Gabber | Heavily distorted/clipped kick, ~160–200 BPM | New — createKickHardcore |
| Drum & Bass / Jungle | Reese bass (detuned saws), Amen-style breaks, heavy sub | Phase 12d-2 |
| Dubstep / Brostep | Wobble bass (LFO on filter), half-time feel | LFO wiring |
| Neurofunk | Complex FM bass, resampled textures | FM + granular |
| Ambient / Dark Ambient | Long pads, drone, granular textures, convolution reverb | Phase 12d-4 |
| IDM / Glitch | Granular, bitcrush, complex polyrhythm, stutter edits | Phase 12d-4 |
| Synthwave / Retrowave | Supersaw leads, gated reverb drums, arpeggios | Phase 12d-1 |
| UK Garage / Speed Garage | Shuffled 2-step, pitched vocal chops, sub bass | Sequencer + sampler |
| Grime | Reese bass, dark pads, MC-ready tempo (140 BPM) | Bass work |
| Future Bass | Chords + supersaw stab, wobble, 808 sub | Supersaw + 808 |
| Trap (EDM) | 808 sub bass, hi-hat rolls (16th/32nd), snare | 808 done |
| Lo-fi Hip Hop | Dusty samples, vinyl noise, lazy swing | Sampler + swing |
| Electro / Miami Bass | 808 cowbell, clap, robotic voice | Cowbell/clap pending |
| Footwork / Juke | 160 BPM, rapid percussion patterns, vocal chops | Sampler + pattern |
| Psytrance | Driving bass (squelchy FM), fast 145 BPM | FM bass |
| Minimal Techno | Sparse clicks/cuts, subtle acid | Pattern + 303 |
| Big Room House | Supersaw leads, festival drops, huge reverb | Supersaw |
| Afrotech | African percussion + techno grid | Percussion library |
| Breaks / Breakbeat | Breakbeat sampler, pitched break | Sampler |

### Synthesis Building Blocks Needed (drives Phase 12d roadmap)
- **Supersaw** — N detuned oscillators (Trance, Big Room, Synthwave, Future Bass)
- **Reese bass** — 2 detuned saws with sub, classic D&B (Phase 12d SubSynth extension)
- **Wobble bass** — LFO on filter cutoff, rate-synced to BPM (Dubstep)
- **Reverse kick** — pitch sweeps UP to peak then falls (Hardstyle) — createKickHardstyle
- **Distorted kick** — waveshaper on sine body (Hardcore/Gabber) — createKickHardcore
- **Granular engine** — Phase 12d-4 (Ambient, IDM, Glitch)
- **Convolution reverb** — Phase 12g (large spaces, gated reverb)
- **808 sub** — already done (createKick808 doubles as sub bass)
- **Cowbell808 / Clap909** — t204 in progress

---

## Git Workflow

- **`main`** — production. Protected: PRs only, enforced on admins.
- **`dev`** — development. Protected: PRs only, enforced on admins.
- **Feature branches** — all work happens here. Branch off `dev`, PR into `dev`.
- `dev` → `main` via PR for releases.
- **No direct commits** to `main` or `dev` — ever.

## Current Phase

**Phase 13 — Score Studio GUI** (in progress)
See `SCORE_HANDOFF.md` for the full 17-phase build plan.

## Documentation Index

All strategy docs, ADRs, and standards are indexed at **`docs/INDEX.md`** — read it at the start of every session.

Key docs:
- `docs/THESIS_COMPLIANCE.md` — what pure functional means per layer
- `docs/TESTING_STRATEGY.md` — per-package testing approach and standards
- `docs/DEVELOPMENT_STRATEGY.md` — phase ownership, what ships now vs deferred

## Start-of-Session Checklist

1. Read session file: `../claude-resources/sessions/score/current.md`
2. Check signals: `node ../claude-resources/session.js signals`
3. Read `docs/INDEX.md` — find the doc you need
4. Run `pnpm turbo build --filter='!@score/gui'` — rebuild all library packages in dependency order (keeps dist/ in sync after pulls/merges). Excludes the Electron app — run `pnpm dev` separately for GUI work.
5. Run `pnpm test` — confirm all tests passing
6. Check current phase in `SCORE_HANDOFF.md`

> **Why turbo build:** Packages like `@score/sequencer` and `@score/visuals` resolve via `dist/`. If a PR added new exports and you haven't rebuilt, imports fail at runtime even though source is correct. Turbo is cached — only rebuilds what changed, so this is fast.
