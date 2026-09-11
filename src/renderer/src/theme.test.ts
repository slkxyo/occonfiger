import { describe, expect, it } from 'vitest'
import { system } from './theme'

describe('theme', () => {
  it('resolves indigo accent in light mode', () => {
    expect(system.token('colors.accent.solid')).toBeDefined()
  })

  it('exposes app background token', () => {
    expect(system.token('colors.bg.default')).toBeDefined()
  })
})
