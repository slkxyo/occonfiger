import { describe, expect, it } from 'vitest'
import { IPC } from './ipc-channels'

describe('ipc channels', () => {
  it('exposes unique, well-formed channel names for every action', () => {
    const values = Object.values(IPC)
    expect(values.length).toBeGreaterThan(0)
    expect(new Set(values).size).toBe(values.length)
    for (const value of values) {
      expect(value).toMatch(/^[a-z]+:[a-zA-Z]+$/)
    }
  })
})
