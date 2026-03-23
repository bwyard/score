# ADR 022 — Score Registry (Song and Instrument Sharing)

**Date:** 2026-03-23
**Status:** Proposed (not yet scheduled)
**Deciders:** Project owner

---

## Context

Community is core to a DAW platform's longevity. Artists sharing patterns, instruments, and songs builds the ecosystem and drives adoption. The registry must stay true to Score's core principle — code is music — which means no binary hosting, no proprietary formats, and no lock-in.

---

## Decision

**Score Registry** is a public index of published songs and instruments hosted at `registry.score.dev`.

The registry is an **index, not a host**. Every entry points to a git repository (GitHub or GitLab). The registry stores: name, author, description, tags, repo URL, entry file path, and Score DSL version. No binaries or audio files are stored in the registry.

**CLI commands:**

```
score publish song ./song.ts --name "Midnight Acid" --tags techno,acid
score publish instrument ./instruments/bass303.ts --name "TB-303 Acid"
score install midnight-acid
score search --tags techno
```

`score install <name>`:
1. Looks up the registry entry
2. Clones the repo (shallow) into `~/.score/instruments/` or `~/.score/songs/`
3. Makes the instrument available in the local eval sandbox

**Authentication:** GitHub OAuth — no separate Score account needed. Publish rights are tied to the authenticated GitHub identity.

**No bundled audio:** `samples/` directories in installed repos are gitignored by the registry fetch. The registry enforces the same no-bundled-audio rule as the core project.

**Versioning:** registry entries track the DSL version at publish time. `score install` checks compatibility and warns if a migration will be needed.

---

## Consequences

**Positive:**
- Authors retain full ownership — their music lives in their repos, not Score's servers
- "Code is music" principle is preserved end-to-end — instruments are TypeScript, not patches
- GitHub OAuth removes the need to build auth infrastructure
- Community instruments are automatically versioned via git history

**Negative:**
- Registry depends on third-party git hosts — if a repo is deleted, the registry entry breaks
- `score install` requires git on the user's machine — an additional dependency
- Curation / abuse prevention (malicious instrument code) requires a moderation policy

---

## Alternatives Considered

- **npm as the registry** — publish instruments as `@score-community/bass303`. Consistent with existing tooling. Deferred: npm is developer-centric; a domain-specific registry is more discoverable for musicians.
- **Binary / patch hosting (VST marketplace model)** — host compiled instruments. Rejected: incompatible with "code is music"; creates a binary dependency chain.
- **No public registry** — share via GitHub links only. Rejected: discoverability is the core value proposition; a searchable index is essential.
