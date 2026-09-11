import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { migrateConfig } from './migrate'

describe('migrateConfig', () => {
  let dir = ''

  function tempDir(): string {
    dir = mkdtempSync(join(tmpdir(), 'ocmigrate-'))
    return dir
  }

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = ''
  })

  it('renames json to jsonc when only json exists', () => {
    const d = tempDir()
    writeFileSync(join(d, 'opencode.json'), '{"model":"a/b"}')
    migrateConfig(d)
    expect(readFileSync(join(d, 'opencode.jsonc'), 'utf8')).toBe('{"model":"a/b"}')
    expect(existsSync(join(d, 'opencode.json'))).toBe(false)
  })

  it('deep merges with jsonc winning and deletes json', () => {
    const d = tempDir()
    writeFileSync(join(d, 'opencode.jsonc'), '{"model":"jsonc/m","shared":{"a":1}}')
    writeFileSync(
      join(d, 'opencode.json'),
      '{"model":"json/m","shared":{"a":2,"b":3},"extra":true}'
    )
    migrateConfig(d)
    const merged = JSON.parse(readFileSync(join(d, 'opencode.jsonc'), 'utf8'))
    expect(merged).toEqual({ model: 'jsonc/m', shared: { a: 1, b: 3 }, extra: true })
    expect(existsSync(join(d, 'opencode.json'))).toBe(false)
  })

  it('keeps jsonc untouched when only jsonc exists', () => {
    const d = tempDir()
    writeFileSync(join(d, 'opencode.jsonc'), '{"model":"a/b"}')
    migrateConfig(d)
    expect(readFileSync(join(d, 'opencode.jsonc'), 'utf8')).toBe('{"model":"a/b"}')
  })

  it('does nothing when neither exists', () => {
    const d = tempDir()
    expect(() => migrateConfig(d)).not.toThrow()
  })
})
