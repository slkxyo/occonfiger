import { describe, expect, it } from 'vitest'
import { resolvePaths } from './paths'

describe('resolvePaths', () => {
  it('prefers XDG env vars', () => {
    const p = resolvePaths(
      { XDG_CONFIG_HOME: '/x/cfg', XDG_DATA_HOME: '/x/data', HOME: '/home/u' },
      () => false
    )
    expect(p.configDir).toBe('/x/cfg/opencode')
    expect(p.dataDir).toBe('/x/data/opencode')
    expect(p.authFile).toBe('/x/data/opencode/auth.json')
  })

  it('falls back to HOME defaults', () => {
    const p = resolvePaths({ HOME: '/home/u' }, () => false)
    expect(p.configDir).toBe('/home/u/.config/opencode')
    expect(p.dataDir).toBe('/home/u/.local/share/opencode')
  })

  it('picks existing jsonc over json', () => {
    const p = resolvePaths({ HOME: '/home/u' }, (file) => file.endsWith('opencode.jsonc'))
    expect(p.configFile).toBe('/home/u/.config/opencode/opencode.jsonc')
  })

  it('defaults to json when neither exists', () => {
    const p = resolvePaths({ HOME: '/home/u' }, () => false)
    expect(p.configFile).toBe('/home/u/.config/opencode/opencode.json')
  })
})
