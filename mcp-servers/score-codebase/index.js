#!/usr/bin/env node

// score-codebase MCP — Code intelligence for Claude Code sessions working on Score
// Tools: architecture_rules, package_graph, api_surface, project_status, adr_lookup

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SCORE_ROOT = resolve(__dirname, '../../')

const readFile = (path) => {
  try {
    return existsSync(path) ? readFileSync(path, 'utf-8') : null
  } catch {
    return null
  }
}

const readJson = (path) => {
  const content = readFile(path)
  if (!content) return null
  try {
    return JSON.parse(content)
  } catch {
    return null
  }
}

// ─── Tool: architecture_rules ────────────────────────────────────────

const SECTION_MAP = {
  'code-style': /## .*Code Style|## .*Functional/i,
  'non-negotiables': /## .*Non-Negotiable|## .*Never Violate/i,
  'git-workflow': /## .*Git Workflow/i,
  'testing': /## .*Testing|coverage/i,
  'audio-rules': /## .*Architectural Rules|## .*Audio/i,
}

const extractSection = (content, pattern) => {
  const lines = content.split('\n')
  let capturing = false
  let result = []
  for (const line of lines) {
    if (pattern.test(line)) {
      capturing = true
      result.push(line)
      continue
    }
    if (capturing) {
      if (/^## /.test(line) && result.length > 1) break
      result.push(line)
    }
  }
  return result.length > 0 ? result.join('\n').trim() : null
}

const architectureRules = {
  name: 'architecture_rules',
  description: 'Returns architecture rules, code style, non-negotiables, git workflow, testing standards, and audio rules from CLAUDE.md and SCORE_HANDOFF.md. Query a specific section or get everything.',
  inputSchema: {
    section: z.enum(['all', 'code-style', 'non-negotiables', 'git-workflow', 'testing', 'audio-rules'])
      .optional().default('all')
      .describe('Which section to return. "all" returns both CLAUDE.md and key HANDOFF sections.'),
  },
  handler: async ({ section }) => {
    const claudeMd = readFile(join(SCORE_ROOT, 'CLAUDE.md')) ?? '(CLAUDE.md not found)'
    const handoff = readFile(join(SCORE_ROOT, 'SCORE_HANDOFF.md')) ?? '(SCORE_HANDOFF.md not found)'

    if (section === 'all') {
      return { content: [{ type: 'text', text: `# CLAUDE.md\n\n${claudeMd}\n\n---\n\n# SCORE_HANDOFF.md (key sections)\n\n${extractSection(handoff, /## .*Architectural Rules/) ?? ''}\n\n${extractSection(handoff, /## .*Code Style|## .*Functional/) ?? ''}` }] }
    }

    const pattern = SECTION_MAP[section]
    const fromHandoff = pattern ? extractSection(handoff, pattern) : null
    const fromClaude = pattern ? extractSection(claudeMd, pattern) : null
    const result = [fromClaude, fromHandoff].filter(Boolean).join('\n\n---\n\n')
    return { content: [{ type: 'text', text: result || `No section found for "${section}"` }] }
  },
}

// ─── Tool: package_graph ─────────────────────────────────────────────

const packageGraph = {
  name: 'package_graph',
  description: 'Show the dependency graph of all workspace packages. Shows which packages depend on which, export counts, and stub status.',
  inputSchema: {
    filter: z.string().optional().describe('Optional substring filter on package name'),
  },
  handler: async ({ filter }) => {
    const pkgsDir = join(SCORE_ROOT, 'packages')
    if (!existsSync(pkgsDir)) return { content: [{ type: 'text', text: 'packages/ directory not found' }] }

    const dirs = readdirSync(pkgsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((name) => !filter || name.includes(filter))

    const packages = dirs.map((name) => {
      const pkg = readJson(join(pkgsDir, name, 'package.json'))
      if (!pkg) return null

      const indexContent = readFile(join(pkgsDir, name, 'src', 'index.ts')) ?? ''
      const isStub = indexContent.includes('_stub')
      const exportCount = (indexContent.match(/^export /gm) ?? []).length

      const deps = Object.keys(pkg.dependencies ?? {})
        .filter((d) => d.startsWith('@score/'))

      return { name: pkg.name, version: pkg.version, deps, isStub, exportCount, scripts: Object.keys(pkg.scripts ?? {}) }
    }).filter(Boolean)

    const lines = packages.map((p) => {
      const status = p.isStub ? ' [STUB]' : ''
      const depsStr = p.deps.length > 0 ? ` → ${p.deps.join(', ')}` : ''
      return `${p.name}${status} (${p.exportCount} exports)${depsStr}`
    })

    return { content: [{ type: 'text', text: `# Package Graph\n\n${lines.join('\n')}` }] }
  },
}

// ─── Tool: api_surface ───────────────────────────────────────────────

const apiSurface = {
  name: 'api_surface',
  description: 'List all exports from a package\'s src/index.ts with their signatures. Shows factory functions, types, and props.',
  inputSchema: {
    package: z.string().describe('Package name (e.g., "effects", "core", "mixer", "sequencer")'),
  },
  handler: async ({ package: pkgName }) => {
    const indexPath = join(SCORE_ROOT, 'packages', pkgName, 'src', 'index.ts')
    const content = readFile(indexPath)
    if (!content) return { content: [{ type: 'text', text: `Package "${pkgName}" not found or has no src/index.ts` }] }

    // Parse exports
    const exportLines = content.split('\n').filter((l) => l.startsWith('export'))
    const result = []

    for (const line of exportLines) {
      // export { createFoo } from './foo.js'
      const reExport = line.match(/export\s+\{\s*(\w+)\s*\}\s+from\s+'\.\/(\S+?)(?:\.js)?'/)
      const typeExport = line.match(/export\s+type\s+\{\s*(\w+)\s*\}\s+from/)

      if (typeExport) {
        result.push(`  type ${typeExport[1]}`)
      } else if (reExport) {
        const funcName = reExport[1]
        const srcFile = reExport[2]
        // Try to read the source file for the signature
        const srcPath = join(SCORE_ROOT, 'packages', pkgName, 'src', `${srcFile}.ts`)
        const srcContent = readFile(srcPath)
        if (srcContent) {
          const sigMatch = srcContent.match(new RegExp(`export const ${funcName}\\s*=\\s*\\([^)]*\\)`))
          if (sigMatch) {
            result.push(`  ${sigMatch[0].replace('export const ', '')}`)
          } else {
            result.push(`  ${funcName}`)
          }
        } else {
          result.push(`  ${funcName}`)
        }
      } else if (line.startsWith('export *')) {
        result.push(`  ${line.trim()}`)
      }
    }

    return { content: [{ type: 'text', text: `# @score/${pkgName} API Surface\n\n${result.join('\n')}` }] }
  },
}

// ─── Tool: project_status ────────────────────────────────────────────

const getLiveGitState = () => {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: SCORE_ROOT, encoding: 'utf-8' }).trim()
    const lastCommit = execSync('git log --oneline -1', { cwd: SCORE_ROOT, encoding: 'utf-8' }).trim()
    const uncommitted = execSync('git status --short', { cwd: SCORE_ROOT, encoding: 'utf-8' }).trim()
    const fileCount = uncommitted ? uncommitted.split('\n').length : 0
    return { branch, lastCommit, fileCount }
  } catch {
    return null
  }
}

