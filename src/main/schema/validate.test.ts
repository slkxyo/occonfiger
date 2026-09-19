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

  it('rejects an unknown top-level key', () => {
    const result = validateConfig({ totally_unknown: 1 })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('accepts a V2 mcp.servers structure', () => {
    expect(
      validateConfig({
        mcp: { servers: { exa: { type: 'remote', url: 'https://x' } } }
      }).valid
    ).toBe(true)
  })

  it('rejects V1 flat mcp structure', () => {
    expect(validateConfig({ mcp: { exa: { type: 'remote', url: 'https://x' } } }).valid).toBe(false)
  })

  it('accepts a V2 plugins array with object entries', () => {
    expect(
      validateConfig({ plugins: ['a', { package: 'b', options: { x: 1 } }] }).valid
    ).toBe(true)
  })

  it('rejects V1 singular plugin field', () => {
    expect(validateConfig({ plugin: ['a'] }).valid).toBe(false)
  })

  it('accepts V2 permissions array', () => {
    expect(
      validateConfig({ permissions: [{ action: '*', resource: '*', effect: 'ask' }] }).valid
    ).toBe(true)
  })

  it('rejects V1 grouped permission object', () => {
    expect(validateConfig({ permission: { '*': 'allow' } }).valid).toBe(false)
  })
})
