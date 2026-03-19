#!/usr/bin/env node

// score-audio MCP — Audio domain intelligence for AI-assisted composition and debugging
// Tools: effect_catalog, signal_flow, backend_nodes, component_catalog

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SCORE_ROOT = resolve(__dirname, '../../')

const readFile = (path) => {
  try {
    return existsSync(path) ? readFileSync(path, 'utf-8') : null
  } catch {
    return null
  }
}

// Extract a Props type block from TS source
const extractPropsType = (content, typeName) => {
  const lines = content.split('\n')
  let capturing = false
  let depth = 0
  const result = []
  for (const line of lines) {
    if (!capturing && line.includes(`export type ${typeName}`)) {
      capturing = true
    }
    if (capturing) {
      result.push(line)
      depth += (line.match(/\{/g) ?? []).length
      depth -= (line.match(/\}/g) ?? []).length
      if (depth <= 0 && result.length > 1) break
    }
  }
  return result.length > 0 ? result.join('\n').trim() : null
}

// Extract TSDoc block immediately above a line matching pattern
const extractJsDoc = (content, pattern) => {
  const lines = content.split('\n')
  const idx = lines.findIndex((l) => pattern.test(l))
  if (idx === -1) return null
  const docLines = []
  let i = idx - 1
  while (i >= 0 && (lines[i].trim().startsWith('*') || lines[i].trim().startsWith('/**') || lines[i].trim().startsWith('*/'))) {
    docLines.unshift(lines[i])
    if (lines[i].trim().startsWith('/**')) break
    i--
  }
  return docLines.length > 0 ? docLines.join('\n').trim() : null
}

// Extract connect() routing lines from an effect file
const extractRouting = (content) => {
  const lines = content.split('\n')
  const routing = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('// Route') || trimmed.startsWith('// Feedback') || trimmed.startsWith('// route')) {
      routing.push(trimmed)
    } else if (trimmed.match(/\w+\.connect\(\w+\)/) && !trimmed.startsWith('//')) {
      routing.push(trimmed.replace(/,$/, ''))
    }
  }
  return routing
}

// Extract context.createXxx() calls to find which backend nodes an effect uses
const extractBackendNodes = (content) => {
  const matches = content.match(/context\.create\w+/g) ?? []
  return [...new Set(matches)].sort()
}

// ─── Tool: effect_catalog ─────────────────────────────────────────────

const EFFECTS_DIR = join(SCORE_ROOT, 'packages', 'effects', 'src')

// Static catalog entries for each effect — category, description, EDM use cases
const EFFECT_META = {
  delay:               { category: 'time',        desc: 'Feedback delay with echo tails',          edm: 'dub, house, ambient' },
  reverb:              { category: 'time',        desc: 'Convolution-style reverb for space',      edm: 'ambient, pad wash, snare room' },
  filter:              { category: 'filter',      desc: 'Resonant multi-mode filter',              edm: 'filter sweep, acid bass, hihat shaping' },
  eq:                  { category: 'filter',      desc: '3-band parametric EQ',                    edm: 'mix bus, vocal presence, low-end control' },
  compressor:          { category: 'dynamics',    desc: 'Dynamic range compressor',                edm: 'drums, bus glue, vocal control' },
  'multiband-compressor': { category: 'dynamics', desc: '3-band multiband compressor',            edm: 'mastering chain, bass/mid/high control' },
  limiter:             { category: 'dynamics',    desc: 'Brick-wall limiter',                      edm: 'master bus ceiling, loudness maximiser' },
  gate:                { category: 'dynamics',    desc: 'Noise gate with threshold',               edm: 'gated snare, parallel drum gating' },
  sidechain:           { category: 'dynamics',    desc: 'Sidechain compression (duck on input)',   edm: 'EDM pumping, kick-vs-bass ducking' },
  distortion:          { category: 'saturation',  desc: 'Wave-shaper distortion with drive',      edm: 'growl bass, distorted lead, lo-fi' },
  saturation:          { category: 'saturation',  desc: 'Soft-clip tape saturation',              edm: 'warmth, analog glue, transient rounding' },
  bitcrusher:          { category: 'saturation',  desc: 'Bit depth and sample rate reducer',       edm: 'lo-fi, glitch, retro game' },
  chorus:              { category: 'modulation',  desc: 'Multi-voice chorus',                      edm: 'pad thickening, 80s synths, detune' },
  flanger:             { category: 'modulation',  desc: 'Short modulated delay with feedback',    edm: 'sweeping jet effect, comb filtering' },
  phaser:              { category: 'modulation',  desc: 'All-pass phase shifting cascade',         edm: 'funk guitar feel, psychedelic sweep' },
  autopan:             { category: 'modulation',  desc: 'LFO-driven stereo panning',              edm: 'ping-pong delay feel, stereo movement' },
  'stereo-widener':    { category: 'spatial',     desc: 'Mid-side stereo width control',           edm: 'mix bus width, pad spreading' },
  chain:               { category: 'routing',     desc: 'Serial effects chain builder',            edm: 'insert chain, DSP signal path' },
}