const getSessionState = () => {
  const sessionPath = join(SCORE_ROOT, '..', 'claude-resources', 'sessions', 'score', 'current.md')
  return readFile(sessionPath)
}

const projectStatus = {
  name: 'project_status',
  description: 'Get current project status: live git state, in-progress phases (⚠️), session notes, and test counts. Combines live git data with SCORE_HANDOFF.md and the active session file.',
  inputSchema: {
    section: z.enum(['all', 'phases', 'live', 'session', 'tests'])
      .optional().default('all')
      .describe('"phases" shows full build status from SCORE_HANDOFF.md, "live" shows git branch/commit/uncommitted files, "session" shows current session notes, "tests" runs pnpm test, "all" shows live + in-progress + session.'),
  },
  handler: async ({ section }) => {
    const handoff = readFile(join(SCORE_ROOT, 'SCORE_HANDOFF.md')) ?? ''

    if (section === 'tests') {
      try {
        const output = execSync('pnpm test 2>&1', { cwd: SCORE_ROOT, timeout: 60000, encoding: 'utf-8' })
        const testLines = output.split('\n').filter((l) => /Tests.*passed/.test(l) || /Tests.*failed/.test(l))
        return { content: [{ type: 'text', text: `# Test Results\n\n${testLines.join('\n')}` }] }
      } catch (err) {
        return { content: [{ type: 'text', text: `# Test Results\n\nError running tests: ${err.message}` }] }
      }
    }

    if (section === 'session') {
      const session = getSessionState()
      return { content: [{ type: 'text', text: session ? `# Session State\n\n${session}` : 'Session file not found' }] }
    }

    // Live git state
    const git = getLiveGitState()
    const liveBlock = git
      ? `## Live State\n\n- **Branch:** \`${git.branch}\`\n- **Last commit:** ${git.lastCommit}\n- **Uncommitted files:** ${git.fileCount}`
      : '## Live State\n\n(git unavailable)'

    if (section === 'live') {
      return { content: [{ type: 'text', text: liveBlock }] }
    }

    const phases = extractSection(handoff, /## .*Build Status/)

    // Extract in-progress (⚠️) phase lines as a quick summary
    const inProgressLines = (phases ?? '').split('\n')
      .filter((l) => l.includes('⚠️'))
    const inProgress = inProgressLines.length > 0
      ? `## In Progress (⚠️)\n\n${inProgressLines.join('\n')}`
      : '## In Progress\n\nNo ⚠️ items in SCORE_HANDOFF.md — check session file for latest.'

    if (section === 'phases') {
      return { content: [{ type: 'text', text: `${liveBlock}\n\n---\n\n${phases ?? 'No phase status found in SCORE_HANDOFF.md'}` }] }
    }

    // 'all' — live + in-progress + session head
    const session = getSessionState()
    const sessionBlock = session
      ? `## Session Notes\n\n${session.split('\n').slice(0, 40).join('\n')}\n\n_(truncated — use section: "session" for full file)_`
      : ''

    const parts = [liveBlock, inProgress, sessionBlock].filter(Boolean)
    return { content: [{ type: 'text', text: parts.join('\n\n---\n\n') }] }
  },
}

// ─── Tool: adr_lookup ────────────────────────────────────────────────

const adrLookup = {
  name: 'adr_lookup',
  description: 'Query Architecture Decision Records. Pass a number to read a specific ADR, a keyword to search, or omit to list all.',
  inputSchema: {
    query: z.string().optional().describe('ADR number (e.g. "001") or keyword (e.g. "backend"). Omit to list all ADRs.'),
  },
  handler: async ({ query }) => {
    const adrDir = join(SCORE_ROOT, 'docs', 'adr')
    if (!existsSync(adrDir)) {
      return { content: [{ type: 'text', text: 'No ADRs yet. Create them in docs/adr/ with format: 001-title.md' }] }
    }

    const files = readdirSync(adrDir).filter((f) => f.endsWith('.md')).sort()

    if (!query) {
      return { content: [{ type: 'text', text: `# ADR Index\n\n${files.map((f) => `- ${f}`).join('\n') || 'No ADRs found'}` }] }
    }

    // Search by number
    const byNumber = files.find((f) => f.startsWith(query.padStart(3, '0')))
    if (byNumber) {
      const content = readFile(join(adrDir, byNumber))
      return { content: [{ type: 'text', text: content ?? `Could not read ${byNumber}` }] }
    }

    // Search by keyword
    const matches = files.filter((f) => {
      const content = readFile(join(adrDir, f)) ?? ''
      return content.toLowerCase().includes(query.toLowerCase()) || f.toLowerCase().includes(query.toLowerCase())
    })

    if (matches.length === 0) return { content: [{ type: 'text', text: `No ADRs match "${query}"` }] }

    const results = matches.map((f) => {
      const content = readFile(join(adrDir, f)) ?? ''
      const firstLine = content.split('\n').find((l) => l.startsWith('#')) ?? f
      return `- **${f}**: ${firstLine.replace(/^#+\s*/, '')}`
    })

    return { content: [{ type: 'text', text: `# ADR Search: "${query}"\n\n${results.join('\n')}` }] }
  },
}

// ─── Server ──────────────────────────────────────────────────────────

const tools = [architectureRules, packageGraph, apiSurface, projectStatus, adrLookup]

const createServer = () => {
  const server = new McpServer({
    name: 'score-codebase',
    version: '0.1.0',
  })

  for (const tool of tools) {
    server.tool(tool.name, tool.description, tool.inputSchema, tool.handler)
  }

  return server
}

const main = async () => {
  const server = createServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  process.stderr.write(`score-codebase MCP error: ${err}\n`)
  process.exit(1)
})
