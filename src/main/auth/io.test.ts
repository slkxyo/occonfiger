import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { deleteCredential, listCredentials, updateCredentialKey } from './io'

const dirs: string[] = []
function tmpFile(): string {
  const dir = mkdtempSync(join(tmpdir(), 'occ-auth-'))
  dirs.push(dir)
  return join(dir, 'auth.json')
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('auth io', () => {
  it('lists credentials without leaking full key', () => {
    const file = tmpFile()
    writeFileSync(file, JSON.stringify({ deepseek: { type: 'api', key: 'sk-1234567890abcd' } }))
    expect(listCredentials(file)).toEqual([{ provider: 'deepseek', type: 'api', keyTail: 'abcd' }])
  })

  it('updates an api key and keeps 0600', () => {
    const file = tmpFile()
    writeFileSync(file, JSON.stringify({ deepseek: { type: 'api', key: 'old' } }))
    updateCredentialKey(file, 'deepseek', 'newkey')
    expect(listCredentials(file)[0].keyTail).toBe('wkey')
    expect(statSync(file).mode & 0o777).toBe(0o600)
  })

  it('deletes a credential', () => {
    const file = tmpFile()
    writeFileSync(
      file,
      JSON.stringify({ a: { type: 'api', key: '1' }, b: { type: 'api', key: '2' } })
    )
    deleteCredential(file, 'a')
    expect(listCredentials(file).map((c) => c.provider)).toEqual(['b'])
  })

  it('returns empty list when file missing', () => {
    expect(listCredentials(tmpFile())).toEqual([])
  })

  it('throws on a corrupted auth file instead of wiping it', () => {
    const file = tmpFile()
    writeFileSync(file, 'not json')
    expect(() => listCredentials(file)).toThrow()
    expect(() => deleteCredential(file, 'a')).toThrow()
    expect(readFileSync(file, 'utf8')).toBe('not json')
  })

  it('refuses to delete a missing provider', () => {
    const file = tmpFile()
    writeFileSync(file, JSON.stringify({ a: { type: 'api', key: '1' } }))
    expect(() => deleteCredential(file, 'missing')).toThrow('不存在')
  })
})
