#!/usr/bin/env node

// score-codebase MCP — Code intelligence for Claude Code sessions working on Score
// Tools: architecture_rules, package_graph, api_surface, project_status, adr_lookup,
//        dsl_diagnostics_schema, ui_ipc_map, ui_component_catalog

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

// ─── Tool: dsl_diagnostics_schema ────────────────────────────────────

const dslDiagnosticsSchema = {
  name: 'dsl_diagnostics_schema',
  description: 'Returns all DSL validation error codes, message templates, fix hints, and severity levels. Used by Monaco to show squiggles on invalid Song code. Covers both AST-level (blocked imports, eval, process) and structural (SongDefinition shape) errors.',
  inputSchema: {
    filter: z.enum(['all', 'ast', 'structural']).optional().default('all')
      .describe('"ast" = pre-execution validator errors, "structural" = post-execution schema errors, "all" = both'),
  },
  handler: async ({ filter }) => {
    const validatorPath = join(SCORE_ROOT, 'packages', 'cli', 'src', 'validator', 'SongValidator.ts')
    const exportValidatorPath = join(SCORE_ROOT, 'packages', 'cli', 'src', 'validator', 'SongExportValidator.ts')

    const astSource = readFile(validatorPath) ?? ''
    const structSource = readFile(exportValidatorPath) ?? ''

    // Extract blocked modules list from AST validator
    const blockedMatch = astSource.match(/const BLOCKED_MODULES = new Set\(\[([\s\S]*?)\]\)/)
    const blockedModules = blockedMatch
      ? blockedMatch[1].match(/'([^']+)'/g)?.map(s => s.replace(/'/g, '')) ?? []
      : []

    const astErrors = [
      {
        code: 'syntax-error',
        severity: 'error',
        message: 'Song file has a syntax error',
        fix: 'Fix the JavaScript syntax error before playing',
        source: 'SongValidator (parse phase)',
      },
      {
        code: 'blocked-import',
        severity: 'error',
        message: 'Blocked import "{module}" — not allowed in Score songs',
        fix: 'Remove this import. Score songs only use @score/* packages',
        blockedModules,
        source: 'SongValidator (ImportDeclaration)',
      },
      {
        code: 'eval-call',
        severity: 'error',
        message: 'eval() is not allowed in Score songs',
        fix: 'Remove eval() — use standard JavaScript instead',
        source: 'SongValidator (CallExpression)',
      },
      {
        code: 'new-function',
        severity: 'error',
        message: 'new Function() is not allowed in Score songs',
        fix: 'Remove new Function() — use a regular arrow function instead',
        source: 'SongValidator (NewExpression)',
      },
      {
        code: 'process-access',
        severity: 'error',
        message: '"process" is not available in Score songs',
        fix: 'Remove process.* access — Score songs do not have Node.js process control',
        source: 'SongValidator (MemberExpression)',
      },
    ]

    // Extract Zod schema fields from structural validator
    const zodFields = [...structSource.matchAll(/(\w+):\s*z\.([\w.()'"]+)/g)]
      .map(m => ({ field: m[1], schema: m[2] }))

    const structErrors = [
      {
        code: 'invalid-song-export',
        severity: 'error',
        message: 'Song export is not a valid Song definition',
        fix: 'Make sure your file ends with: export default Song({ bpm, tracks: [...] })',
        requiredShape: {
          _type: '"SongDefinition"',
          bpm: 'number (20–400)',
          tracks: 'array (min 1)',
          arrangement: 'array of SectionDefinition',
          key: 'string (optional)',
          genre: 'string (optional)',
        },
        zodFields,
        source: 'SongExportValidator (Zod schema)',
      },
    ]

    const result = {
      ast: filter === 'structural' ? [] : astErrors,
      structural: filter === 'ast' ? [] : structErrors,
      total: (filter === 'structural' ? 0 : astErrors.length) + (filter === 'ast' ? 0 : structErrors.length),
    }

    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  },
}

// ─── Tool: ui_ipc_map ────────────────────────────────────────────────

const uiIpcMap = {
  name: 'ui_ipc_map',
  description: 'Returns all typed IPC channels between Electron main process and renderer, with direction, payload type shape, and usage notes. Sourced from packages/gui/src/main/ipc-types.ts.',
  inputSchema: {
    direction: z.enum(['all', 'renderer-to-main', 'main-to-renderer']).optional().default('all')
      .describe('Filter by channel direction'),
  },
  handler: async ({ direction }) => {
    const ipcTypesPath = join(SCORE_ROOT, 'packages', 'gui', 'src', 'main', 'ipc-types.ts')
    const source = readFile(ipcTypesPath)
    if (!source) return { content: [{ type: 'text', text: 'ipc-types.ts not found at packages/gui/src/main/ipc-types.ts' }] }

    // Extract RendererToMain channels
    const r2mMatch = source.match(/export type RendererToMain = \{([\s\S]*?)\n\}/)
    const m2rMatch = source.match(/export type MainToRenderer = \{([\s\S]*?)\n\}/)

    const parseChannels = (block, dir) => {
      if (!block) return []
      return [...block.matchAll(/['"]([^'"]+)['"]\s*:\s*([^\n]+)/g)].map(m => {
        const channel = m[1]
        const payloadRaw = m[2].trim().replace(/,$/, '')
        // Extract preceding comment if any
        const commentMatch = block.match(new RegExp(`/\\*\\*([^*]|\\*(?!/))*\\*/\\s*['"]${channel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`))
        const comment = commentMatch
          ? commentMatch[0].replace(/\/\*\*|\*\//g, '').replace(/\s*\*\s*/g, ' ').trim()
          : null
        return { channel, direction: dir, payload: payloadRaw, description: comment }
      })
    }

    const r2m = parseChannels(r2mMatch?.[1], 'renderer→main')
    const m2r = parseChannels(m2rMatch?.[1], 'main→renderer')

    const channels = [
      ...(direction === 'main-to-renderer' ? [] : r2m),
      ...(direction === 'renderer-to-main' ? [] : m2r),
    ]

    const lines = channels.map(c => {
      const desc = c.description ? `\n    // ${c.description}` : ''
      return `${c.direction}  '${c.channel}': ${c.payload}${desc}`
    })

    const summary = `# IPC Channel Map\n\nSource: packages/gui/src/main/ipc-types.ts\nTotal channels: ${channels.length} (${r2m.length} renderer→main, ${m2r.length} main→renderer)\n\n${lines.join('\n\n')}`

    return { content: [{ type: 'text', text: summary }] }
  },
}

// ─── Tool: ui_component_catalog ──────────────────────────────────────

const MODE_MAP = {
  'LiveCode': 'live-code',
  'Produce': 'produce',
  'DJSet': 'dj-set',
  'JamSession': 'jam-session',
  'shared': 'shared',
  'status': 'shared',
  'visualizer': 'shared',
  'SplashScreen': 'shared',
}

const inferMode = (filePath) => {
  for (const [segment, mode] of Object.entries(MODE_MAP)) {
    if (filePath.includes(`/${segment}/`) || filePath.includes(`\\${segment}\\`) || filePath.endsWith(`/${segment}.tsx`) || filePath.endsWith(`\\${segment}.tsx`)) {
      return mode
    }
  }
  return 'unknown'
}

const extractPropsInterface = (source, componentName) => {
  // Try to find Props type alias or interface
  const patterns = [
    new RegExp(`type ${componentName}Props\\s*=\\s*\\{([^}]+)\\}`, 's'),
    new RegExp(`interface ${componentName}Props\\s*\\{([^}]+)\\}`, 's'),
    /type Props\s*=\s*\{([^}]+)\}/s,
    /interface Props\s*\{([^}]+)\}/s,
  ]
  for (const pattern of patterns) {
    const match = source.match(pattern)
    if (match) {
      return match[1].trim().split('\n').map(l => l.trim()).filter(Boolean).join('; ')
    }
  }
  // Fallback: find destructured props in component function
  const funcMatch = source.match(/(?:const|function)\s+\w+\s*=?\s*\(\s*\{([^}]+)\}/)
  if (funcMatch) return `{ ${funcMatch[1].trim()} } (inferred from destructuring)`
  return null
}

const uiComponentCatalog = {
  name: 'ui_component_catalog',
  description: 'Lists all React components in the Score GUI renderer, with file path, props interface, and which GUI mode it belongs to (live-code/produce/dj-set/jam-session/shared). Useful for understanding the full GUI component surface.',
  inputSchema: {
    mode: z.enum(['all', 'live-code', 'produce', 'dj-set', 'jam-session', 'shared']).optional().default('all')
      .describe('Filter by GUI mode'),
  },
  handler: async ({ mode }) => {
    const componentsDir = join(SCORE_ROOT, 'packages', 'gui', 'src', 'renderer', 'components')
    if (!existsSync(componentsDir)) {
      return { content: [{ type: 'text', text: 'GUI components directory not found at packages/gui/src/renderer/components/' }] }
    }

    const walkDir = (dir) => {
      const entries = readdirSync(dir, { withFileTypes: true })
      return entries.flatMap(entry => {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) return walkDir(full)
        if (entry.name.endsWith('.tsx')) return [full]
        return []
      })
    }

    const files = walkDir(componentsDir)
    const components = files.map(filePath => {
      const source = readFile(filePath) ?? ''
      const relativePath = filePath.replace(SCORE_ROOT + '\\', '').replace(SCORE_ROOT + '/', '').replace(/\\/g, '/')

      // Derive component name from file
      const fileName = filePath.split(/[/\\]/).pop()?.replace('.tsx', '') ?? ''
      const componentName = fileName === 'index'
        ? filePath.split(/[/\\]/).slice(-2)[0] ?? fileName
        : fileName

      const componentMode = inferMode(filePath)
      const props = extractPropsInterface(source, componentName)

      // Check if it exports a default component
      const hasDefault = /export default/.test(source)
      const namedExports = [...source.matchAll(/export (?:const|function) (\w+)/g)].map(m => m[1])

      return {
        name: componentName,
        file: relativePath,
        mode: componentMode,
        props: props ?? '(no props type found)',
        exports: hasDefault ? ['default', ...namedExports] : namedExports,
      }
    }).filter(c => mode === 'all' || c.mode === mode)

    const lines = components.map(c =>
      `## ${c.name}\n- **File:** ${c.file}\n- **Mode:** ${c.mode}\n- **Exports:** ${c.exports.join(', ') || 'none'}\n- **Props:** ${c.props}`
    )

    const summary = `# GUI Component Catalog\n\n${components.length} component${components.length !== 1 ? 's' : ''} (mode: ${mode})\n\n${lines.join('\n\n')}`
    return { content: [{ type: 'text', text: summary }] }
  },
}

// ─── Server ──────────────────────────────────────────────────────────

const tools = [architectureRules, packageGraph, apiSurface, projectStatus, adrLookup, dslDiagnosticsSchema, uiIpcMap, uiComponentCatalog]

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
