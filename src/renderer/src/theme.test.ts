import { describe, expect, it } from 'vitest'
import { accentTokens, system } from './theme'

describe('theme', () => {
  it('resolves indigo accent in light mode', () => {
    expect(system.token('colors.accent.solid')).toBeDefined()
  })

  it('exposes app background token', () => {
    expect(system.token('colors.bg.default')).toBeDefined()
  })

  it('exposes the full accent palette needed by selected states', () => {
    const keys = ['solid', 'contrast', 'fg', 'muted', 'subtle', 'emphasized', 'focusRing']
    for (const key of keys) {
      expect(system.token(`colors.accent.${key}`)).toBeDefined()
    }
    expect(accentTokens.solid.value.base).toBe('#4F46E5')
    expect(accentTokens.solid.value._dark).toBe('#818CF8')
    expect(accentTokens.fg.value.base).toBe('#4338CA')
    expect(accentTokens.subtle.value.base).toBe('#E0E7FF')
    expect(accentTokens.emphasized.value._dark).toBe('#3730A3')
    expect(accentTokens.focusRing.value._dark).toBe('#818CF8')
  })
})
