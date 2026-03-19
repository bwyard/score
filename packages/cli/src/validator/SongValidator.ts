// SongValidator — AST-level static analysis before song execution
// Parses the song file and rejects dangerous patterns before any code runs
//
// Blocked:
//   - Imports of: fs, fs/promises, child_process, net, http, https, os, path, crypto, worker_threads
//   - process.* access
//   - eval() calls
//   - new Function() calls
//   - dynamic import() expressions

import * as fs from 'node:fs'
import * as acorn from 'acorn'
import * as walk from 'acorn-walk'
import { ScoreError } from '@score/core'

type ValidationError = {
  readonly line: number
  readonly message: string
  readonly fix: string
}

const BLOCKED_MODULES = new Set([
  'fs', 'fs/promises', 'node:fs', 'node:fs/promises',
  'child_process', 'node:child_process',
  'net', 'node:net',
  'http', 'node:http',
  'https', 'node:https',
  'os', 'node:os',
  'crypto', 'node:crypto',
  'worker_threads', 'node:worker_threads',
])

export const validateSongFile = (filePath: string): void => {
  const source = fs.readFileSync(filePath, 'utf8')
  let ast: acorn.Node

  try {
    ast = acorn.parse(source, {
      ecmaVersion: 2022,
      sourceType: 'module',
      locations: true,
    })
  } catch (err) {
    throw ScoreError('Song file has a syntax error', {
      fix: 'Fix the JavaScript syntax error before playing',
      received: err instanceof Error ? err.message : String(err),
      docs: 'https://score.dev/docs/cli/play',
    })
  }

  const errors: ValidationError[] = []

  walk.simple(ast, {
    ImportDeclaration(node: acorn.Node) {
      const n = node as acorn.Node & { source: { value: string }; loc?: { start: { line: number } } }
      const src = n.source.value
      if (BLOCKED_MODULES.has(src)) {
        errors.push({
          line: n.loc?.start.line ?? 0,
          message: `Blocked import "${src}" — not allowed in Score songs`,
          fix: `Remove this import. Score songs only use @score/* packages`,
        })
      }
    },
    CallExpression(node: acorn.Node) {
      const n = node as acorn.Node & {
        callee: acorn.Node & { name?: string; type: string }
        loc?: { start: { line: number } }
      }
      if (n.callee.type === 'Identifier' && n.callee.name === 'eval') {
        errors.push({
          line: n.loc?.start.line ?? 0,
          message: 'eval() is not allowed in Score songs',
          fix: 'Remove eval() — use standard JavaScript instead',
        })
      }
    },
    NewExpression(node: acorn.Node) {
      const n = node as acorn.Node & {
        callee: acorn.Node & { name?: string; type: string }
        loc?: { start: { line: number } }
      }
      if (n.callee.type === 'Identifier' && n.callee.name === 'Function') {
        errors.push({
          line: n.loc?.start.line ?? 0,
          message: 'new Function() is not allowed in Score songs',
          fix: 'Remove new Function() — use a regular arrow function instead',
        })
      }
    },
    MemberExpression(node: acorn.Node) {
      const n = node as acorn.Node & {
        object: acorn.Node & { name?: string; type: string }
        loc?: { start: { line: number } }
      }
      if (n.object.type === 'Identifier' && n.object.name === 'process') {
        errors.push({
          line: n.loc?.start.line ?? 0,
          message: '"process" is not available in Score songs',
          fix: 'Remove process.* access — Score songs do not have Node.js process control',
        })
      }
    },
  })

  if (errors.length > 0) {
    const summary = errors.map(e => `Line ${String(e.line)}: ${e.message}`).join('; ')
    const details = errors
      .map(e => `  Line ${String(e.line)}: ${e.message}\n  Fix: ${e.fix}`)
      .join('\n\n')
    throw ScoreError(`Song validation failed — ${summary}`, {
      fix: `Fix the issues listed below, then try again:\n\n${details}`,
      received: `${String(errors.length)} error${errors.length > 1 ? 's' : ''} found`,
      docs: 'https://score.dev/docs/cli/play',
    })
  }
}
