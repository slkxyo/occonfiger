import { describe, expect, it } from 'vitest'
import { loadBuiltinSchema } from './builtin'
import { validateConfig } from './validate'

describe('validateConfig', () => {
  it('loads the bundled schema', () => {
    const schema = loadBuiltinSchema() as { $defs?: unknown }
    expect(schema.$defs).toBeDefined()
  })

  it('accepts an empty object', () => {
    expect(validateConfig({}).valid).toBe(true)
  })

  it('tolerates unknown and legacy top-level keys', () => {
    // 顶层与 opencode V2 一致地宽容：未知/废弃字段只警告不拒绝
    expect(validateConfig({ totally_unknown: 1 }).valid).toBe(true)
    expect(validateConfig({ plugin: ['a'] }).valid).toBe(true)
    expect(validateConfig({ permission: { '*': 'allow' } }).valid).toBe(true)
  })

  it('accepts the V2 update field', () => {
    expect(validateConfig({ update: 'disable' }).valid).toBe(true)
    expect(validateConfig({ update: 'notify' }).valid).toBe(true)
    expect(validateConfig({ update: 'auto' }).valid).toBe(true)
  })

  it('rejects an invalid update value', () => {
    expect(validateConfig({ update: 'manual' }).valid).toBe(false)
  })

  it('still validates known top-level fields by type', () => {
    expect(validateConfig({ snapshots: 'yes' }).valid).toBe(false)
    expect(validateConfig({ permissions: 'allow' }).valid).toBe(false)
  })

  it('accepts a V2 mcp.servers structure', () => {
    expect(
      validateConfig({
        mcp: { servers: { exa: { type: 'remote', url: 'https://x' } } }
      }).valid
    ).toBe(true)
  })

  it('rejects V1 flat mcp structure (mcp internals stay strict)', () => {
    expect(validateConfig({ mcp: { exa: { type: 'remote', url: 'https://x' } } }).valid).toBe(false)
  })

  it('accepts a V2 plugins array with object entries', () => {
    expect(validateConfig({ plugins: ['a', { package: 'b', options: { x: 1 } }] }).valid).toBe(true)
  })

  it('accepts V2 permissions array', () => {
    expect(
      validateConfig({ permissions: [{ action: '*', resource: '*', effect: 'ask' }] }).valid
    ).toBe(true)
  })
})
