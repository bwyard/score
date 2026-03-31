# Security Policy

## Supported Versions

Score is pre-release software. Security fixes are applied to the `main` branch only.

| Version | Supported |
|---------|-----------|
| `main` | ✅ |
| older branches | ❌ |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email **byard29@gmail.com** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- The version or commit hash where the issue exists
- Any suggested mitigations if you have them

You will receive a response within 7 days. If the vulnerability is confirmed, a fix will be prioritised and you will be credited in the release notes unless you prefer otherwise.

---

## Scope

Areas of particular concern for Score:

- **Song file evaluation** — Score evaluates user-authored `.ts` song files at runtime. Sandbox escapes, import of dangerous modules (`fs`, `child_process`, `net`), or code execution outside the intended scope are high-severity issues.
- **Electron main process** — IPC handlers that allow renderer-to-main privilege escalation.
- **Dependency vulnerabilities** — Known CVEs in Score's published npm packages.

Out of scope: issues in development tooling only (Vitest, ESLint, TypeScript compiler errors, etc.) that do not affect the shipped application.

---

## Disclosure Policy

Once a fix is released, vulnerabilities will be disclosed publicly in the GitHub security advisories with full credit to the reporter.
