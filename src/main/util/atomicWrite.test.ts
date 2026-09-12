import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { writeFileAtomic } from './atomicWrite'

const dirs: string[] = []
function tmpDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'occ-atomic-'))
  dirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('writeFileAtomic', () => {
  it('creates parent directories and writes content', () => {
    const dir = tmpDir()
    const file = join(dir, 'nested', 'file.txt')
    writeFileAtomic(file, 'hello')
    expect(readFileSync(file, 'utf8')).toBe('hello')
  })

  it('leaves no temporary files behind', () => {
    const dir = tmpDir()
    writeFileAtomic(join(dir, 'a.txt'), 'x')
    expect(readdirSync(dir)).toEqual(['a.txt'])
  })
})
