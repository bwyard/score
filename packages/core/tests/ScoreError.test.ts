import { describe, it, expect } from 'vitest'
import { ScoreError } from '../src/errors/ScoreError.js'

describe('ScoreError', () => {
  it('creates an error with the correct name', () => {
    const error = ScoreError('test message')
    expect(error.name).toBe('ScoreError')
    expect(error.message).toBe('test message')
    expect(error).toBeInstanceOf(Error)
  })

  it('includes context when provided', () => {
    const error = ScoreError('bad value', { received: 42, fix: 'use a string' })
    expect(error.context.received).toBe(42)
    expect(error.context.fix).toBe('use a string')
  })

  it('defaults context to empty object', () => {
    const error = ScoreError('no context')
    expect(error.context).toEqual({})
  })
})
