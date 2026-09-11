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
    expect(readConfig(tmpFile())).toEqual({})
  })

  it('parses jsonc with comments and trailing commas', () => {
    const file = tmpFile()
    writeFileSync(file, '{\n  // comment\n  "model": "a/b",\n}\n')
    expect(readConfig(file)).toEqual({ model: 'a/b' })
  })

  it('writes pretty json that round-trips', () => {
    const file = tmpFile('opencode.json')
    writeConfig(file, { model: 'a/b', permission: { edit: 'deny' } })
    expect(readConfig(file)).toEqual({ model: 'a/b', permission: { edit: 'deny' } })
    expect(readFileSync(file, 'utf8')).toContain('\n  "model"')
  })

  it('returns raw text', () => {
    const file = tmpFile()
    writeFileSync(file, '{ "a": 1 }')
    expect(readRaw(file)).toBe('{ "a": 1 }')
    expect(readRaw(tmpFile())).toBeNull()
  })
})
