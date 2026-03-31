import { useRef, useEffect, useCallback, memo } from 'react'
/* eslint-disable
   @typescript-eslint/no-unsafe-assignment,
   @typescript-eslint/no-unsafe-call,
   @typescript-eslint/no-unsafe-member-access,
   @typescript-eslint/no-redundant-type-constituents,
   @typescript-eslint/no-deprecated
*/
// Monaco editor integration — type-unsafe member access is unavoidable because
// @monaco-editor/react's Monaco type resolves at runtime, not statically.
import MonacoEditor, { type OnMount, type Monaco }  from '@monaco-editor/react'
import type { editor as MonacoEditorNS }            from 'monaco-editor'
import { SCORE_DSL_TYPES }                          from '../../types/score-dsl-types.js'
import type { InlineHighlight }                     from './CodeHighlight.js'

// ── Types ──────────────────────────────────────────────────────────────────────

export type EditorDecoration = {
  readonly startLine:  number   // 1-based
  readonly endLine:    number   // 1-based, inclusive
  readonly className:  string   // CSS class name for the decoration
  readonly isWholeLine?: boolean
}

/**
 * t330 — Line range for a Strudl-style block highlight.
 * The full `const <name> = <Factory>(…)` block including chain continuations.
 */
export type BlockHighlight = {
  /** 1-based start line (Monaco convention). */
  readonly startLine: number
  /** 1-based end line (Monaco convention), inclusive. */
  readonly endLine:   number
}

/** One step badge to overlay on an instrument line in the editor. */
export type StepBadge = {
  /** 1-based line number in the current code. */
  readonly line:  number
  /** 0-based current step within this track's pattern. */
  readonly step:  number
  /** Total steps in this track's pattern. */
  readonly total: number
}

type Props = {
  readonly value:       string
  readonly onChange:    (code: string) => void
  /** Called when user presses Ctrl+Enter / Cmd+Enter. */
  readonly onEval:      () => void
  /** Called each step tick — provides per-step decorations (beat highlighting). */
  readonly decorations?: ReadonlyArray<EditorDecoration>
  /**
   * Per-track step badges — displayed at the end of each instrument line
   * as a `STEP/TOTAL` pill. Updated on every engine:tick tick.
   */
  readonly stepBadges?:  ReadonlyArray<StepBadge>
  /**
   * t220 — Whether import lines are visible in the editor.
   * When `false`, the leading import block is folded (collapsed) in Monaco.
   * Defaults to `true` (imports visible).
   * Auto-inject of real imports on fold is deferred until the DSL chain API lands.
   */
  readonly importsVisible?: boolean
  /**
   * t330 — Strudl-style block highlights — full `const <name> = <Factory>` block
   * ranges to flash on each engine step. Each highlight fades over ~200 ms via a
   * CSS keyframe animation. The parent recomputes this array on every step tick.
   */
  readonly blockHighlights?: ReadonlyArray<BlockHighlight>
  /**
   * Inline character-level highlights — targets the euclidean arg (`4` in
   * `Kick808(4)`) or the active element in `.pattern([...])`. Updated on every
   * engine step tick; only active (hitting) tracks produce a highlight.
   */
  readonly inlineHighlights?: ReadonlyArray<InlineHighlight>
}

// ── Score DSL Token Provider ───────────────────────────────────────────────────

/**
 * Register Score DSL tokens and theme contributions into Monaco.
 * Called once when the editor mounts. Idempotent — no-op if already registered.
 */
