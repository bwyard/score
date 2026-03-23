// ── Types ──────────────────────────────────────────────────────────────────────

type Props = {
  /** Whether the editor strip is currently visible (affects canvas width). */
  readonly editorVisible: boolean
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  root: {
    flex:            1,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    background:      '#050506',
    overflow:        'hidden',
    position:        'relative' as const,
  },
  placeholder: {
    display:        'flex',
    flexDirection:  'column' as const,
    alignItems:     'center',
    gap:            '0.75rem',
    color:          '#1e2a3a',
    fontFamily:     "'JetBrains Mono', 'Fira Code', monospace",
    userSelect:     'none' as const,
    pointerEvents:  'none' as const,
  },
  label: {
    fontSize:      '0.7rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color:         '#1e2a3a',
  },
  sublabel: {
    fontSize:  '0.6rem',
    color:     '#141c26',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Performance Mode visual canvas — placeholder for Phase 13d `@score/visuals` wiring.
 *
 * Fills the right 70% of Performance Mode. When `@score/visuals` lands, the
 * visual theme renderer replaces the placeholder content; this component keeps
 * the canvas container, sizing, and IPC subscriptions.
 *
 * @param editorVisible - Whether the left editor strip is shown (reserved for
 *   future responsive sizing of the canvas area).
 */
export const PerformanceCanvas = ({ editorVisible: _editorVisible }: Props) => (
  <div style={styles.root}>
    <div style={styles.placeholder}>
      <span style={styles.label}>Visual scene</span>
      <span style={styles.sublabel}>@score/visuals — Phase 13d</span>
    </div>
  </div>
)
