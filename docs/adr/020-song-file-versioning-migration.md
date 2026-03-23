# ADR 020 — Song File Versioning and Migration

**Date:** 2026-03-23
**Status:** Proposed
**Deciders:** Project owner

---

## Context

The Score DSL will evolve. Method renames, factory signature changes, and removed helpers are inevitable as the API matures. Without a migration system, every DSL change breaks every existing song file — a user who wrote tracks six months ago cannot open them in a newer Score Studio without manual editing.

---

## Decision

Song files declare their DSL version via a header comment:

```ts
// @score-version 1.0
import { Song, Kick, Bass303 } from '@score/dsl'
// ...
```

The CLI and Score Studio read this header before eval. If the version is behind the current DSL version, a **migration chain** runs first.

**Migration functions** are pure functions of signature `(code: string) => string`. They live in `@score/dsl/src/migrations/` and are named `v1_0_to_v1_1.ts`. Each function applies the minimal string transformation required for that version step (regex replacement, AST rewrite, or simple find-replace).

The migration chain composes all required steps in sequence:

```ts
const migrate = (code: string, from: string, to: string): string =>
  migrationChain
    .filter(m => m.from >= from && m.to <= to)
    .reduce((acc, m) => m.fn(acc), code)
```

**Rules:**
- Breaking DSL changes (renamed methods, removed factories) MUST ship with a migration
- Non-breaking additions (new chain methods, new factories) do NOT need migrations
- Migrations run in-memory before eval — the file is not written unless the user explicitly saves

**CLI commands:**
- `score migrate <file>` — apply all pending migrations and write in-place
- `score migrate --dry-run <file>` — print the migrated code without writing

Score Studio shows a banner when a song file needs migration, with a one-click "Migrate and Save" button.

---

## Consequences

**Positive:**
- Existing song files survive DSL evolution without manual editing
- Migrations are pure functions — testable, composable, zero side effects
- `--dry-run` lets users review changes before committing
- Breaking changes are forced to ship with their migration — no silent breakage

**Negative:**
- Migration functions must be maintained alongside every breaking DSL change — adds authoring discipline requirement
- String-based migrations are fragile for complex restructuring (a full AST rewrite would be safer but is overkill for most changes)
- Version header must be present — songs without the header are treated as version `1.0` (oldest)

---

## Alternatives Considered

- **No versioning** — require manual migration. Rejected: untenable once testers have accumulated song libraries.
- **AST-based migration** — parse to AST, transform, re-emit. More robust but requires a full TypeScript parser at runtime. Deferred; adopt if string migrations prove insufficient.
- **Lockfile approach** — pin DSL version per project (like `package.json`). Rejected: creates dependency management overhead; migrations are simpler for a single-author DSL.