const registerScoreDslLanguage = (monaco: Monaco): void => {
  // Avoid double-registration
  const existing = monaco.languages.getLanguages().find((l: { id: string }) => l.id === 'score-dsl')
  if (existing) return

  monaco.languages.register({ id: 'score-dsl', extensions: ['.score.ts'], aliases: ['Score DSL'] })

  // Token provider — extends TypeScript lexer with Score DSL keywords
  monaco.languages.setMonarchTokensProvider('score-dsl', {
    defaultToken: '',
    tokenPostfix: '.ts',

    keywords: [
      'Song', 'Track',
      // Instruments
      'Kick', 'Snare', 'HiHat', 'Synth', 'Sample', 'Theremin', 'Sax', 'Arp',
      'Kick808', 'Kick909', 'Snare909', 'HiHat808', 'SubSynth', 'FMSynth',
      // Effects
      'Reverb', 'Delay', 'Filter', 'Distortion', 'Chorus', 'Phaser', 'Flanger',
      'Compressor', 'Limiter', 'EQ', 'Saturation', 'AutoPan', 'BitCrusher',
      'StereoWidener', 'Gate', 'Sidechain', 'MultibandCompressor',
    ],

    typeKeywords: ['const', 'export', 'default', 'import', 'from', 'type'],

    operators: ['=>', ':', ',', '.', '(', ')', '[', ']', '{', '}', '='],

    symbols: /[=><!~?:&|+\-*/^%]+/,

    tokenizer: {
      root: [
        // Score DSL keywords — instruments and structure
        [/\b(Song|Track|Kick|Snare|HiHat|Synth|Sample|Theremin|Sax|Arp|Kick808|Kick909|Snare909|HiHat808|SubSynth|FMSynth)\b/, 'keyword.score-instrument'],
        // Effects keywords
        [/\b(Reverb|Delay|Filter|Distortion|Chorus|Phaser|Flanger|Compressor|Limiter|EQ|Saturation|AutoPan|BitCrusher|StereoWidener|Gate|Sidechain|MultibandCompressor)\b/, 'keyword.score-effect'],
        // import/export
        [/\b(import|export|default|from|const|type)\b/, 'keyword'],
        // Note strings: 'C4', 'E3', 'A#2' etc.
        [/'[A-G][#b]?[0-9]'/, 'string.note'],
        // Numbers
        [/\d+\.?\d*/, 'number'],
        // Strings
        [/'[^']*'/, 'string'],
        [/"[^"]*"/, 'string'],
        // Comments
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        // Whitespace
        { include: '@whitespace' },
      ],
      comment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
      whitespace: [
        [/[ \t\r\n]+/, 'white'],
      ],
    },
  })

  // Score-dark theme — extends vs-dark with Score DSL token colours
  monaco.editor.defineTheme('score-dark', {
    base:    'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword.score-instrument', foreground: '4a8fff', fontStyle: 'bold' },
      { token: 'keyword.score-effect',     foreground: '8866cc', fontStyle: 'italic' },
      { token: 'string.note',              foreground: '88cc66' },
      { token: 'number',                   foreground: 'b5cea8' },
      { token: 'comment',                  foreground: '4a4a52', fontStyle: 'italic' },
      { token: 'string',                   foreground: 'ce9178' },
      { token: 'keyword',                  foreground: '569cd6' },
    ],
    colors: {
      'editor.background':          '#080809',
      'editor.foreground':          '#c8d8f8',
      'editorLineNumber.foreground': '#2a3040',
      'editorLineNumber.activeForeground': '#4a6080',
      'editor.lineHighlightBackground':   '#111115',
      'editorGutter.background':    '#080809',
      'editor.selectionBackground': '#1a3060',
      'editor.inactiveSelectionBackground': '#0f1e3c',
      'editorCursor.foreground':    '#4a8fff',
      'editorIndentGuide.background1': '#1e1e22',
      'scrollbarSlider.background': '#1e1e2288',
    },
  })
}

// ── Decoration CSS injection (once) ───────────────────────────────────────────

const cssState = { injected: false }

