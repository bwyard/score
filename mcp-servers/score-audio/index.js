#!/usr/bin/env node

// score-audio MCP — Audio domain intelligence for AI-assisted composition and debugging
// Tools: effect_catalog, signal_flow, backend_nodes, component_catalog, instrument_source

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

    // Special case: effects chain — structural explanation, not static connect() calls
    if (name === 'chain' || content.includes('createEffectsChain')) {
      const exampleMatch = content.match(/@example[\s\S]*?```ts\s*([\s\S]*?)```/m)
      const example = exampleMatch?.[1]?.trim() ?? ''
      const text = [
        '# Signal Flow — createEffectsChain (effects)',
        '',
        '**Pattern:** Series wiring — each effect feeds the next in array order.',
        '',
        '## Routing',
        '```',
        'inputGain → effect[0].input → effect[0]',
        '         → effect[1].input → effect[1]',
        '         → ...             → effect[n]',
        '         → outputGain      → destination',
        '```',
        '',
        '**Empty chain:** `inputGain → outputGain` (passthrough)',
        '',
        '## Notes',
        '- Each effect must expose an `input: BackendNode` property so the chain can connect to it',
        '- `getEffect(index)` retrieves any effect at runtime for parameter changes',
        '- Routing is established at construction time — effects array is fixed after creation',
        '',
        example ? `## Example\n\`\`\`ts\n${example}\n\`\`\`` : '',
      ].filter(Boolean)
      return { content: [{ type: 'text', text: text.join('\n') }] }
    }

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

        // Match both PascalCase instruments (Kick, Synth) and camelCase factories (createDelay)
        const factoryMatch = content.match(/export const ([A-Z]\w+|create\w+)\s*=/)
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

    const importHint = `Import pattern: \`import { Kick, Synth } from '@score/components'\` | \`import { createDelay } from '@score/effects'\`\n`
      + `Use \`effect_catalog\` for effect details, \`signal_flow\` for routing, \`instrument_source\` for full source.`

    return { content: [{ type: 'text', text: `# AudioComponent Catalog\n\n${importHint}\n\n${sections.join('\n\n')}` }] }
  },
}

// ─── Tool: instrument_source ──────────────────────────────────────────

const ALL_SOURCE_PACKAGES = [
  { pkg: 'components',  dir: join(SCORE_ROOT, 'packages', 'components', 'src'),  kind: 'instrument' },
  { pkg: 'effects',     dir: join(SCORE_ROOT, 'packages', 'effects', 'src'),      kind: 'effect' },
  { pkg: 'mixer',       dir: join(SCORE_ROOT, 'packages', 'mixer', 'src'),        kind: 'mixer' },
  { pkg: 'modulation',  dir: join(SCORE_ROOT, 'packages', 'modulation', 'src'),   kind: 'modulation' },
  { pkg: 'musical',     dir: join(SCORE_ROOT, 'packages', 'musical', 'src'),      kind: 'musical' },
  { pkg: 'math',        dir: join(SCORE_ROOT, 'packages', 'math', 'src'),         kind: 'math' },
  { pkg: 'pattern',     dir: join(SCORE_ROOT, 'packages', 'pattern', 'src'),      kind: 'pattern' },
]

const instrumentSource = {
  name: 'instrument_source',
  description: 'Read the full TypeScript source of any instrument, effect, or audio module. Use this to understand exactly how a component is implemented before writing a new one — see the oscillator setup, filter routing, envelope scheduling, and factory function pattern.',
  inputSchema: {
    name: z.string()
      .describe('File name without extension (e.g. "kick", "synth", "delay", "lfo", "describe"). Case-insensitive.'),
    package: z.string().optional()
      .describe('Package to search in (e.g. "components", "effects", "modulation", "musical", "math"). Omit to search all.'),
  },
  handler: async ({ name, package: pkgFilter }) => {
    const target = name.toLowerCase().replace(/\.ts$/, '')

    const candidates = []

    for (const { pkg, dir, kind } of ALL_SOURCE_PACKAGES) {
      if (pkgFilter && pkg !== pkgFilter) continue
      if (!existsSync(dir)) continue

      const files = readdirSync(dir).filter((f) => f.endsWith('.ts'))
      for (const file of files) {
        const base = file.replace('.ts', '').toLowerCase()
        if (base === target || base.includes(target)) {
          candidates.push({ pkg, kind, file, path: join(dir, file) })
        }
      }
    }

    if (candidates.length === 0) {
      // Build list of all available names
      const available = []
      for (const { pkg, dir } of ALL_SOURCE_PACKAGES) {
        if (!existsSync(dir)) continue
        readdirSync(dir)
          .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
          .forEach((f) => available.push(`${f.replace('.ts', '')} (@score/${pkg})`))
      }
      return { content: [{ type: 'text', text: `"${name}" not found.\n\nAvailable:\n${available.map((a) => `  - ${a}`).join('\n')}` }] }
    }

    if (candidates.length === 1) {
      const { pkg, kind, file, path } = candidates[0]
      const content = readFile(path)
      return { content: [{ type: 'text', text: `# @score/${pkg}/${file} (${kind})\n\n\`\`\`ts\n${content}\n\`\`\`` }] }
    }

    // Multiple matches — show list and ask to narrow
    if (candidates.length <= 3) {
      const parts = candidates.map(({ pkg, kind, file, path }) => {
        const content = readFile(path)
        return `# @score/${pkg}/${file} (${kind})\n\n\`\`\`ts\n${content}\n\`\`\``
      })
      return { content: [{ type: 'text', text: parts.join('\n\n---\n\n') }] }
    }

    const list = candidates.map(({ pkg, file }) => `  - ${file} (@score/${pkg})`).join('\n')
    return { content: [{ type: 'text', text: `Multiple matches for "${name}":\n${list}\n\nNarrow with the \`package\` param.` }] }
  },
}

// ─── Tool: ui_component_catalog ───────────────────────────────────────
// Stub — Phase 13f (Monaco IntelliSense + Playwright E2E prep)