const effectCatalog = {
  name: 'effect_catalog',
  description: 'List all @score/effects with their props, signal routing, backend nodes used, and EDM use cases. Query a specific effect or list all by category.',
  inputSchema: {
    effect: z.string().optional()
      .describe('Effect name (e.g. "delay", "reverb", "compressor"). Omit to list all.'),
    category: z.enum(['all', 'time', 'filter', 'dynamics', 'saturation', 'modulation', 'spatial', 'routing'])
      .optional().default('all')
      .describe('Filter by category when listing all effects.'),
  },
  handler: async ({ effect, category }) => {
    // Single effect — full detail
    if (effect) {
      const fileName = effect.endsWith('.ts') ? effect : `${effect}.ts`
      const filePath = join(EFFECTS_DIR, fileName)
      const content = readFile(filePath)
      if (!content) {
        const available = readdirSync(EFFECTS_DIR).filter((f) => f.endsWith('.ts') && f !== 'index.ts').map((f) => f.replace('.ts', ''))
        return { content: [{ type: 'text', text: `Effect "${effect}" not found.\n\nAvailable: ${available.join(', ')}` }] }
      }

      const effectName = effect.replace('.ts', '')
      const meta = EFFECT_META[effectName] ?? { category: 'unknown', desc: '', edm: '' }

      // Find Props type name from file
      const propsMatch = content.match(/export type (\w+Props)/)
      const propsTypeName = propsMatch?.[1]
      const props = propsTypeName ? extractPropsType(content, propsTypeName) : null

      // Find factory function name
      const factoryMatch = content.match(/export const (create\w+)/)
      const factoryName = factoryMatch?.[1]
      const jsdoc = factoryName ? extractJsDoc(content, new RegExp(`export const ${factoryName}`)) : null

      const routing = extractRouting(content)
      const backendNodes = extractBackendNodes(content)

      const sections = [
        `# ${effectName} — ${meta.desc}`,
        `**Category:** ${meta.category}  **EDM uses:** ${meta.edm}`,
        '',
        jsdoc ? `## TSDoc\n\n${jsdoc}` : '',
        props ? `## Props\n\n\`\`\`ts\n${props}\n\`\`\`` : '',
        routing.length > 0 ? `## Signal Routing\n\n${routing.map((l) => `  ${l}`).join('\n')}` : '',
        backendNodes.length > 0 ? `## Backend Nodes Used\n\n${backendNodes.map((n) => `- \`${n}\``).join('\n')}` : '',
        `## Factory\n\n\`${factoryName ?? 'unknown'}(context, props?)\``,
      ].filter(Boolean)

      return { content: [{ type: 'text', text: sections.join('\n\n') }] }
    }

    // List all — optionally filtered by category
    const files = readdirSync(EFFECTS_DIR)
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
      .sort()

    const lines = files.map((f) => {
      const name = f.replace('.ts', '')
      const meta = EFFECT_META[name] ?? { category: 'unknown', desc: '', edm: '' }
      if (category !== 'all' && meta.category !== category) return null
      return `**${name}** (${meta.category}) — ${meta.desc}`
    }).filter(Boolean)

    const grouped = {}
    files.forEach((f) => {
      const name = f.replace('.ts', '')
      const meta = EFFECT_META[name] ?? { category: 'other', desc: '', edm: '' }
      if (category !== 'all' && meta.category !== category) return
      if (!grouped[meta.category]) grouped[meta.category] = []
      grouped[meta.category].push(`  - \`${name}\` — ${meta.desc}`)
    })

    const output = Object.entries(grouped).map(([cat, items]) => `### ${cat}\n${items.join('\n')}`).join('\n\n')

    return { content: [{ type: 'text', text: `# @score/effects Catalog\n\nImport: \`import { createDelay } from '@score/effects'\`\n\n${output}\n\nUse \`effect_catalog({ effect: "name" })\` for full detail on any effect.` }] }
  },
}