const injectDecorationCss = (): void => {
  if (cssState.injected) return
  cssState.injected = true
  const style = document.createElement('style')
  style.textContent = `
    /* Beat highlight — active track line during playback */
    .score-beat-active {
      background: rgba(74, 143, 255, 0.07) !important;
      border-left: 2px solid rgba(74, 143, 255, 0.4) !important;
    }
    /* Block highlight — no-op. Whole-line highlight is disabled; only inline token
       outlines are used. Classes kept so deltaDecorations calls don't error. */
    .score-block-active-a,
    .score-block-active-b {}
    /* Inline step highlight — Strudl-style box around the active token.
       Single stable class (no -a/-b flip) so there is no frame gap where
       nothing is applied — that gap was causing the highlight to vanish in
       screenshots. box-shadow used instead of outline (outline is clipped by
       Monaco overflow:hidden line containers). */
    .score-inline-active {
      background: rgba(255, 255, 255, 0.18);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9);
      border-radius: 2px;
    }
    /* Step badge — inline content widget gutter marker */
    .score-step-badge {
      display: inline-block;
      background: rgba(74, 143, 255, 0.15);
      color: #4a8fff;
      font-size: 9px;
      font-family: monospace;
      padding: 0 3px;
      border-radius: 2px;
      margin-right: 4px;
      vertical-align: middle;
      opacity: 0.8;
    }
  `
  document.head.appendChild(style)
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Standalone Monaco-based code editor for Score Studio Live Code mode.
 *
 * Wraps `@monaco-editor/react` with Score DSL token provider, `score-dark`
 * theme, and beat-highlighting decoration infrastructure.
 *
 * Signal path for beat highlighting:
 *   engine:tick → LiveCode.currentStep → getActiveLines() → decorations prop
 *   → CodeEditorPanel → editor.deltaDecorations()
 *
 * @param value       - Current code string (controlled).
 * @param onChange    - Called on every keystroke with new code string.
 * @param onEval      - Called when user presses Ctrl+Enter / Cmd+Enter.
 * @param decorations - Array of line decorations to apply (beat highlighting).
 *
 * @example
 * ```tsx
 * <CodeEditorPanel
 *   value={code}
 *   onChange={setCode}
 *   onEval={onEval}
 *   decorations={activeLineDecorations}
 * />
 * ```
 */
const CodeEditorPanelInner = ({ value, onChange, onEval, decorations, stepBadges, importsVisible = true, blockHighlights, inlineHighlights }: Props) => {
  const editorRef            = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null)
  const containerRef         = useRef<HTMLDivElement>(null)
  const decorationsRef       = useRef<string[]>([])
  const stepBadgesRef        = useRef<string[]>([])
  const blockHighlightsRef   = useRef<string[]>([])
  // t330 — flip between -a and -b on every tick so the CSS animation restarts
  const blockFlipRef         = useRef(false)
  const inlineHighlightsRef  = useRef<string[]>([])
  const monacoRef            = useRef<Monaco | null>(null)

  // Pass explicit dimensions from ResizeObserver — avoids a layout() no-arg race before reflow.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry || !editorRef.current) return
      const { width, height } = entry.contentRect
      editorRef.current.layout({ width: Math.floor(width), height: Math.floor(height) })
    })
    observer.observe(el)
    return () => { observer.disconnect() }
  }, [])

  useEffect(() => {
    const ed     = editorRef.current
    const monaco = monacoRef.current
    if (!ed || !monaco) return

    const model = ed.getModel()
    if (!model) return

    const newDecorations = (decorations ?? []).map(d => ({
      range: new monaco.Range(d.startLine, 1, d.endLine, 1),
      options: {
        isWholeLine:        d.isWholeLine ?? true,
        className:          d.className,
        overviewRulerLane:  monaco.editor.OverviewRulerLane.Left,
        overviewRulerColor: 'rgba(74,143,255,0.3)',
      },
    }))

    decorationsRef.current = ed.deltaDecorations(decorationsRef.current, newDecorations)
  }, [decorations])

  // t219 — step badges: inline `STEP/TOTAL` pill after each active instrument line
  useEffect(() => {
    const ed     = editorRef.current
    const monaco = monacoRef.current
    if (!ed || !monaco) return

    const model = ed.getModel()
    if (!model) return

    const newBadges = (stepBadges ?? []).map(b => ({
      range: new monaco.Range(b.line, 1, b.line, 1),
      options: {
        after: {
          content:         ` ${String(b.step + 1)}/${String(b.total)}`,
          inlineClassName: 'score-step-badge',
        },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    }))

    stepBadgesRef.current = ed.deltaDecorations(stepBadgesRef.current, newBadges)
  }, [stepBadges])

  // t330 — block highlight flash: full instrument block glows on each step tick
  useEffect(() => {
    const ed     = editorRef.current
    const monaco = monacoRef.current
    if (!ed || !monaco) return

    const model = ed.getModel()
    if (!model) return

    blockFlipRef.current = !blockFlipRef.current
    const className = blockFlipRef.current ? 'score-block-active-a' : 'score-block-active-b'

    const newBlocks = (blockHighlights ?? []).map(b => ({
      range: new monaco.Range(b.startLine, 1, b.endLine, 1),
      options: {
        isWholeLine: true,
        className,
        stickiness:  monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    }))

    blockHighlightsRef.current = ed.deltaDecorations(blockHighlightsRef.current, newBlocks)
  }, [blockHighlights])

  useEffect(() => {
    const ed     = editorRef.current
    const monaco = monacoRef.current
    if (!ed || !monaco) return

    const model = ed.getModel()
    if (!model) return

    const newInline = (inlineHighlights ?? []).map(h => ({
      range: new monaco.Range(h.line, h.startCol, h.line, h.endCol),
      options: {
        className: 'score-inline-active',
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    }))

    inlineHighlightsRef.current = ed.deltaDecorations(inlineHighlightsRef.current, newInline)
  }, [inlineHighlights])

  // t220 — fold / unfold the leading import block when importsVisible changes
  useEffect(() => {
    const ed = editorRef.current
    if (!ed) return
    if (importsVisible) {
      // Unfold line 1 (import block)
      ed.trigger('t220', 'editor.unfold', { selectionLines: [1] })
    } else {
      // Fold line 1 — collapses the contiguous import block at the top
      ed.trigger('t220', 'editor.fold', { selectionLines: [1] })
    }
  }, [importsVisible])

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current  = editor
    monacoRef.current  = monaco

    registerScoreDslLanguage(monaco)
    injectDecorationCss()

    monaco.editor.setTheme('score-dark')

    // ── @score/dsl type stub — loads Score DSL ambient declarations into the
    // TypeScript language service for full IntelliSense: completions, hover
    // docs, and error underlines on unknown Score symbols (Phase 13v).
    // URI matches the module specifier so `import { X } from '@score/dsl'` resolves.
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      SCORE_DSL_TYPES,
      'file:///node_modules/@score/dsl/index.d.ts',
    )

    // Permissive TS config — score song files are plain ESM, not strict TS projects.
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target:                  monaco.languages.typescript.ScriptTarget.ESNext,
      module:                  monaco.languages.typescript.ModuleKind.ESNext,
      allowNonTsExtensions:    true,
      noEmit:                  true,
      strict:                  false,
      noImplicitAny:           false,
      skipLibCheck:            true,
    })

    // Suppress lib-level diagnostics that are noise in the song sandbox:
    //   2307 — Cannot find module '@score/dsl' (module not on TS path)
    //   2580 — Cannot find name 'process' (Node.js global not in browser lib)
    // Semantic + syntax validation remain enabled for real user-code errors.
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation:   false,
      diagnosticCodesToIgnore: [2307, 2580],
    })

    // Ctrl+Enter / Cmd+Enter → onEval
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => { onEval() },
    )

    // Focus editor on mount
    editor.focus()

    // Apply initial import fold state after model is ready
    if (!importsVisible) {
      // Small delay lets Monaco finish building fold regions before we trigger fold
      window.setTimeout(() => {
        editor.trigger('t220', 'editor.fold', { selectionLines: [1] })
      }, 150)
    }
  }, [onEval, importsVisible])

  const handleChange = useCallback((val: string | undefined) => {
    onChange(val ?? '')
  }, [onChange])

  return (
    <div ref={containerRef} style={{ height: '100%' }}>
      <MonacoEditor
        height="100%"
        language="typescript"
        theme="score-dark"
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          fontSize:              12.8,
          fontFamily:            "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          lineHeight:            1.65 * 12.8,
          minimap:               { enabled: false },
          scrollBeyondLastLine:  false,
          wordWrap:              'on',
          tabSize:               2,
          insertSpaces:          true,
          renderLineHighlight:   'line',
          cursorBlinking:        'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding:               { top: 12, bottom: 12 },
          overviewRulerLanes:    1,
          scrollbar: {
            verticalScrollbarSize:   6,
            horizontalScrollbarSize: 6,
          },
          // Folding enabled so import block can be collapsed via the Imports toggle (t220).
          // The fold icon is hidden via CSS — folding: true is required for editor.fold() to work.
          folding:               true,
          showFoldingControls:   'never',
          renderWhitespace:      'none',
          guides:                { indentation: false },
        }}
      />
    </div>
  )
}

export const CodeEditorPanel = memo(CodeEditorPanelInner)
