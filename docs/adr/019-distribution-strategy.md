# ADR 019 — Distribution Strategy

**Date:** 2026-03-23
**Status:** Proposed
**Deciders:** Project owner

---

## Context

Score must be installable by two distinct audiences: developers (comfortable with npm and the terminal) and musician testers (who may not know what npm is). A single distribution channel serves neither well. The project also needs a clear versioning contract so CLI and Studio never drift out of sync.

---

## Decision

Three distribution channels:

**1. npm global (developers / CI)**
```
npm install -g @score/cli
```
CLI only. Provides `score play`, `score export`, `score doctor`, etc. No GUI.

**2. Electron installer (musicians / general users)**
Built via `electron-forge make`:
- Windows: NSIS `.exe` installer
- macOS: `.dmg`
- Linux: `.AppImage`

This is the **primary distribution path**. Bundles the CLI and Score Studio together.

**3. Homebrew tap (macOS first-class)**
```
brew install bwyard/tap/score
```
Installs CLI + opens Score Studio. Targets macOS developers who prefer Homebrew over npm globals.

**Auto-update:** `electron-updater` with GitHub Releases as the update server. Update check on every Studio launch; user prompted, never forced.

**Versioning:** semantic versioning. CLI and Studio always ship at the same version number — a single release cuts both the npm package and the Electron installer. The npm scope is `@score/*` internally; packages are published under `@bwyard/*`.

**Dev / beta channel:** `npm install -g @score/cli@beta` and a separate GitHub Release pre-release tag for the installer.

---

## Consequences

**Positive:**
- Musicians install the `.exe`/`.dmg` — no npm required
- Developers install via npm or Homebrew — no GUI overhead if unwanted
- Single version number prevents CLI/Studio mismatch bugs
- GitHub Releases is free and already needed for the repo

**Negative:**
- Three channels require three build/publish jobs in CI
- Homebrew tap requires a separate tap repo (`bwyard/homebrew-tap`)
- Code-signing (macOS notarization, Windows Authenticode) is required for installer trust — cost and setup overhead

---

## Alternatives Considered

- **npm only** — simplest. Rejected: musicians cannot install npm packages without developer tooling.
- **Web app (browser-based Score Studio)** — no install required. Rejected: Web Audio API limitations for professional latency, no local file system access without workarounds.
- **Single channel (installer only)** — no npm package. Rejected: CI pipelines and developer workflows need headless CLI access.