// ─── Tool: signal_flow ────────────────────────────────────────────────

const PACKAGE_DIRS = {
  effects: join(SCORE_ROOT, 'packages', 'effects', 'src'),
  mixer:   join(SCORE_ROOT, 'packages', 'mixer', 'src'),
  components: join(SCORE_ROOT, 'packages', 'components', 'src'),
  modulation: join(SCORE_ROOT, 'packages', 'modulation', 'src'),
}

const findComponentFile = (name) => {
  for (const [pkg, dir] of Object.entries(PACKAGE_DIRS)) {
    const path = join(dir, `${name}.ts`)
    if (existsSync(path)) return { path, pkg }
    // Try without create prefix
    const noCreate = name.replace(/^create/, '').toLowerCase()
    const altPath = join(dir, `${noCreate}.ts`)
    if (existsSync(altPath)) return { path: altPath, pkg }
  }
  return null
}

const signalFlow = {
  name: 'signal_flow',
  description: 'Trace the audio signal routing for a component — shows how nodes connect, which nodes sit in the signal path, and where input/output are. Works for effects, mixer channels, instruments, and modulation.',
  inputSchema: {
    component: z.string()
      .describe('Component name: effect (e.g. "delay", "reverb"), mixer (e.g. "channel", "mixer"), or instrument (e.g. "kick", "synth"). Case-insensitive.'),
  },
  handler: async ({ component }) => {
    const name = component.toLowerCase()
    const found = findComponentFile(name)

    if (!found) {
      return { content: [{ type: 'text', text: `Component "${component}" not found.\n\nSearched in: effects, mixer, components, modulation.\nTry: delay, reverb, compressor, channel, mixer, kick, synth, chorus, lfo` }] }
    }

    const content = readFile(found.path)
    if (!content) return { content: [{ type: 'text', text: `Could not read ${found.path}` }] }

    const routing = extractRouting(content)
    const backendNodes = extractBackendNodes(content)

    // Extract all .connect() calls for a comprehensive flow diagram
    const connectCalls = content.split('\n')
      .map((l) => l.trim())
      .filter((l) => l.match(/^\w+\.connect\(\w+\)/) || l.startsWith('// Route') || l.startsWith('// Feedback'))

    // Find what the component returns (output node)
    const connectMethod = content.match(/connect:\s*\(destination[^)]*\)\s*=>\s*\{[^}]*?(\w+)\.connect\(destination\)/s)
    const outputNode = connectMethod?.[1] ?? 'unknown'

    // Find input — usually first node created or inputGain
    const inputMatch = content.match(/const (\w*(?:input|in)\w*)\s*=\s*context\.create/)
    const inputNode = inputMatch?.[1] ?? 'first created node'

    const sections = [
      `# Signal Flow — ${name} (${found.pkg})`,
      '',
      `**Input node:** \`${inputNode}\`  **Output node:** \`${outputNode}\``,
      '',
      '## Routing',
      connectCalls.length > 0
        ? connectCalls.map((l) => `  ${l}`).join('\n')
        : '  (no explicit routing — single-node component)',
      '',
      '## Backend Nodes',
      backendNodes.map((n) => `- \`${n}\``).join('\n') || '  none',
    ]

    return { content: [{ type: 'text', text: sections.join('\n') }] }
  },
}

