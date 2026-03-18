import { describe, it, expect } from 'vitest'
import { createLorenz } from '../../src/chaos/lorenz.js'

describe('createLorenz', () => {
  it('creates an instance with default params', () => {
    const lorenz = createLorenz()
    expect(lorenz).toBeDefined()
    expect(typeof lorenz.next).toBe('function')
    expect(typeof lorenz.reset).toBe('function')
  })

  it('initial state is { x: 0.1, y: 0, z: 0 }', () => {
    const lorenz = createLorenz()
    expect(lorenz.state).toEqual({ x: 0.1, y: 0, z: 0 })
  })

  it('next() returns an object with x, y, z', () => {
    const lorenz = createLorenz()
    const s = lorenz.next()
    expect(s).toHaveProperty('x')
    expect(s).toHaveProperty('y')
    expect(s).toHaveProperty('z')
    expect(typeof s.x).toBe('number')
    expect(typeof s.y).toBe('number')
    expect(typeof s.z).toBe('number')
  })

  it('state changes after next()', () => {
    const lorenz = createLorenz()
    const before = lorenz.state
    lorenz.next()
    const after = lorenz.state
    expect(after).not.toEqual(before)
  })

  it('reset() restores initial state', () => {
    const lorenz = createLorenz()
    const initial = lorenz.state
    lorenz.next()
    lorenz.next()
    lorenz.reset()
    expect(lorenz.state).toEqual(initial)
  })

  it('multiple steps produce different values', () => {
    const lorenz = createLorenz()
    const s1 = lorenz.next()
    const s2 = lorenz.next()
    const s3 = lorenz.next()
    expect(s1).not.toEqual(s2)
    expect(s2).not.toEqual(s3)
  })

  it('custom params change the trajectory', () => {
    const lorenz1 = createLorenz()
    const lorenz2 = createLorenz({ sigma: 5, rho: 10, beta: 1 })
    lorenz1.next()
    lorenz2.next()
    expect(lorenz1.state).not.toEqual(lorenz2.state)
  })

  it('accepts custom dt in next()', () => {
    const lorenz1 = createLorenz()
    const lorenz2 = createLorenz()
    lorenz1.next(0.01)
    lorenz2.next(0.001)
    expect(lorenz1.state).not.toEqual(lorenz2.state)
  })

  it('state getter returns a copy (mutation does not affect internal state)', () => {
    const lorenz = createLorenz()
    const s = lorenz.state
    s.x = 999
    expect(lorenz.state.x).not.toBe(999)
  })

  it('next() returns a copy (mutation does not affect internal state)', () => {
    const lorenz = createLorenz()
    const s = lorenz.next()
    s.x = 999
    expect(lorenz.state.x).not.toBe(999)
  })
})
