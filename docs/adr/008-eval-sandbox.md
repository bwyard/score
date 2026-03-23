# ADR 008 — Eval Sandbox via Node.js `vm` Module

**Status:** Accepted
**Date:** 2026-03-22

## Context

Song files are user-written code evaluated at runtime inside the Electron main process. The main process has full access to the filesystem, network, and Electron APIs. Evaluating arbitrary user code without sandboxing would allow any song file to read or write disk, make network requests, or call Electron internals.

ADR 005 established that song files run as ES modules via dynamic `import()` in the CLI. In the Electron GUI's live-coding REPL, a different evaluation path is needed — one that can intercept and restrict the code's capabilities before execution.

## Decision

Song code submitted to the live-coding REPL is evaluated in a Node.js `vm` sandbox:

- `vm.createContext` creates an isolated context with only the injected DSL bindings visible
- `vm.runInContext` executes the song code in that context
- Before eval, `import` statements are stripped and replaced with the pre-injected `@score/dsl` bindings
- `export default` is captured as the Song result
- The sandbox has **no access** to filesystem (`fs`), network (`http`, `fetch`), or Electron APIs

The injected bindings expose only the `@score/dsl` surface: instrument factories, effect factories, `Song`, `Track`, `BPM`, and math utilities.

## Consequences

- Untrusted or user-submitted song code cannot escape the DSL surface area
- Song files in the REPL cannot use `require()` or `import` at runtime — only the injected `@score/dsl` bindings are available
- The CLI's `score play` path (ADR 005) remains unchanged — `--trust` flag bypasses the sandbox for trusted local files
- Error messages from the `vm` context are surfaced to the UI via the `debug:pop` IPC channel (see ADR 009)
- The sandbox boundary means any DSL capability not explicitly injected is unavailable — the injection list is the authoritative surface

## Alternatives Considered

- **No sandbox, direct `import()`** (rejected) — any song file could access filesystem or call `shell.openExternal`; unacceptable for a live-coding GUI
- **Worker threads for isolation** (considered) — stronger isolation but serialization overhead makes it unsuitable for real-time audio scheduling; `vm` sandbox is sufficient for the DSL use case
- **WebAssembly sandbox** (deferred) — strongest isolation but requires compiling the DSL to Wasm; out of scope for Phase 1
