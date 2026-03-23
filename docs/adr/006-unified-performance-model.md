# ADR 006 — Unified Performance Model: Songs and Samples as Equal Deck Sources

**Status:** Accepted
**Date:** 2026-03-22

## Context

Score has four performance modes: Live Code, Produce, DJ Set, and Jam Session. The architectural question is how these modes relate to audio sources.

DJ Set mode requires two "decks" that can be crossfaded. The naive approach treats decks as audio file players only. But Score's live-coding capability means a running Song engine — pure synthesis, no samples — is also a valid performance source. The question is whether to treat these as fundamentally different deck types or to unify them.

## Decision

A deck in DJ Set mode can be either:
- A running **Song engine** (live-coded, pure synthesis, version-controlled `.ts` file), or
- A **sample/audio file player** (loaded audio buffer or stream)

Both are treated as equal audio signals in the Web Audio graph. Each deck feeds a `GainNode`; the crossfader adjusts the two `GainNode` gain values. Live-coded songs are version-controlled `.ts` files and can constitute a complete DJ set.

Code and samples are both first-class performance materials.

## Consequences

- DJ mode must accept `Song` as a deck source, not just audio files
- Live Code and DJ Set modes share the engine abstraction — the same `ScoreEngine` that runs a live session can be loaded into a DJ deck
- A performance can be purely code (both decks are live Song engines), purely samples (both decks are audio players), or mixed
- The crossfader implementation only needs to know about gain levels — deck source type is irrelevant to the fade logic
- DJ set recordings can be replayed exactly by re-running the song files — no audio export required for version control

## Alternatives Considered

- **Samples-only DJ mode** (rejected) — excludes live-coded performances and treats modes as isolated silos
- **Separate engine types for code vs. sample decks** (rejected) — duplicates crossfader and gain logic, breaks the "equal signals" invariant
