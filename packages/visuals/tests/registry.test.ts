// registry.test.ts — Theme and annotation registry tests

import { describe, it, expect, beforeEach } from 'vitest'
import {
  defineTheme,
  registerTheme,
  getTheme,
  listThemes,
  resolveTheme,
  defineAnnotationSource,
  registerAnnotationSource,
  getAnnotationSource,
} from '../src/registry.js'
import type { VisualThemeBundle, ThemeConfig } from '../src/app-theme.js'
import type { AudioVisualState, VisualSceneDescriptor } from '../src/types.js'
import { darkPulseAppTheme } from '../src/app-theme.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeScene = (): VisualSceneDescriptor => ({
  _type:      'VisualSceneDescriptor',
  background: '#000',
  layers:     [],
})

const makeBundle = (name: string): VisualThemeBundle => ({
  name,
  appTheme:    darkPulseAppTheme,
  canvasTheme: () => makeScene(),
})


// ── defineTheme ───────────────────────────────────────────────────────────────

describe('defineTheme', () => {
  it('is identity — returns the same bundle', () => {
    const bundle = makeBundle('test-identity')
    expect(defineTheme(bundle)).toBe(bundle)
  })
})

// ── registerTheme / getTheme ──────────────────────────────────────────────────

describe('registerTheme / getTheme', () => {
  it('round-trips a registered bundle', () => {
    const bundle = makeBundle('test-roundtrip')
    registerTheme(bundle)
    expect(getTheme('test-roundtrip')).toBe(bundle)
  })

  it('throws ScoreError on unknown name', () => {
    expect(() => getTheme('__nonexistent__')).toThrow('__nonexistent__')
  })

  it('throws ScoreError with the unknown name in the message', () => {
    expect(() => getTheme('__bad__')).toThrow('__bad__')
  })

  it('overwrites an existing registration', () => {
    const v1 = makeBundle('test-overwrite')
    const v2 = makeBundle('test-overwrite')
    registerTheme(v1)
    registerTheme(v2)
    expect(getTheme('test-overwrite')).toBe(v2)
  })
})

// ── listThemes ────────────────────────────────────────────────────────────────

describe('listThemes', () => {
  it('returns a non-empty array after registration', () => {
    registerTheme(makeBundle('test-list-1'))
    registerTheme(makeBundle('test-list-2'))
    expect(listThemes().length).toBeGreaterThan(0)
  })

  it('includes a registered name', () => {
    registerTheme(makeBundle('test-list-check'))
    expect(listThemes()).toContain('test-list-check')
  })
})

// ── resolveTheme ──────────────────────────────────────────────────────────────

describe('resolveTheme', () => {
  beforeEach(() => {
    registerTheme(makeBundle('resolve-global'))
    registerTheme(makeBundle('resolve-perf'))
  })

  it('returns the mode override when set', () => {
    const config: ThemeConfig = {
      global: 'resolve-global',
      modes:  { performance: 'resolve-perf' },
    }
    const bundle = resolveTheme(config, 'performance')
    expect(bundle.name).toBe('resolve-perf')
  })

  it('falls back to global when mode is not set', () => {
    const config: ThemeConfig = {
      global: 'resolve-global',
    }
    const bundle = resolveTheme(config, 'live-code')
    expect(bundle.name).toBe('resolve-global')
  })

  it('falls back to global when mode is undefined in map', () => {
    const config: ThemeConfig = {
      global: 'resolve-global',
      modes:  { performance: 'resolve-perf' },
    }
    const bundle = resolveTheme(config, 'produce')
    expect(bundle.name).toBe('resolve-global')
  })

  it('throws ScoreError when mode override name is not registered', () => {
    const config: ThemeConfig = {
      global: 'resolve-global',
      modes:  { performance: '__missing__' },
    }
    expect(() => resolveTheme(config, 'performance')).toThrow('__missing__')
  })

  it('throws ScoreError when global name is not registered', () => {
    const config: ThemeConfig = { global: '__also_missing__' }
    expect(() => resolveTheme(config, 'live-code')).toThrow('__also_missing__')
  })
})

// ── defineAnnotationSource ────────────────────────────────────────────────────

describe('defineAnnotationSource', () => {
  it('is identity — returns the same function', () => {
    const fn = () => []
    expect(defineAnnotationSource(fn)).toBe(fn)
  })
})

// ── registerAnnotationSource / getAnnotationSource ───────────────────────────

describe('registerAnnotationSource / getAnnotationSource', () => {
  it('round-trips a registered source', () => {
    const fn = (_state: AudioVisualState) => []
    registerAnnotationSource('test-source', fn)
    expect(getAnnotationSource('test-source')).toBe(fn)
  })

  it('throws ScoreError on unknown name', () => {
    expect(() => getAnnotationSource('__no_source__')).toThrow('__no_source__')
  })
})
