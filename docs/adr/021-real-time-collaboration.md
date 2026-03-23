# ADR 021 — Real-Time Collaboration Architecture

**Date:** 2026-03-23
**Status:** Proposed (not yet scheduled)
**Deciders:** Project owner

---

## Context

Live coding performance with multiple simultaneous coders is a key differentiator for Score — each performer edits the shared song in real time, and the audience hears the result evolve. This capability is post-v1 but requires an architectural slot before the network layer is frozen, so that early decisions (IPC bridge, eval sandbox) do not inadvertently close off the collaboration path.

---

## Decision

Score collaboration uses a **shared-document model over WebRTC**.

Each participant holds a full local copy of the song code. Changes are broadcast as **operational transforms (OT)** on the code string — the same model used by collaborative text editors (Google Docs, CodeMirror collab). Audio is not streamed; each participant runs the song locally from their own synced code copy.

**Session setup:**
- The session host runs `score collab host` (CLI) or clicks "Start Collab" in Score Studio
- A WebRTC data channel is established; a human-readable session code is generated
- Participants join via `score collab join <code>` or the GUI join dialog

**Sync payload:** code string diffs (OT operations), not audio. Latency tolerance is the same as a text editor — 100–300 ms round trip is acceptable.

**Package:** a dedicated `@score/collab` package wraps the WebRTC signaling, OT engine, and connection management. It is a pure add-on — `@score/core`, `@score/dsl`, and `@score/gui` have no collab dependencies.

**Eval trigger:** each participant's eval runs locally on receipt of the merged code string. There is no "master" audio source — all participants hear their own local render.

---

## Consequences

**Positive:**
- No audio streaming required — bandwidth is minimal (text diffs only)
- OT is a well-understood algorithm with existing TypeScript implementations
- `@score/collab` is opt-in — non-collab installs are unaffected
- Live coding performance is a genuine differentiator in the DAW market

**Negative:**
- OT merge conflicts on simultaneous edits to the same line require conflict resolution policy
- Participants may hear slight divergence if their local audio backends differ
- WebRTC signaling requires a lightweight relay server (STUN/TURN) for NAT traversal — not fully peer-to-peer

---

## Alternatives Considered

- **CRDTs instead of OT** — conflict-free replicated data types are simpler to implement correctly. Worth revisiting at implementation time; OT is selected here for familiarity.
- **Audio streaming (JamKazam model)** — stream the mixed audio to all participants. Rejected: latency and bandwidth requirements are an order of magnitude higher than code sync.
- **Central server with shared state** — server holds the canonical code string. Rejected: introduces server dependency and single point of failure; WebRTC peer model is more resilient for live performance.
