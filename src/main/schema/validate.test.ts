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

  it('rejects a wrong type for logLevel', () => {
    expect(validateConfig({ logLevel: 123 }).valid).toBe(false)
  })
})