const uiComponentCatalog = {
  name: 'ui_component_catalog',
  description: 'List all GUI React components in packages/gui — panels, visualizers, controls, and layouts. Shows component name, props interface, and which screen it appears on. Stub: Phase 13f (Monaco integration) not yet implemented.',
  inputSchema: {
    kind: z.enum(['all', 'panel', 'visualizer', 'control', 'layout'])
      .optional().default('all')
      .describe('Filter by UI component kind.'),
  },
  handler: async ({ kind }) => {
    const guiSrc = join(SCORE_ROOT, 'packages', 'gui', 'src')
    const note = '> **Stub** — Phase 13f (Monaco IDE integration) not yet implemented.\n> Run `instrument_source` for audio component source instead.\n\n'

    if (!existsSync(guiSrc)) {
      return { content: [{ type: 'text', text: `${note}GUI source not found at packages/gui/src. Phase 13 GUI scaffold may not be on this branch.` }] }
    }

    // Walk src for React component files
    const findTsx = (dir, acc = []) => {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) findTsx(full, acc)
        else if (entry.name.endsWith('.tsx') || (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts'))) acc.push(full)
      }
      return acc
    }

    const files = findTsx(guiSrc)
    if (files.length === 0) {
      return { content: [{ type: 'text', text: `${note}No GUI components found yet. Phase 13 work lives on feat/phase-11b-live-code-visualizer and later branches.` }] }
    }

    const components = files.map((f) => {
      const rel = f.replace(guiSrc + '/', '').replace(/\\/g, '/')
      const content = readFile(f) ?? ''
      const propsMatch = content.match(/(?:type|interface)\s+(\w+Props)\s*[={]/)
      const defaultExport = content.match(/export default (\w+)/)
      const namedExport = content.match(/export const (\w+)\s*[=:]/)
      const name = defaultExport?.[1] ?? namedExport?.[1] ?? rel.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '')
      return `  - **${name}** (\`${rel}\`)${propsMatch ? ` — props: \`${propsMatch[1]}\`` : ''}`
    })

    const header = kind === 'all' ? 'all GUI components' : `GUI components (kind: ${kind})`
    return { content: [{ type: 'text', text: `# Score Studio GUI Component Catalog — ${header}\n\n${note}${components.join('\n')}` }] }
  },
}

// ─── Tool: ui_ipc_map ─────────────────────────────────────────────────
// Stub — Phase 13f (Monaco IntelliSense + Playwright E2E prep)

const uiIpcMap = {
  name: 'ui_ipc_map',
  description: 'List all IPC channels between the Electron main process and the renderer — channel name, direction, payload type, and which GUI component handles it. Stub: Phase 13f not yet implemented.',
  inputSchema: {
    direction: z.enum(['all', 'main-to-renderer', 'renderer-to-main'])
      .optional().default('all')
      .describe('Filter by IPC message direction.'),
  },
  handler: async ({ direction }) => {
    const note = '> **Stub** — Phase 13f IPC map not yet fully implemented.\n> Known channels extracted from source where available.\n\n'

    // Known IPC channels from current codebase — sourced from packages/gui src
    const KNOWN_CHANNELS = [
      { channel: 'transport:play',        dir: 'renderer-to-main', payload: 'void',                      desc: 'Start engine playback' },
      { channel: 'transport:stop',        dir: 'renderer-to-main', payload: 'void',                      desc: 'Stop engine playback' },
      { channel: 'transport:bpm-set',     dir: 'renderer-to-main', payload: '{ bpm: number }',           desc: 'Set BPM; also triggers codePatcher' },
      { channel: 'engine:eval',           dir: 'renderer-to-main', payload: '{ code: string }',          desc: 'Evaluate live code string in engine' },
      { channel: 'engine:patch',          dir: 'renderer-to-main', payload: 'PatchPayload',               desc: 'Per-track volume/mute without re-eval' },
      { channel: 'engine:state',          dir: 'main-to-renderer', payload: 'EngineState',                desc: 'Current engine state snapshot' },
      { channel: 'engine:step',           dir: 'main-to-renderer', payload: '{ step: number, total: number }', desc: 'Sequencer step tick for punchcard cursor' },
      { channel: 'engine:notes',          dir: 'main-to-renderer', payload: 'NoteEvent[]',                desc: 'MIDI note events for piano roll (eval-time)' },
      { channel: 'engine:waveform',       dir: 'main-to-renderer', payload: 'Float32Array',               desc: 'Waveform samples for oscilloscope panel' },
      { channel: 'engine:spectrum',       dir: 'main-to-renderer', payload: 'Float32Array',               desc: 'FFT magnitude data for spectrum panel' },
      { channel: 'engine:error',          dir: 'main-to-renderer', payload: '{ message: string }',        desc: 'Eval or engine error to show in REPL' },
    ]

    const filtered = direction === 'all' ? KNOWN_CHANNELS : KNOWN_CHANNELS.filter((c) => c.dir === direction)

    const lines = filtered.map((c) => {
      const arrow = c.dir === 'renderer-to-main' ? 'renderer → main' : 'main → renderer'
      return `  - **\`${c.channel}\`** (${arrow})\n    Payload: \`${c.payload}\` — ${c.desc}`
    })

    const dirLabel = direction === 'all' ? 'all channels' : direction
    return { content: [{ type: 'text', text: `# Score Studio IPC Map — ${dirLabel}\n\n${note}${lines.join('\n')}` }] }
  },
}

// ─── Tool: ui_layout_map ──────────────────────────────────────────────
// Stub — Phase 13f prep — based on wireframes in score/docs/design/wireframes/

const uiLayoutMap = {
  name: 'ui_layout_map',
  description: 'Describe the Score Studio screen layout — which panels appear on each screen, their default positions, and the panel system rules. Based on wireframe specs in docs/design/wireframes/.',
  inputSchema: {
    screen: z.enum(['all', 'splash', 'live-code', 'step-sequencer', 'mixer', 'arrangement'])
      .optional().default('all')
      .describe('Which screen layout to describe.'),
  },
  handler: async ({ screen }) => {
    const wireframeDir = join(SCORE_ROOT, 'docs', 'design', 'wireframes')
    const note = screen === 'all' ? '' : ''

    // Try to read the wireframe spec files
    const screenFiles = {
      splash:          join(wireframeDir, 'screens', '01-splash.md'),
      'live-code':     join(wireframeDir, 'screens', '02-live-code.md'),
      'step-sequencer':join(wireframeDir, 'screens', '03-step-sequencer.md'),
      mixer:           join(wireframeDir, 'screens', '04-mixer.md'),
      arrangement:     join(wireframeDir, 'screens', '05-arrangement.md'),
    }

    if (screen !== 'all') {
      const filePath = screenFiles[screen]
      const content = filePath ? readFile(filePath) : null
      if (content) return { content: [{ type: 'text', text: content }] }
      return { content: [{ type: 'text', text: `Wireframe spec for "${screen}" not found at ${filePath ?? 'unknown path'}.\nCheck docs/design/wireframes/screens/ for available specs.` }] }
    }

    // All screens — list what exists
    const results = []
    const readmeContent = readFile(join(wireframeDir, 'README.md'))
    if (readmeContent) {
      results.push(`# Score Studio Layout Map\n\n${readmeContent}`)
    } else {
      const available = existsSync(wireframeDir)
        ? readdirSync(wireframeDir, { withFileTypes: true })
            .filter((e) => e.isFile() || e.isDirectory())
            .map((e) => `  - ${e.name}`)
            .join('\n')
        : '  (wireframes directory not found)'
      results.push(`# Score Studio Layout Map\n\n> **Stub** — wireframe specs may be on a different branch.\n\nExpected: \`docs/design/wireframes/\`\n\nFound:\n${available}`)
    }

    return { content: [{ type: 'text', text: results.join('\n\n') }] }
  },
}

// ─── Tool: ui_mode_features ───────────────────────────────────────────
// Stub — Phase 13f prep

const uiModeFeatures = {
  name: 'ui_mode_features',
  description: 'List features, controls, and capabilities available in each Score Studio mode (Live Code, Step Sequencer, Mixer, Arrangement). Shows what is implemented vs planned.',
  inputSchema: {
    mode: z.enum(['all', 'live-code', 'step-sequencer', 'mixer', 'arrangement'])
      .optional().default('all')
      .describe('Which mode to describe.'),
  },
  handler: async ({ mode }) => {
    const MODES = {
      'live-code': {
        label: 'Live Code',
        status: '⚠️ In progress (Phase 13b)',
        implemented: [
          'Monaco/textarea code editor with syntax highlighting',
          '▶ Run button — eval code + start engine (or hot-swap if playing)',
          'Transport bar — BPM slider, play/stop, time display',
          'Punchcard step grid — per-track pattern visualization',
          'Oscilloscope waveform panel (floating, draggable)',
          'Spectrum analyser panel (floating, draggable)',
          'Piano roll panel — shows Synth/Arp note events',
          'Mixer channel strips — gain/mute/solo per track',
          'Reference panel — DSL cheatsheet, click-to-insert',
          'REPL console log — eval results and errors',
          'BPM slider ↔ code sync (codePatcher)',
          'Punchcard step toggle ↔ code sync',
          'Mixer volume ↔ code sync',
          'Piano roll note click ↔ code sync',
        ],
        planned: [
          'Monaco editor (replace textarea) — Phase 13f',
          'Beat-position gutter annotations (algorave-style) — t159',
          'Song file open/save — t143',
          'Play Around vs DJ Mode variants — t144',
        ],
      },
      'step-sequencer': {
        label: 'Step Sequencer',
        status: '⬜ Planned',
        implemented: [],
        planned: ['Full step sequencer mode — Phase 13 roadmap item'],
      },
      mixer: {
        label: 'Mixer',
        status: '⚠️ Partial (channel strips in Live Code)',
        implemented: ['Channel strips visible in Live Code mixer panel'],
        planned: ['Dedicated Mixer screen', 'Send/return routing UI', 'Master bus controls'],
      },
      arrangement: {
        label: 'Arrangement',
        status: '⬜ Planned',
        implemented: [],
        planned: ['Arrangement view — Phase 13 roadmap item'],
      },
    }

    const renderMode = (key, m) => {
      const impl = m.implemented.length > 0
        ? `### Implemented\n${m.implemented.map((f) => `- ✅ ${f}`).join('\n')}`
        : '### Implemented\n_Nothing yet_'
      const plan = m.planned.length > 0
        ? `### Planned\n${m.planned.map((f) => `- ⬜ ${f}`).join('\n')}`
        : ''
      return [`## ${m.label} (${m.status})`, impl, plan].filter(Boolean).join('\n\n')
    }

    if (mode !== 'all') {
      const m = MODES[mode]
      if (!m) return { content: [{ type: 'text', text: `Unknown mode: "${mode}"` }] }
      return { content: [{ type: 'text', text: renderMode(mode, m) }] }
    }

    const sections = Object.entries(MODES).map(([k, m]) => renderMode(k, m))
    return { content: [{ type: 'text', text: `# Score Studio Mode Features\n\n${sections.join('\n\n---\n\n')}` }] }
  },
}

// ─── Server ──────────────────────────────────────────────────────────

// ─── Tool: ui_accessibility_map ───────────────────────────────────────
// Stub — Phase 13f prep

const uiAccessibilityMap = {
  name: 'ui_accessibility_map',
  description: 'List keyboard shortcuts, ARIA roles, and accessibility features in Score Studio. Useful for Playwright E2E test selectors and keyboard navigation testing.',
  inputSchema: {
    category: z.enum(['all', 'shortcuts', 'aria', 'focus'])
      .optional().default('all')
      .describe('Filter by category.'),
  },
  handler: async ({ category }) => {
    const SHORTCUTS = [
      { key: 'Ctrl+Enter',       action: 'Eval code + start engine (or hot-swap)',     scope: 'Live Code editor' },
      { key: 'Ctrl+.',           action: 'Stop engine',                                scope: 'Global' },
      { key: 'Ctrl+S',           action: 'Save song file (planned)',                   scope: 'Live Code editor' },
      { key: 'Ctrl+Z',           action: 'Undo (editor)',                              scope: 'Live Code editor' },
      { key: 'Space',            action: 'Play/stop toggle (outside editor)',           scope: 'Transport' },
    ]

    const ARIA = [
      { role: 'button',          label: '▶ Run',        element: 'Run/eval button' },
      { role: 'button',          label: 'Stop',         element: 'Transport stop button' },
      { role: 'slider',          label: 'BPM',          element: 'BPM range input' },
      { role: 'textbox',         label: 'Score code',   element: 'Code editor textarea' },
      { role: 'log',             label: 'Console',      element: 'REPL console panel' },
    ]

    const note = '> **Stub** — Phase 13f (Monaco + Playwright E2E) not yet complete. Known shortcuts/ARIA from current implementation.\n\n'

    if (category === 'shortcuts' || category === 'all') {
      const rows = SHORTCUTS.map((s) => `  - **${s.key}** — ${s.action} _(${s.scope})_`)
      if (category === 'shortcuts') {
        return { content: [{ type: 'text', text: `# Keyboard Shortcuts\n\n${note}${rows.join('\n')}` }] }
      }
    }

    if (category === 'aria' || category === 'all') {
      const rows = ARIA.map((a) => `  - role=\`${a.role}\` label=\`"${a.label}"\` — ${a.element}`)
      if (category === 'aria') {
        return { content: [{ type: 'text', text: `# ARIA Map\n\n${note}${rows.join('\n')}` }] }
      }
    }

    const shortcutRows = SHORTCUTS.map((s) => `  - **${s.key}** — ${s.action} _(${s.scope})_`)
    const ariaRows = ARIA.map((a) => `  - role=\`${a.role}\` label=\`"${a.label}"\` — ${a.element}`)

    return { content: [{ type: 'text', text: `# Score Studio Accessibility Map\n\n${note}## Keyboard Shortcuts\n${shortcutRows.join('\n')}\n\n## ARIA Roles\n${ariaRows.join('\n')}` }] }
  },
}

// ─── Tool: dsl_completions ────────────────────────────────────────────
// Static IntelliSense data for Monaco editor — derived from chain.ts, modulation.ts, song.ts.
// Updated when the DSL changes; does NOT read source at runtime.

const DSL_CHAIN_METHODS = [
  // ── Pattern ──────────────────────────────────────────────────────────
  { label: 'speed',       kind: 'method', signature: 'speed(n: number): ChainablePart',                                          description: 'Speed multiplier. n>1=fast, n<1=slow, negative=reverse. n=0 throws.',         example: 'HiHat(8).speed(0.5)' },
  { label: 'slow',        kind: 'method', signature: 'slow(n: number): ChainablePart',                                           description: 'Sugar: speed(1/n) — play n times slower.',                                     example: 'Synth("saw","C3").slow(2)' },
  { label: 'fast',        kind: 'method', signature: 'fast(n: number): ChainablePart',                                           description: 'Sugar: speed(n) — play n times faster.',                                      example: 'HiHat(8).fast(2)' },
  { label: 'rev',         kind: 'method', signature: 'rev(): ChainablePart',                                                     description: 'Reverse the pattern.',                                                         example: 'Kick(4).rev()' },
  { label: 'halfTime',    kind: 'method', signature: 'halfTime(): ChainablePart',                                                description: 'Sugar: half-time feel (speed 0.5).',                                           example: 'Snare(2).halfTime()' },
  { label: 'doubleTime',  kind: 'method', signature: 'doubleTime(): ChainablePart',                                              description: 'Sugar: double-time feel (speed 2).',                                           example: 'HiHat(8).doubleTime()' },
  { label: 'tripletTime', kind: 'method', signature: 'tripletTime(): ChainablePart',                                             description: 'Sugar: triplet feel (3 against 2, speed 2/3).',                                example: 'Kick(3).tripletTime()' },
  { label: 'retrograde',  kind: 'method', signature: 'retrograde(): ChainablePart',                                              description: 'Classical term: reverse. Alias for .rev().',                                   example: 'Kick(4).retrograde()' },
  { label: 'augment',     kind: 'method', signature: 'augment(n?: number): ChainablePart',                                       description: 'Classical: lengthen by factor n (default 2). Sugar for slow(n).',              example: 'Bass303("C2").augment(2)' },
  { label: 'diminish',    kind: 'method', signature: 'diminish(n?: number): ChainablePart',                                      description: 'Classical: shorten by factor n (default 2). Sugar for fast(n).',              example: 'HiHat(4).diminish(2)' },
  { label: 'euclidean',   kind: 'method', signature: 'euclidean(hits: number, steps?: number): ChainablePart',                   description: 'Replace pattern with euclidean(hits, steps). Default steps=16.',               example: 'Kick(4).euclidean(3, 8)' },
  { label: 'shift',       kind: 'method', signature: 'shift(n: number): ChainablePart',                                          description: 'Rotate pattern n steps. Negative=shift left.',                                 example: 'Snare(2).shift(2)' },
  { label: 'invert',      kind: 'method', signature: 'invert(): ChainablePart',                                                  description: 'Flip 1s and 0s in the pattern.',                                               example: 'HiHat(8).invert()' },
  { label: 'mask',        kind: 'method', signature: 'mask(pattern: PatternInput): ChainablePart',                               description: 'Mute steps where mask=0.',                                                     example: 'Kick(4).mask([1,1,0,1])' },
  { label: 'stutter',     kind: 'method', signature: 'stutter(n: number): ChainablePart',                                        description: 'Repeat last hit n times. n=0 is a no-op.',                                     example: 'Snare(2).stutter(3)' },
  { label: 'palindrome',  kind: 'method', signature: 'palindrome(): ChainablePart',                                              description: 'Pattern + reversed pattern (exclusive center).',                               example: 'Kick(3).palindrome()' },
  { label: 'degrade',     kind: 'method', signature: 'degrade(p: number): ChainablePart',                                        description: 'Drop hits at probability p (0=keep all, 1=always silence).',                   example: 'HiHat(8).degrade(0.2)' },
  { label: 'humanize',    kind: 'method', signature: 'humanize(amt: number): ChainablePart',                                     description: 'Timing jitter in seconds.',                                                    example: 'Kick(4).humanize(0.005)' },
  { label: 'swing',       kind: 'method', signature: 'swing(amount: number): ChainablePart',                                     description: 'Swing offset on off-beats (0–1).',                                             example: 'HiHat(8).swing(0.1)' },
  { label: 'every',       kind: 'method', signature: 'every(n: number, fn: (p: number[]) => number[]): ChainablePart',           description: 'Apply fn every n cycles. fn receives current pattern.',                        example: 'Kick(4).every(4, p => p.reverse())' },
  { label: 'apply',       kind: 'method', signature: 'apply(fn: (p: number[], ctx: PatternCtx) => number[]): ChainablePart',     description: 'Custom pattern transform: (pattern, ctx) => pattern.',                         example: 'Kick(4).apply((p, ctx) => p.map(v => ctx.bar % 2 === 0 ? v : 0))' },
  { label: 'repeat',      kind: 'method', signature: 'repeat(n: number): ChainablePart',                                         description: 'Play pattern n times per cycle. n must be > 0.',                               example: 'Snare(2).repeat(2)' },
  { label: 'hits',        kind: 'method', signature: 'hits(...args: (number | { of: number })[]): ChainablePart',                description: 'Hit on specific step indices. .hits(0, 4, 8) or .hits(0, 4, { of: 14 }).',   example: 'Kick().hits(0, 4, 8, 12)' },
  { label: 'stepProb',    kind: 'method', signature: 'stepProb(probs: number[]): ChainablePart',                                 description: 'Per-step fire probability array. Engine applies with seeded PRNG.',             example: 'HiHat(8).stepProb([1,0.5,1,0.5,1,0.5,1,0.5])' },
  { label: 'stretch',     kind: 'method', signature: 'stretch(bars: number): ChainablePart',                                     description: 'Fit pattern into exactly n bars.',                                             example: 'Kick(4).stretch(2)' },
  { label: 'phase',       kind: 'method', signature: 'phase(amount: number): ChainablePart',                                     description: '0–1 offset through pattern (.phase(0.5) starts halfway).',                     example: 'Snare(2).phase(0.5)' },
  { label: 'fromBar',     kind: 'method', signature: 'fromBar(n: number): ChainablePart',                                        description: 'Start playing at bar n.',                                                      example: 'Bass303("C2").fromBar(8)' },
  { label: 'untilBar',    kind: 'method', signature: 'untilBar(n: number): ChainablePart',                                       description: 'Stop playing at bar n.',                                                       example: 'Kick(4).untilBar(32)' },
  { label: 'fadeIn',      kind: 'method', signature: 'fadeIn(bars: number): ChainablePart',                                      description: 'Fade in over n bars.',                                                         example: 'Pad("Am").fadeIn(4)' },
  { label: 'fadeOut',     kind: 'method', signature: 'fadeOut(bars: number): ChainablePart',                                     description: 'Fade out over n bars.',                                                        example: 'Pad("Am").fadeOut(4)' },
  // ── Pitch / notes ─────────────────────────────────────────────────────
  { label: 'note',        kind: 'method', signature: "note(pitch: string): ChainablePart",                                       description: "Set a single pitch, e.g. 'C3'.",                                               example: "Synth('sine').note('G3')" },
  { label: 'notes',       kind: 'method', signature: "notes(arr: (string | number)[]): ChainablePart",                           description: "Set a note/chord sequence. 'R' = rest.",                                       example: "Synth('saw','C3').notes(['C3','E3','G3'])" },
  { label: 'scale',       kind: 'method', signature: "scale(name: string, root: string): ChainablePart",                         description: 'Constrain notes to scale.',                                                    example: "Synth('saw','C3').scale('minor','Am')" },
  { label: 'pitch',       kind: 'method', signature: 'pitch(semitones: number): ChainablePart',                                  description: 'Transpose ±n semitones.',                                                      example: 'Bass303("C2").pitch(7)' },
  { label: 'octave',      kind: 'method', signature: 'octave(n: number): ChainablePart',                                         description: 'Shift octave by n (n=1 → one octave up).',                                    example: 'Synth("saw","C3").octave(-1)' },
  { label: 'glide',       kind: 'method', signature: 'glide(time: number): ChainablePart',                                       description: 'Portamento / glide time in seconds.',                                          example: 'Bass303("C2").glide(0.05)' },
  { label: 'dur',         kind: 'method', signature: 'dur(time: number): ChainablePart',                                         description: 'Note duration in seconds.',                                                    example: 'Synth("sine","C3").dur(0.25)' },
  { label: 'mapNotes',    kind: 'method', signature: 'mapNotes(fn: (notes: (string | number)[], ctx: PatternCtx) => (string | number)[]): ChainablePart', description: 'Custom note sequence transform: (notes, ctx) => notes.', example: 'Synth("saw","C3").mapNotes((notes, ctx) => notes.map(n => ctx.bar % 2 === 0 ? n : "R"))' },
  // ── Amplitude ─────────────────────────────────────────────────────────
  { label: 'volume',      kind: 'method', signature: 'volume(v: number): ChainablePart',                                         description: 'Output gain 0–1.',                                                             example: 'Kick(4).volume(0.8)' },
  { label: 'attack',      kind: 'method', signature: 'attack(s: number): ChainablePart',                                         description: 'ADSR attack in seconds.',                                                      example: 'Synth("sine","C3").attack(0.01)' },
  { label: 'decay',       kind: 'method', signature: 'decay(s: number): ChainablePart',                                          description: 'ADSR decay in seconds.',                                                       example: 'Kick808(4).decay(0.8)' },
  { label: 'sustain',     kind: 'method', signature: 'sustain(v: number): ChainablePart',                                        description: 'ADSR sustain level 0–1.',                                                      example: 'Synth("saw","C3").sustain(0.6)' },
  { label: 'release',     kind: 'method', signature: 'release(s: number): ChainablePart',                                        description: 'ADSR release in seconds.',                                                     example: 'Synth("saw","C3").release(0.3)' },
  { label: 'duckWith',    kind: 'method', signature: 'duckWith(source: string | ChainablePart, opts?: { amount?: number; attack?: number; release?: number }): ChainablePart', description: 'Duck gain when source part hits.', example: 'Bass303("C2").duckWith(kick, { amount: 0.7, release: 0.2 })' },
  { label: 'pumpWith',    kind: 'method', signature: 'pumpWith(source: string | ChainablePart, release?: number): ChainablePart', description: 'EDM pump effect — alias for .duckWith() with preset amount 0.8.',           example: 'Bass303("C2").pumpWith(kick)' },
  { label: 'swellWith',   kind: 'method', signature: 'swellWith(source: string | ChainablePart): ChainablePart',                 description: 'Rise on trigger — reverse sidechain.',                                         example: 'Pad("Am").swellWith(kick)' },
  { label: 'sidechain',   kind: 'method', signature: "sidechain(source: string | ChainablePart, opts?: { amount?: number; attack?: number; release?: number; mode?: 'duck'|'reverse' }): ChainablePart", description: 'Full sidechain control — escape hatch.', example: 'Bass303("C2").sidechain(kick, { mode: "duck", amount: 0.9 })' },
  // ── Tone ──────────────────────────────────────────────────────────────
  { label: 'filter',      kind: 'method', signature: 'filter(freq: number, q?: number): ChainablePart',                          description: 'Lowpass filter: cutoff freq (Hz) + optional resonance Q.',                    example: 'Bass303("C2").filter(800, 1.5)' },
  { label: 'eq',          kind: 'method', signature: 'eq(low: number, mid: number, high: number): ChainablePart',                description: '3-band EQ: low, mid, high in dB.',                                            example: 'Kick(4).eq(2, 0, -1)' },
  { label: 'bit',         kind: 'method', signature: 'bit(bits: number): ChainablePart',                                         description: 'Bit crusher — reduce bit depth (4–16).',                                       example: 'Snare(2).bit(8)' },
  { label: 'saturate',    kind: 'method', signature: 'saturate(amt: number): ChainablePart',                                     description: 'Overdrive / saturation warmth (0–1).',                                         example: 'Bass303("C2").saturate(0.4)' },
  // ── Space ─────────────────────────────────────────────────────────────
  { label: 'pan',         kind: 'method', signature: 'pan(v: number): ChainablePart',                                            description: 'Stereo position -1 (left) to 1 (right).',                                     example: 'HiHat(8).pan(-0.5)' },
  { label: 'widen',       kind: 'method', signature: 'widen(amt: number): ChainablePart',                                        description: 'Stereo width via StereoWidener (0–2, 1=unity).',                               example: 'Pad("Am").widen(1.5)' },
  { label: 'reverb',      kind: 'method', signature: 'reverb(wet: number, opts?: object): ChainablePart',                        description: 'Add reverb. wet=0–1.',                                                         example: 'Snare(2).reverb(0.3)' },
  { label: 'delay',       kind: 'method', signature: "delay(time: number | string, feedback?: number): ChainablePart",           description: "Add delay. time in seconds or note value ('1/8d'). feedback=0–1.",            example: "HiHat(4).delay('1/8d', 0.4)" },
  { label: 'chorus',      kind: 'method', signature: 'chorus(depth?: number): ChainablePart',                                    description: 'Chorus / ensemble detune. depth=0–1.',                                         example: 'Synth("saw","C3").chorus(0.4)' },
  { label: 'flange',      kind: 'method', signature: 'flange(depth?: number): ChainablePart',                                    description: 'Flanger sweep. depth=0–1.',                                                    example: 'Synth("saw","C3").flange(0.3)' },
  // ── Routing ───────────────────────────────────────────────────────────
  { label: 'send',        kind: 'method', signature: "send(bus: string, amount?: number): ChainablePart",                        description: 'Send to named effect bus at given amount (0–1).',                              example: "Snare(2).send('room', 0.6)" },
  { label: 'mute',        kind: 'method', signature: 'mute(): ChainablePart',                                                    description: 'Silence this part.',                                                           example: 'Kick(4).mute()' },
  { label: 'solo',        kind: 'method', signature: 'solo(): ChainablePart',                                                    description: 'Solo this part (silence all others).',                                         example: 'Bass303("C2").solo()' },
  { label: 'chokeGroup',  kind: 'method', signature: 'chokeGroup(name: string): ChainablePart',                                  description: 'Assign to choke group — hits cut each other off.',                             example: "HiHat(8).chokeGroup('hats')" },
  { label: 'layer',       kind: 'method', signature: 'layer(...parts: ChainablePart[]): ChainablePart',                          description: 'Layer additional parts under this one.',                                       example: 'Kick(4).layer(Kick808(4).volume(0.5))' },
  // ── Modulation ────────────────────────────────────────────────────────
  { label: 'tremolo',     kind: 'method', signature: 'tremolo(rate: number, depth?: number): ChainablePart',                     description: 'LFO on volume — rate Hz, depth 0–1.',                                          example: 'Pad("Am").tremolo(4, 0.6)' },
  { label: 'vibrato',     kind: 'method', signature: 'vibrato(rate: number, depth?: number): ChainablePart',                     description: 'Sine on pitch (vibrato) — rate Hz, depth Hz.',                                 example: 'Synth("sine","C3").vibrato(5, 8)' },
  { label: 'wobble',      kind: 'method', signature: 'wobble(rate: number, depth?: number): ChainablePart',                      description: 'LFO on filter cutoff (wobble / acid / dubstep) — rate Hz.',                   example: 'Bass303("C2").wobble(0.5)' },
  { label: 'autopan',     kind: 'method', signature: 'autopan(rate: number, depth?: number): ChainablePart',                     description: 'LFO on pan (stereo movement).',                                                example: 'Pad("Am").autopan(0.3)' },
  { label: 'flutter',     kind: 'method', signature: 'flutter(rate?: number): ChainablePart',                                    description: 'Fast LFO on volume (flute flutter, organ tremolo). Default rate 12 Hz.',       example: 'Synth("sine","C5").flutter(10)' },
  { label: 'breathe',     kind: 'method', signature: 'breathe(rate?: number): ChainablePart',                                    description: 'Slow LFO on volume (pad breathe). Default rate 0.3 Hz.',                      example: 'Pad("Am").breathe(0.2)' },
  { label: 'drift',       kind: 'method', signature: 'drift(amt?: number): ChainablePart',                                       description: 'OU process on pitch (analog warmth drift). Default amt 0.3.',                  example: 'Synth("saw","C3").drift(0.2)' },
  { label: 'swell',       kind: 'method', signature: 'swell(bars: number): ChainablePart',                                       description: 'Ramp on volume — swell build over n bars.',                                    example: 'Pad("Am").swell(8)' },
  { label: 'modulate',    kind: 'method', signature: 'modulate(param: string, source: ModulationDescriptor): ChainablePart',     description: 'Power escape hatch — modulate any param with any modulation source.',          example: 'Bass303("C2").modulate("filter", lfo(0.25))' },
  // ── Meta ──────────────────────────────────────────────────────────────
  { label: 'seed',        kind: 'method', signature: 'seed(n: number): ChainablePart',                                           description: 'Per-part stochastic seed — overrides song-level seed.',                       example: 'HiHat(8).degrade(0.2).seed(42)' },
  { label: 'name',        kind: 'method', signature: 'name(label: string): ChainablePart',                                       description: 'Human-readable label for GUI mixer and codePatcher.',                          example: "Kick(4).volume(0.9).name('main kick')" },
  { label: 'model',       kind: 'method', signature: "model(variant: string): ChainablePart",                                    description: "Model variant (percussion only): '808' | '909' | 'hard'.",                    example: "Kick(4).model('909')" },
]

const DSL_INSTRUMENTS = [
  { label: 'Kick',        kind: 'function', signature: "Kick(arg?: number | number[], opts?: number | { model?: '808'|'909'|'hard' }): ChainablePart",    description: "Universal kick drum. arg=euclidean hit count or explicit array. Defaults to 808-style sine kick.", example: 'Kick(4).volume(0.9)' },
  { label: 'Snare',       kind: 'function', signature: "Snare(arg?: number | number[], opts?: number | { model?: '909'|'generic' }): ChainablePart",       description: 'Universal snare. Defaults to 909-style tone+noise snare.',                                         example: 'Snare(2).volume(0.7)' },
  { label: 'HiHat',       kind: 'function', signature: "HiHat(arg?: number | number[], opts?: number | { model?: string }): HiHatChainablePart",           description: 'Hi-hat (808 model). Returns HiHatChainablePart with .open() / .closed() / .openSteps() extras.',  example: 'HiHat(8).degrade(0.2)' },
  { label: 'Kick808',     kind: 'function', signature: 'Kick808(arg?: number | number[], steps?: number): ChainablePart',                                  description: 'TR-808-style bass drum. Deep sub sine body with long pitch fall.',                                example: 'Kick808(4).decay(0.8).volume(0.85)' },
  { label: 'Kick909',     kind: 'function', signature: 'Kick909(arg?: number | number[], steps?: number): ChainablePart',                                  description: 'TR-909-style bass drum. Sine body + transient noise click. Signature of techno.',                 example: 'Kick909(4).volume(0.9)' },
  { label: 'Hihat808',    kind: 'function', signature: 'Hihat808(arg?: number | number[], steps?: number): HiHatChainablePart',                            description: 'TR-808-style hi-hat. Six-oscillator metallic noise source with bandpass filtering.',              example: 'Hihat808(8).volume(0.25)' },
  { label: 'Snare909',    kind: 'function', signature: 'Snare909(arg?: number | number[], steps?: number): ChainablePart',                                 description: 'TR-909-style snare. Pitched triangle tone + white noise body.',                                   example: 'Snare909(2).volume(0.7)' },
  { label: 'Clap',        kind: 'function', signature: 'Clap(arg?: number | number[], steps?: number): ChainablePart',                                     description: 'Clap percussion. Clap(2) = euclidean(2,16). Engine: sine burst fallback.',                        example: 'Clap(2).volume(0.6)' },
  { label: 'Crash',       kind: 'function', signature: 'Crash(arg?: number | number[], steps?: number): ChainablePart',                                    description: 'Crash cymbal. Typically one hit per bar.',                                                         example: 'Crash(1).volume(0.4)' },
  { label: 'Ride',        kind: 'function', signature: 'Ride(arg?: number | number[], steps?: number): ChainablePart',                                     description: 'Ride cymbal.',                                                                                     example: 'Ride(4).volume(0.3)' },
  { label: 'Noise',       kind: 'function', signature: 'Noise(arg?: number | number[], steps?: number): ChainablePart',                                    description: 'White noise burst, filtered.',                                                                     example: 'Noise(8).filter(4000, 2).volume(0.15)' },
  { label: 'Cowbell808',  kind: 'function', signature: 'Cowbell808(arg?: number | number[], steps?: number): ChainablePart',                               description: 'TR-808-style cowbell.',                                                                            example: 'Cowbell808(2).volume(0.5)' },
  { label: 'Conga',       kind: 'function', signature: 'Conga(arg?: number | number[], steps?: number): ChainablePart',                                    description: 'Conga drum.',                                                                                      example: 'Conga(4).volume(0.5)' },
  { label: 'Tom',         kind: 'function', signature: 'Tom(arg?: number | number[], steps?: number): ChainablePart',                                      description: 'Tom drum.',                                                                                        example: 'Tom(2).volume(0.6)' },
  { label: 'Rimshot',     kind: 'function', signature: 'Rimshot(arg?: number | number[], steps?: number): ChainablePart',                                  description: 'Rimshot. Tight, dry — often used on offbeats.',                                                   example: 'Rimshot(2).volume(0.5)' },
  { label: 'Shaker',      kind: 'function', signature: 'Shaker(arg?: number | number[], steps?: number): ChainablePart',                                   description: 'Shaker. High-frequency continuous texture.',                                                       example: 'Shaker(8).volume(0.2)' },
  { label: 'Tambourine',  kind: 'function', signature: 'Tambourine(arg?: number | number[], steps?: number): ChainablePart',                               description: 'Tambourine.',                                                                                      example: 'Tambourine(4).volume(0.3)' },
  { label: 'Woodblock',   kind: 'function', signature: 'Woodblock(arg?: number | number[], steps?: number): ChainablePart',                                description: 'Woodblock.',                                                                                       example: 'Woodblock(4).volume(0.4)' },
  { label: 'Bongo',       kind: 'function', signature: 'Bongo(arg?: number | number[], steps?: number): ChainablePart',                                    description: 'Bongo.',                                                                                           example: 'Bongo(4).volume(0.5)' },
  { label: 'Xylophone',   kind: 'function', signature: 'Xylophone(arg?: number | number[], steps?: number): ChainablePart',                               description: 'Xylophone.',                                                                                       example: 'Xylophone(4).volume(0.5)' },
  { label: 'Marimba',     kind: 'function', signature: 'Marimba(arg?: number | number[], steps?: number): ChainablePart',                                  description: 'Marimba.',                                                                                         example: 'Marimba(4).volume(0.5)' },
  { label: 'Vibraphone',  kind: 'function', signature: 'Vibraphone(arg?: number | number[], steps?: number): ChainablePart',                              description: 'Vibraphone.',                                                                                      example: 'Vibraphone(4).volume(0.5)' },
  // Melodic (melodic.ts / re-exported from index.ts)
  { label: 'Synth',       kind: 'function', signature: "Synth(wave?: 'sine'|'square'|'sawtooth'|'triangle', pitch?: string): ChainablePart",              description: "General synth. wave defaults to 'sawtooth'.",                                                     example: "Synth('saw', 'C3').notes(['C3','E3','G3'])" },
  { label: 'SubSynth',    kind: 'function', signature: 'SubSynth(pitch?: string): SubSynthPart',                                                           description: 'Analogue subtractive synth (Juno/Moog model). Returns SubSynthPart with .unison() and .detune().', example: "SubSynth('C2').detune(8).unison(2)" },
  { label: 'FMSynth',     kind: 'function', signature: 'FMSynth(pitch?: string): ChainablePart',                                                           description: '2-op FM synthesis. DX7 / Rhodes / techno lead.',                                                  example: "FMSynth('A3').ratio(2).modIndex(4)" },
  { label: 'Bass303',     kind: 'function', signature: "Bass303(pitch?: string): ChainablePart",                                                           description: "TB-303 acid bass. pitch = root note e.g. 'C2'.",                                                  example: "Bass303('C2').cutoff(400).resonance(0.8).wobble(0.5)" },
  { label: 'Arp',         kind: 'function', signature: "Arp(notes: (string|number)[], opts?: object): ChainablePart",                                      description: 'Arpeggiator. Sequences notes automatically across the pattern grid.',                               example: "Arp(['C3','E3','G3','B3']).speed(2)" },
  { label: 'Pad',         kind: 'function', signature: 'Pad(chord?: string): ChainablePart',                                                               description: 'Lush pad voice (stub — real component pending).',                                                  example: "Pad('Am').reverb(0.6).volume(0.5)" },
  { label: 'Pluck',       kind: 'function', signature: 'Pluck(pitch?: string): ChainablePart',                                                             description: 'Karplus-Strong plucked string voice (stub).',                                                      example: "Pluck('E3').volume(0.6)" },
  { label: 'Stab',        kind: 'function', signature: 'Stab(chord?: string): ChainablePart',                                                              description: 'Short sharp chord stab (stub).',                                                                   example: "Stab('Cm7').volume(0.8)" },
  { label: 'Rhodes',      kind: 'function', signature: 'Rhodes(pitch?: string): ChainablePart',                                                            description: 'Electric piano (Rhodes-style FM, stub).',                                                          example: "Rhodes('C3').volume(0.7)" },
  { label: 'Wurlitzer',   kind: 'function', signature: 'Wurlitzer(pitch?: string): ChainablePart',                                                         description: 'Wurlitzer electric piano (stub).',                                                                 example: "Wurlitzer('C3').volume(0.6)" },
  { label: 'Hammond',     kind: 'function', signature: 'Hammond(pitch?: string): ChainablePart',                                                           description: 'Hammond-style tonewheel organ (stub).',                                                            example: "Hammond('C3').volume(0.5)" },
  { label: 'SuperSaw',    kind: 'function', signature: 'SuperSaw(pitch?: string): ChainablePart',                                                          description: 'Supersaw lead — N detuned sawtooth oscillators (stub, trance / big room).',                       example: "SuperSaw('C4').detune(12).volume(0.7)" },
  { label: 'KarplusSynth',kind: 'function', signature: 'KarplusSynth(pitch?: string): ChainablePart',                                                     description: 'Karplus-Strong string synthesis (stub).',                                                          example: "KarplusSynth('A3').volume(0.6)" },
  { label: 'Theremin',    kind: 'function', signature: 'Theremin(pitch?: string): ChainablePart',                                                          description: 'Theremin-style continuous pitch voice (stub).',                                                    example: "Theremin('G4').vibrato(5, 8)" },
  { label: 'Sax',         kind: 'function', signature: 'Sax(pitch?: string): ChainablePart',                                                               description: 'Saxophone-style voice (stub).',                                                                    example: "Sax('C4').volume(0.6)" },
  { label: 'Sample',      kind: 'function', signature: 'Sample(path: string): ChainablePart',                                                              description: 'Audio sample player. path = relative path to sample file.',                                         example: "Sample('./samples/clap.wav').volume(0.7)" },
]

const DSL_MODULATION = [
  { label: 'lfo',      kind: 'function', signature: "lfo(rate?: number, depth?: number, shape?: 'sine'|'triangle'|'square'|'sawtooth'): ModulationDescriptor", description: "Low-frequency oscillator. rate=Hz (default 1), depth=0–1 (default 1), shape='sine'.", example: "Bass303('C2').modulate('filter', lfo(0.25))" },
  { label: 'sine',     kind: 'function', signature: 'sine(rate?: number, depth?: number, phaseOffset?: number): ModulationDescriptor',                         description: 'Sine wave modulation. Sugar for lfo(rate, depth, "sine"). phaseOffset in radians.',   example: "Synth('saw','C3').modulate('pitch', sine(0.1, 12))" },
  { label: 'ramp',     kind: 'function', signature: 'ramp(bars?: number, loop?: boolean): ModulationDescriptor',                                               description: 'Linear ramp 0→1 over bars (default 8). Useful for swell buildups and fade-ins.',       example: "Kick(4).modulate('volume', ramp(16))" },
  { label: 'lorenz',   kind: 'function', signature: "lorenz(opts?: { r?: number; sigma?: number; b?: number; speed?: number; axis?: 'x'|'y'|'z' }): ModulationDescriptor", description: 'Lorenz attractor — deterministic chaos, never repeats. r=28=default chaos intensity.', example: "Bass303('C2').modulate('filter', lorenz({ r: 28 }))" },
  { label: 'ou',       kind: 'function', signature: 'ou(theta?: number, sigma?: number): ModulationDescriptor',                                                description: 'Ornstein-Uhlenbeck process — smooth brownian mean-reverting drift. theta=0.3, sigma=1.', example: "Synth('saw','C3').modulate('pan', ou(0.3))" },
  { label: 'logistic', kind: 'function', signature: 'logistic(r?: number, seed?: number): ModulationDescriptor',                                               description: 'Logistic map — edge-of-chaos sequence. r=3.9=chaotic, seed=0.5.',                     example: "Kick(4).modulate('volume', logistic(3.9))" },
]

const DSL_SONG = [
  // Song() overloads
  { label: 'Song',         kind: 'function', signature: 'Song(bpm: number, parts: AnyPart[]): SongDescriptor',                                     description: 'Shorthand form: bpm + parts array. Returns SongDescriptor with chain builder.',         example: 'Song(128, [Kick(4).volume(0.9), Bass303("C2").wobble(0.5)])' },
  { label: 'Song',         kind: 'function', signature: 'Song(props: SongProps): SongDescriptor',                                                  description: 'Full props form: { bpm, tracks, seed?, key?, genre?, backend?, arrangement? }.',        example: 'Song({ bpm: 128, tracks: [kick, bass], seed: 42 })' },
  { label: 'Bus',          kind: 'function', signature: 'Bus(effects: EffectDescriptor[]): BusDescriptor',                                         description: 'Create a named effect bus for shared sends.',                                            example: "Song(128, [...]).buses({ room: Bus([Reverb({ wet: 0.8 })]) })" },
  // SongDescriptor chain methods
  { label: 'title',        kind: 'method',   signature: 'title(s: string): SongDescriptor',                                                        description: 'Song title — displayed in GUI and CLI.',                                                 example: 'Song(128, [...]).title("Midnight Acid")' },
  { label: 'key',          kind: 'method',   signature: "key(k: string): SongDescriptor",                                                          description: "Global key signature — e.g. 'Am', 'C', 'F#m'.",                                          example: 'Song(128, [...]).key("Am")' },
  { label: 'meter',        kind: 'method',   signature: "meter(sig: string): SongDescriptor",                                                      description: "Time signature — e.g. '4/4', '7/8', '3/4'. Default '4/4'.",                              example: 'Song(128, [...]).meter("6/8")' },
  { label: 'bars',         kind: 'method',   signature: 'bars(n: number): SongDescriptor',                                                         description: 'Explicit loop length in bars. Engine loops here.',                                        example: 'Song(128, [...]).bars(32)' },
  { label: 'swing',        kind: 'method',   signature: 'swing(amount: number): SongDescriptor',                                                   description: 'Global swing applied to all parts (0–1).',                                               example: 'Song(128, [...]).swing(0.1)' },
  { label: 'groove',       kind: 'method',   signature: 'groove(g: Record<string, unknown> | string): SongDescriptor',                             description: 'Global groove template (GrooveDescriptor or built-in name).',                             example: 'Song(128, [...]).groove("deep-house")' },
  { label: 'seed',         kind: 'method',   signature: 'seed(n: number): SongDescriptor',                                                         description: 'Global stochastic seed — cascades to all parts unless overridden per-part.',              example: 'Song(128, [...]).seed(42)' },
  { label: 'genre',        kind: 'method',   signature: 'genre(g: Record<string, unknown> | string): SongDescriptor',                              description: 'Genre preset — sets metadata and defaults (never constrains).',                           example: 'Song(128, [...]).genre("techno")' },
  { label: 'tempoRamp',    kind: 'method',   signature: 'tempoRamp(fromBpm: number, toBpm: number, bars: number): SongDescriptor',                  description: 'Linear tempo ramp from fromBpm to toBpm over bars bars.',                                example: 'Song(128, [...]).tempoRamp(128, 140, 32)' },
  { label: 'tempoMap',     kind: 'method',   signature: 'tempoMap(changes: TempoChange[]): SongDescriptor',                                        description: 'Full tempo automation map. Overrides .tempoRamp().',                                     example: 'Song(128, [...]).tempoMap([{ bar: 0, bpm: 128 }, { bar: 16, bpm: 140 }])' },
  { label: 'master',       kind: 'method',   signature: 'master(effects: EffectDescriptor[]): SongDescriptor',                                     description: 'Master effects chain applied to the main output.',                                       example: 'Song(128, [...]).master([Compressor(), Limiter()])' },
  { label: 'buses',        kind: 'method',   signature: 'buses(map: Record<string, BusDescriptor>): SongDescriptor',                               description: 'Declare shared effect buses for .send() routing.',                                       example: 'Song(128, [...]).buses({ room: Bus([Reverb({ wet: 0.8 })]) })' },
  { label: 'loop',         kind: 'method',   signature: 'loop(n: number): SongDescriptor',                                                         description: 'Play count. Infinity=loop forever (default). Set for render.',                           example: 'Song(128, [...]).loop(4)' },
  { label: 'click',        kind: 'method',   signature: 'click(): SongDescriptor',                                                                 description: 'Enable metronome click for monitoring / recording.',                                     example: 'Song(128, [...]).click()' },
  { label: 'logSeeds',     kind: 'method',   signature: 'logSeeds(): SongDescriptor',                                                              description: 'Store all seeds used during session with timestamps.',                                   example: 'Song(128, [...]).logSeeds()' },
  { label: 'backend',      kind: 'method',   signature: "backend(name: 'web-audio'|'scsynth'|'jack'): SongDescriptor",                             description: "Audio backend override. Default: 'web-audio'.",                                          example: 'Song(128, [...]).backend("scsynth")' },
  // Arrangement chain
  { label: 'intro',        kind: 'method',   signature: 'intro(bars: number, parts: AnyPart[]): SongDescriptor',                                   description: 'EDM intro section.',                                                                     example: 'Song(128, [...]).intro(8, [pad])' },
  { label: 'buildup',      kind: 'method',   signature: 'buildup(bars: number, parts: AnyPart[]): SongDescriptor',                                 description: 'EDM buildup section.',                                                                   example: 'Song(128, [...]).buildup(8, [kick, pad])' },
  { label: 'drop',         kind: 'method',   signature: 'drop(bars: number, parts: AnyPart[]): SongDescriptor',                                    description: 'EDM drop section.',                                                                      example: 'Song(128, [...]).drop(32, [kick, bass, pad])' },
  { label: 'breakdown',    kind: 'method',   signature: 'breakdown(bars: number, parts: AnyPart[]): SongDescriptor',                               description: 'EDM breakdown section.',                                                                 example: 'Song(128, [...]).breakdown(16, [pad])' },
  { label: 'outro',        kind: 'method',   signature: 'outro(bars: number, parts: AnyPart[]): SongDescriptor',                                   description: 'EDM outro section.',                                                                     example: 'Song(128, [...]).outro(8, [pad])' },
  { label: 'verse',        kind: 'method',   signature: 'verse(bars: number, parts: AnyPart[]): SongDescriptor',                                   description: 'Pop / rock verse section.',                                                              example: 'Song(128, [...]).verse(16, [kick, bass])' },
  { label: 'chorus',       kind: 'method',   signature: 'chorus(bars: number, parts: AnyPart[]): SongDescriptor',                                  description: 'Pop / rock chorus section.',                                                             example: 'Song(128, [...]).chorus(16, [kick, bass, lead])' },
  { label: 'bridge',       kind: 'method',   signature: 'bridge(bars: number, parts: AnyPart[]): SongDescriptor',                                  description: 'Pop / rock bridge section.',                                                             example: 'Song(128, [...]).bridge(8, [pad, lead])' },
]

const dslCompletions = {
  name: 'dsl_completions',
  description: 'Score DSL chain API completions for Monaco IntelliSense. Returns all available methods on ChainablePart, instrument factory signatures, and modulation sources. Use to power autocomplete in the Monaco editor.',
  inputSchema: {
    kind: z.enum(['all', 'chain_methods', 'instruments', 'modulation', 'song'])
      .optional().default('all')
      .describe('"chain_methods" — all ~40 methods on ChainablePart. "instruments" — all instrument factories. "modulation" — modulation sources. "song" — Song() overloads + SongDescriptor chain methods. "all" — everything.'),
  },
  handler: async ({ kind }) => {
    const sections = []

    if (kind === 'chain_methods' || kind === 'all') {
      sections.push({ kind: 'chain_methods', count: DSL_CHAIN_METHODS.length, items: DSL_CHAIN_METHODS })
    }
    if (kind === 'instruments' || kind === 'all') {
      sections.push({ kind: 'instruments', count: DSL_INSTRUMENTS.length, items: DSL_INSTRUMENTS })
    }
    if (kind === 'modulation' || kind === 'all') {
      sections.push({ kind: 'modulation', count: DSL_MODULATION.length, items: DSL_MODULATION })
    }
    if (kind === 'song' || kind === 'all') {
      sections.push({ kind: 'song', count: DSL_SONG.length, items: DSL_SONG })
    }

    const result = kind === 'all'
      ? { kind: 'all', sections }
      : sections[0]

    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  },
}

const tools = [effectCatalog, signalFlow, backendNodes, componentCatalog, instrumentSource, uiComponentCatalog, uiIpcMap, uiLayoutMap, uiModeFeatures, uiAccessibilityMap, dslCompletions]

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