// ─── Tool: backend_nodes ─────────────────────────────────────────────

const WEB_AUDIO_MAP = {
  BackendOscillatorNode:   'OscillatorNode',
  BackendGainNode:         'GainNode',
  BackendNoiseNode:        'AudioWorkletNode (custom)',
  BackendBufferSourceNode: 'AudioBufferSourceNode',
  BackendFilterNode:       'BiquadFilterNode',
  BackendDelayNode:        'DelayNode',
  BackendCompressorNode:   'DynamicsCompressorNode',
  BackendWaveShaperNode:   'WaveShaperNode',
  BackendStereoPannerNode: 'StereoPannerNode',
  BackendContext:          'AudioContext',
  BackendAudioParam:       'AudioParam (modulatable wrapper)',
}

const backendNodes = {
  name: 'backend_nodes',
  description: 'List all BackendNode types in @score/core with their methods, properties, and the Web Audio API node each maps to. Score abstracts all Web Audio behind these types.',
  inputSchema: {
    node: z.string().optional()
      .describe('Specific node type (e.g. "BackendGainNode", "BackendFilterNode"). Omit to list all.'),
  },
  handler: async ({ node }) => {
    const typesPath = join(SCORE_ROOT, 'packages', 'core', 'src', 'backend', 'types.ts')
    const content = readFile(typesPath)
    if (!content) return { content: [{ type: 'text', text: 'backend/types.ts not found' }] }

    const lines = content.split('\n')

    // Parse all exported types
    const parseNodeType = (typeName) => {
      let capturing = false
      let depth = 0
      const result = []
      for (const line of lines) {
        if (!capturing && line.match(new RegExp(`export type ${typeName}\\b`))) {
          capturing = true
        }
        if (capturing) {
          result.push(line)
          depth += (line.match(/\{/g) ?? []).length
          depth -= (line.match(/\}/g) ?? []).length
          if (depth <= 0 && result.length > 1) break
        }
      }
      return result.join('\n').trim()
    }

    if (node) {
      const typeDef = parseNodeType(node)
      if (!typeDef) return { content: [{ type: 'text', text: `Type "${node}" not found in backend/types.ts` }] }
      const webAudio = WEB_AUDIO_MAP[node] ?? 'unknown'
      return { content: [{ type: 'text', text: `# ${node}\n\n**Web Audio equivalent:** \`${webAudio}\`\n\n\`\`\`ts\n${typeDef}\n\`\`\`` }] }
    }

    // List all BackendNode types
    const typeNames = [...content.matchAll(/^export type (Backend\w+)/gm)].map((m) => m[1])

    const sections = typeNames.map((name) => {
      const webAudio = WEB_AUDIO_MAP[name] ?? 'see types.ts'
      const def = parseNodeType(name)
      // Extract method names only for summary
      const methods = (def.match(/readonly (\w+):/g) ?? []).map((m) => m.replace('readonly ', '').replace(':', ''))
      return `**${name}** → \`${webAudio}\`\n  Methods: ${methods.join(', ') || 'none'}`
    })

    const also = ['OscillatorType', 'NoiseType', 'FilterType', 'OversampleType']
      .filter((t) => content.includes(`export type ${t}`))
      .map((t) => `- \`${t}\``)

    const out = [
      '# Backend Node Types — @score/core',
      '',
      'All Web Audio API access goes through these types. Never import Web Audio directly.',
      '',
      sections.join('\n\n'),
      also.length > 0 ? `\n## Value Types\n${also.join('\n')}` : '',
      '',
      `Use \`backend_nodes({ node: "BackendGainNode" })\` for full type definition.`,
    ].filter((s) => s !== undefined)

    return { content: [{ type: 'text', text: out.join('\n') }] }
  },
}

