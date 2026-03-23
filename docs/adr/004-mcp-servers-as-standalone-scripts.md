# ADR 004 — MCP Servers as Standalone Node Scripts

**Status:** Accepted
**Date:** 2026-03-22

## Context

Score needs MCP (Model Context Protocol) servers so AI assistants can query the codebase during development. The servers need to read TypeScript source, run git commands, and parse package.json — but they don't need to import the compiled audio packages.

The monorepo uses pnpm workspaces + Turborepo. Options were:
1. MCP as a workspace package (`packages/mcp/`) — integrated into the build graph
2. MCP as standalone scripts in `mcp-servers/` — outside the build graph

## Decision

MCP servers live in `mcp-servers/score-audio/` and `mcp-servers/score-codebase/` as plain Node.js ESM scripts. They:
- Run directly as `node index.js` — no compile step required in normal use
- Have their own `package.json` and `node_modules`
- Are **not** workspace packages — they don't import `@score/*` at runtime
- Read `@score/*` source files as text (not imports) for introspection

`packages/mcp/` remains a stub (`export const _stub = true`) for future public-facing MCP integration.

## Consequences

- MCP servers start immediately — no Turborepo build pipeline involved
- Source reading is done with `readFileSync` — not type-safe but avoids circular dependency
- `SCORE_ROOT = resolve(__dirname, '../../')` — path convention must be maintained
- Claude Code's `.claude.json` points directly to `mcp-servers/*/index.js`
- Changes to MCP servers are not gated by CI (no test suite for MCP scripts yet)

## Alternatives Considered

- **Workspace package** (deferred) — cleaner long-term but adds build overhead and circular-dep risk during early development
- **Single combined MCP server** (rejected) — audio and codebase concerns are separate; two servers = cleaner tool namespacing
