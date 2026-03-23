# ADR 002 — Backend Node Abstraction Layer

**Status:** Accepted
**Date:** 2026-03-22

## Context

Web Audio API is the standard for browser audio, but Score must run in Node.js (CLI/testing) and Electron (GUI). Direct Web Audio imports would make every component platform-dependent and impossible to unit test without a browser.

## Decision

All Web Audio access goes through a `BackendNode` abstraction layer defined in `@score/core/backend/types.ts`:

- `BackendGainNode`, `BackendFilterNode`, `BackendDelayNode`, etc. — typed wrappers over Web Audio nodes
- `BackendContext` (`ScoreAudioContext`) — the only entry point for creating nodes
- `node-web-audio-api` provides the Node.js polyfill in tests and CLI
- Song authors never see Web Audio — it is fully abstracted

No component may `import` from `'web-audio-api'` or use `AudioContext` directly.

## Consequences

- All components are unit-testable in Node.js with a real (polyfilled) audio context
- Platform targets (browser, Node, Electron) can swap implementations without touching components
- CI runs audio tests without a browser or GUI
- New backend (e.g. SuperCollider — Phase 12c) can be added by implementing the `BackendContext` interface

## Alternatives Considered

- **Direct Web Audio** (rejected) — untestable in Node.js, locks to browser
- **Mocking Web Audio in tests** (rejected) — mocks diverge from real behaviour, masks bugs
