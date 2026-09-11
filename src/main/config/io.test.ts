import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { readConfig, readRaw, writeConfig } from './io'

const dirs: string[] = []
function tmpFile(name = 'opencode.jsonc'): string {
  const dir = mkdtempSync(join(tmpdir(), 'occ-'))
  dirs.push(dir)
  return join(dir, name)
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('config io', () => {
  it('returns empty object when file is missing', () => {
    expect(readConfig(tmpFile())).toEqual({ data: {} })
  })

  it('parses jsonc with comments and trailing commas', () => {
    const file = tmpFile()
    writeFileSync(file, '{\n  // comment\n  "model": "a/b",\n}\n')
    expect(readConfig(file)).toEqual({ data: { model: 'a/b' } })
  })

  it('reports a parse error instead of silently returning empty', () => {
    const file = tmpFile()
    writeFileSync(file, '{ "a": }')
    const result = readConfig(file)
    expect(result.parseError).toBeDefined()
    expect(result.parseError).toContain('解析失败')
  })

  it('keeps the readable part of a partially corrupted file', () => {
    const file = tmpFile()
    writeFileSync(file, '{ "model": "a/b", "broken": }')
    const result = readConfig(file)
    expect(result.parseError).toBeDefined()
    expect(result.data).toEqual({ model: 'a/b' })
  })

  it('writes pretty json that round-trips', () => {
    const file = tmpFile('opencode.json')
    writeConfig(file, { model: 'a/b', permission: { edit: 'deny' } })
    expect(readConfig(file).data).toEqual({ model: 'a/b', permission: { edit: 'deny' } })
    expect(readFileSync(file, 'utf8')).toContain('\n  "model"')
  })

  it('preserves unknown fields across a read-modify-write round-trip', () => {
    const file = tmpFile()
    writeConfig(file, {
      model: 'a/b',
      mode: 'build',
      reference: { alias: { path: './x.md' } },
      totally_unknown: [1, 2, 3],
      permission: { edit: 'deny' }
    })
    const { data } = readConfig(file)
    data.model = 'c/d'
    writeConfig(file, data)
    const after = readConfig(file).data
    expect(after).toEqual({
      model: 'c/d',
      mode: 'build',
      reference: { alias: { path: './x.md' } },
      totally_unknown: [1, 2, 3],
      permission: { edit: 'deny' }
    })
  })

  it('returns raw text', () => {
    const file = tmpFile()
    writeFileSync(file, '{ "a": 1 }')
    expect(readRaw(file)).toBe('{ "a": 1 }')
    expect(readRaw(tmpFile())).toBeNull()
  })
})
