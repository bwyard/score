# ADR 007 — Hot-Swap at Bar Boundary

**Status:** Accepted
**Date:** 2026-03-22

## Context

Live coding requires applying code changes without audio gaps or restarts. Song files are re-evaluated as the artist edits them. The evaluation of a new Song takes non-zero time (compile, validate, instantiate), and the new Song's audio graph may briefly produce silence or artifacts if swapped mid-bar.

A naive approach — swap immediately on eval — would cause clicks, pops, or dropped beats at arbitrary points in the bar.

## Decision

Code changes are **queued as "pending"** and applied atomically at the next bar boundary:

1. The artist saves a modified song file; the engine re-evaluates it in the background
2. The engine continues playing the current Song while the new one is compiled and validated
3. On bar 0 of the next bar, the engine swaps atomically: old tracks ramp their gain to 0, new tracks initialize at gain 0 then ramp up
4. The IPC channel `engine:pending` signals the UI that a swap is queued

## Consequences

- No audio gap or click on code eval — the swap point is always a clean bar boundary
- Errors in new code (compile errors, validation failures) leave the current Song playing unchanged
- The UI shows an amber "swap queued" badge when `engine:pending` is received; the badge clears after the swap completes
- All instruments must implement the **zero-gain onset invariant**: every instrument must accept being initialized at gain 0 and ramped up smoothly — no instrument may emit a click at onset
- Hot-swap latency is at most one bar (worst case: change lands immediately after a bar boundary)

## Alternatives Considered

- **Immediate swap on eval** (rejected) — causes clicks and dropped beats at arbitrary mid-bar positions
- **Crossfade over multiple bars** (deferred) — smoother transitions but adds complexity; bar-boundary swap is sufficient for v1
- **Restart playback from bar 0** (rejected) — breaks the live performance; audience hears a reset
