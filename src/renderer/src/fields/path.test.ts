import { describe, expect, it } from 'vitest'
import { deleteAt, getAt, setAt } from './path'

describe('path utils', () => {
  it('reads nested values', () => {
    expect(getAt({ a: { b: 1 } }, ['a', 'b'])).toBe(1)
    expect(getAt({ a: 1 }, ['a', 'b'])).toBeUndefined()
  })

  it('creates missing objects on set', () => {
    const root: Record<string, unknown> = {}
    setAt(root, ['a', 'b'], 2)
    expect(root).toEqual({ a: { b: 2 } })
  })

  it('deletes and prunes empty parents', () => {
    const root: Record<string, unknown> = { a: { b: 1 } }
    deleteAt(root, ['a', 'b'])
    expect(root).toEqual({})
  })
})