// ─── Tool: component_catalog ──────────────────────────────────────────

const CATALOG_PACKAGES = [
  { pkg: 'components',  dir: join(SCORE_ROOT, 'packages', 'components', 'src'),  kind: 'instrument' },
  { pkg: 'effects',     dir: join(SCORE_ROOT, 'packages', 'effects', 'src'),      kind: 'effect' },
  { pkg: 'mixer',       dir: join(SCORE_ROOT, 'packages', 'mixer', 'src'),        kind: 'mixer' },
  { pkg: 'modulation',  dir: join(SCORE_ROOT, 'packages', 'modulation', 'src'),   kind: 'modulation' },
]

const componentCatalog = {
  name: 'component_catalog',
  description: 'List all AudioComponents in the Score framework — instruments, effects, mixer nodes, and modulation sources. Shows factory name, Props type, and which package to import from.',
  inputSchema: {
    kind: z.enum(['all', 'instrument', 'effect', 'mixer', 'modulation'])
      .optional().default('all')
      .describe('Filter by component kind.'),
    search: z.string().optional()
      .describe('Search by component name substring.'),
  },
  handler: async ({ kind, search }) => {
    const results = []

    for (const { pkg, dir, kind: componentKind } of CATALOG_PACKAGES) {
      if (kind !== 'all' && kind !== componentKind) continue
      if (!existsSync(dir)) continue

      const files = readdirSync(dir)
        .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'chain.ts')
        .sort()

      for (const file of files) {
        const name = file.replace('.ts', '')
        if (search && !name.includes(search.toLowerCase())) continue

        const content = readFile(join(dir, file))
        if (!content) continue

        const factoryMatch = content.match(/export const (create\w+)/)
        const factory = factoryMatch?.[1]
        if (!factory) continue

        const propsMatch = content.match(/export type (\w+Props)/)
        const propsType = propsMatch?.[1]

        // Get first @example line if available
        const exampleMatch = content.match(/@example\s*\n\s*\*\s*```[^\n]*\n\s*\*\s*([^\n]+)/)
        const example = exampleMatch?.[1]?.replace(/^\*\s*/, '').trim()

        results.push({ name, kind: componentKind, pkg, factory, propsType, example })
      }
    }

    if (results.length === 0) {
      return { content: [{ type: 'text', text: `No components found${search ? ` matching "${search}"` : ''}.` }] }
    }

    // Group by kind
    const grouped = {}
    for (const r of results) {
      if (!grouped[r.kind]) grouped[r.kind] = []
      grouped[r.kind].push(r)
    }

    const sections = Object.entries(grouped).map(([k, items]) => {
      const lines = items.map((r) => {
        const props = r.propsType ? ` — props: \`${r.propsType}\`` : ''
        const ex = r.example ? `\n    Example: \`${r.example}\`` : ''
        return `  - **\`${r.factory}\`** (@score/${r.pkg})${props}${ex}`
      })
      return `### ${k}\n${lines.join('\n')}`
    })

    const importHint = `Import pattern: \`import { createDelay } from '@score/effects'\`\n`
      + `Use \`effect_catalog\` for effect details, \`signal_flow\` for routing.`

    return { content: [{ type: 'text', text: `# AudioComponent Catalog\n\n${importHint}\n\n${sections.join('\n\n')}` }] }
  },
}

// ─── Server ──────────────────────────────────────────────────────────

const tools = [effectCatalog, signalFlow, backendNodes, componentCatalog]

const createServer = () => {
  const server = new McpServer({
    name: 'score-audio',
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
  process.stderr.write(`score-audio MCP error: ${err}\n`)
  process.exit(1)
})
