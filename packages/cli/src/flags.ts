import { parseArgs } from 'node:util'

// ── Types ─────────────────────────────────────────────────────────────────────

export type FlagOptions = NonNullable<NonNullable<Parameters<typeof parseArgs>[0]>['options']>

export type ParsedFlags = {
  readonly values:     Record<string, boolean | string | string[] | undefined>
  readonly positionals: readonly string[]
}

// ── Core ──────────────────────────────────────────────────────────────────────

/**
 * Parse CLI flags for a Score command.
 *
 * Wraps Node's built-in `parseArgs` with consistent error handling:
 * - Unknown flags: print error + usage, exit 1
 * - `--help` / `-h`: print usage, exit 0
 *
 * `help` / `-h` is injected automatically — do not include it in `options`.
 *
 * @param args       - Raw arg array (from `process.argv` slice)
 * @param options    - Flag definitions (type, short alias, default)
 * @param printUsage - Called on `--help` or unknown-flag errors
 * @returns          Parsed `{ values, positionals }`
 */
export const parseFlags = (
  args: string[],
  options: FlagOptions,
  printUsage: () => void,
): ParsedFlags => {
  const allOptions: FlagOptions = {
    ...options,
    help: { type: 'boolean', short: 'h', default: false },
  }

  const handleError = (err: unknown): never => {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`Score: ${msg}\n`)
    printUsage()
    return process.exit(1)
  }

  const raw = (() => {
    try {
      return parseArgs({ args, options: allOptions, allowPositionals: true, strict: true }) as ParsedFlags
    } catch (err) {
      return handleError(err)
    }
  })()

  if (raw.values['help'] === true) {
    printUsage()
    process.exit(0)
  }

  return raw
}
