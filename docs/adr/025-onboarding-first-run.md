# ADR 025 — Onboarding and First-Run Experience

**Date:** 2026-03-23
**Status:** Proposed
**Deciders:** Project owner

---

## Context

Testers are not all developers. A musician opening Score Studio for the first time has no frame of reference for AudioContext, sinkId, or eval cycles. Without a first-run experience, they will hear silence, have no idea why, and close the app. The onboarding must bridge the gap between "musician installing a new DAW" and "Score user writing their first track" — without condescending or hiding Score's code-first nature.

---

## Decision

**First-run detection:** absence of `~/.score/config.json`. Score Studio shows a 3-step wizard on first launch only.

**Step 1 — Audio device selection:**
- Dropdown: pick output device (pre-populated from `enumerateDevices()`)
- "Test" button plays a 440 Hz sine tone through the selected device
- Selection writes `audioOutput` to `~/.score/config.json`

**Step 2 — Sample pack:**
- Offers a curated list of free samples (links to freesound.org and looperman)
- No audio files are bundled with Score (ADR rule) — links open in the system browser
- User may skip; a notice explains that Score generates synthesis without samples

**Step 3 — Open or create:**
- "Open tutorial song" — loads `examples/tutorial.ts` from the Score install directory
- "New song" — creates a new blank project directory (ADR 016)
- "Skip" — opens Score Studio with no project

**Tutorial song** (`examples/tutorial.ts`): a simple 4-bar techno loop. Every line is commented, explaining the DSL concept it demonstrates. The tutorial is a real song, not a mock — it plays and sounds correct.

**CLI:** `score doctor` doubles as first-run setup. If `~/.score/config.json` is absent or incomplete, it prompts interactively for audio device selection before running diagnostics.

**Re-triggering:** the wizard does not appear on subsequent launches. Settings > Reset Onboarding restores it.

---

## Consequences

**Positive:**
- Musician testers hear sound within 60 seconds of installing
- Audio device is configured correctly before the first eval — no silent confusion
- Tutorial song teaches DSL idioms without a separate documentation step
- `score doctor` first-run path means CLI users also get guided setup

**Negative:**
- Wizard adds UI surface that must be maintained as the DSL evolves — tutorial song requires updates on breaking DSL changes
- Sample pack step is a link-out, not a one-click install — slightly disjointed UX
- Wizard state (`~/.score/config.json` presence) is a side-channel detection — a misconfigured install could suppress the wizard unexpectedly

---

## Alternatives Considered

- **No onboarding — docs only** — link to a README. Rejected: musicians do not read readmes before opening an app.
- **Bundled sample pack** — include 50 MB of starter samples. Rejected: violates the no-bundled-audio rule; increases installer size significantly.
- **Video tutorial instead of wizard** — embed a walkthrough video. Rejected: video goes stale with every DSL change; the tutorial song is self-maintaining.
