import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  deleteManagedFile,
  listManagedFiles,
  readManagedFileContent,
  skillContentPath,
  skillPath,
  writeManagedFileContent
} from './managedFiles'

const dirs: string[] = []
function tmpDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'occ-files-'))
  dirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('managedFiles', () => {
  it('rejects unsafe names to prevent path traversal', () => {
    const dir = tmpDir()
    for (const name of ['../evil', 'a/b', '..', '', '.', 'a\\b']) {
      expect(() => skillPath(dir, name)).toThrow('非法的名称')
      expect(() => skillContentPath(dir, name)).toThrow('非法的名称')
    }
  })

  it('lists only directories and skips unreadable entries', () => {
    const dir = tmpDir()
    mkdirSync(join(dir, 'skills', 'a'), { recursive: true })
    mkdirSync(join(dir, 'skills', 'b'), { recursive: true })
    writeFileSync(join(dir, 'skills', 'note.txt'), 'x', 'utf8')
    symlinkSync(join(dir, 'skills', 'missing-target'), join(dir, 'skills', 'broken'))
    expect(
      listManagedFiles(dir)
        .map((f) => f.name)
        .sort()
    ).toEqual(['a', 'b'])
  })

  it('writes and reads SKILL.md content', () => {
    const dir = tmpDir()
    writeManagedFileContent(dir, 'my-skill', '内容')
    expect(existsSync(join(dir, 'skills', 'my-skill', 'SKILL.md'))).toBe(true)
    expect(readManagedFileContent(dir, 'my-skill')).toBe('内容')
  })

  it('returns an empty string for missing content', () => {
    expect(readManagedFileContent(tmpDir(), 'missing')).toBe('')
  })

  it('deletes a skill folder', () => {
    const dir = tmpDir()
    writeManagedFileContent(dir, 'my-skill', '内容')
    deleteManagedFile(dir, 'my-skill')
    expect(listManagedFiles(dir)).toEqual([])
  })
})
