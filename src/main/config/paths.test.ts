import { describe, expect, it } from 'vitest'
import { resolvePaths } from './paths'

describe('resolvePaths', () => {
  it('prefers XDG env vars', () => {
    const p = resolvePaths({
      XDG_CONFIG_HOME: '/x/cfg',
      XDG_DATA_HOME: '/x/data',
      HOME: '/home/u'
    })
    expect(p.configDir).toBe('/x/cfg/opencode')
    expect(p.dataDir).toBe('/x/data/opencode')
    expect(p.authFile).toBe('/x/data/opencode/auth.json')
  })

  it('falls back to HOME defaults', () => {
    const p = resolvePaths({ HOME: '/home/u' })
    expect(p.configDir).toBe('/home/u/.config/opencode')
    expect(p.dataDir).toBe('/home/u/.local/share/opencode')
  })

  it('always resolves config file to jsonc', () => {
    const p = resolvePaths({ HOME: '/home/u' })
    expect(p.configFile).toBe('/home/u/.config/opencode/opencode.jsonc')
  })

  it('resolves the global AGENTS.md prompt file', () => {
    const p = resolvePaths({ HOME: '/home/u' })
    expect(p.agentsFile).toBe('/home/u/.config/opencode/AGENTS.md')
  })

  it('resolves the app-side disabled plugins file', () => {
    const p = resolvePaths({ HOME: '/home/u' })
    expect(p.disabledPluginsFile).toBe('/home/u/.config/opencode/.occonfiger/disabled-plugins.json')
  })
})
