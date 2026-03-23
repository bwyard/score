# ADR 010 — Synthesis Backend Abstraction: Components Use Only `@score/core` Primitives

**Status:** Accepted
**Date:** 2026-03-22

## Context

The current audio backend is Web Audio API, abstracted through `BackendNode` types in `@score/core` (ADR 002). A SuperCollider backend is planned for Phase 12c, and other backends (WASM synthesis, VST bridge) may follow.

Without an explicit rule, instrument components in `@score/components` could gradually accumulate direct Web Audio calls — `OscillatorNode`, `BiquadFilterNode`, `createPanner()` — that would need to be ported for every new backend.

## Decision

All instruments in `@score/components` use **only `@score/core` primitives** — `createOscillator`, `createGain`, `createFilter`, `createNoise`, `createDelay`, etc. No direct Web Audio API calls are permitted inside component code.

When a new backend is added, it implements the `@score/core` primitive interface. Instruments work unchanged across all backends.

If an instrument requires a primitive not yet in `@score/core` (e.g. `schedulePitchEnvelope`, `createGranularSource`), the rule is:
1. Add the primitive to `@score/core` first, in its own PR
2. Then use it from the component in a subsequent PR

## Consequences

- Instruments are backend-agnostic at the code level — the component source does not reference `AudioContext`, `OscillatorNode`, or any Web Audio type directly
- The SuperCollider backend (Phase 12c) must implement all `@score/core` primitives used by existing instruments before those instruments work on that backend
- Adding a new instrument that needs a new primitive requires a `@score/core` PR before the component PR — this is intentional friction that keeps the primitive layer complete and consistent
- `@score/core` becomes the authoritative inventory of what Score's synthesis engine can do — backend capabilities are visible at a glance from the `@score/core` exports

## Alternatives Considered

- **Allow direct Web Audio calls in components, port later** (rejected) — porting debt compounds; each new instrument adds more direct calls; the port becomes a large, risky migration
- **Per-backend component forks** (rejected) — duplicates instrument logic, defeats the purpose of the abstraction layer
- **Thin shim layer per component** (rejected) — same problem as direct calls but one indirection deeper; `@score/core` is the correct single shim boundary
