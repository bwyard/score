// SongExportValidator — Zod schema validation of the exported Song object
// Runs AFTER the song file executes, before passing to the engine
// Catches structural problems regardless of how the song was built

import { z } from 'zod'
import { ScoreError } from '@score/core'

// Minimal schemas — validate structure, not deep audio props
const SectionDefinitionSchema = z.object({
  _type: z.literal('SectionDefinition'),
  sectionType: z.enum(['intro', 'buildup', 'drop', 'breakdown', 'outro']),
  bars: z.number().positive(),
  tracks: z.array(z.unknown()),
})

const SongDefinitionSchema = z.object({
  _type: z.literal('SongDefinition'),
  bpm: z.number().min(20).max(400),
  tracks: z.array(z.unknown()).min(1),
  arrangement: z.array(SectionDefinitionSchema),
  key: z.string().optional(),
  genre: z.string().optional(),
  backend: z.string().optional(),
})

export const validateSongExport = (exported: unknown): void => {
  const result = SongDefinitionSchema.safeParse(exported)
  if (!result.success) {
    const issues = result.error.issues
      .map(i => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw ScoreError('Song export is not a valid Song definition', {
      fix: `Make sure your file ends with: export default Song({ bpm, tracks: [...] })\n\nIssues:\n${issues}`,
      received: typeof exported === 'object' && exported !== null
        ? `Object with keys: ${Object.keys(exported).join(', ')}`
        : typeof exported,
      docs: 'https://score.dev/docs/dsl/song',
    })
  }
}
