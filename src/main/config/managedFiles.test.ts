import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createManagedFile,
  deleteManagedFile,
  listManagedFiles,
  managedDirFor,
  managedFilePath,
  readManagedFileContent,
  renameManagedFile,
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
  it('maps kinds to directories', () => {
    expect(managedDirFor('/cfg', 'agent')).toBe('/cfg/agent')
    expect(managedDirFor('/cfg', 'command')).toBe('/cfg/command')
    expect(managedDirFor('/cfg', 'skill')).toBe('/cfg/skills')
  })

  it('rejects unsafe kinds to prevent path traversal', () => {
    const dir = tmpDir()
    for (const kind of ['../../..', 'agents', 'agent/../../', '', '..']) {
      expect(() => managedDirFor(dir, kind as 'agent')).toThrow('非法的类型')
    }
  })

  it('rejects unsafe names in managedFilePath', () => {
    const dir = tmpDir()
    expect(managedFilePath(dir, 'command', 'deploy')).toBe(join(dir, 'command', 'deploy.md'))
    expect(managedFilePath(dir, 'skill', 'my-skill')).toBe(join(dir, 'skills', 'my-skill'))
    expect(() => managedFilePath(dir, 'command', '../evil')).toThrow('非法的名称')
  })

  it('creates, lists, renames and deletes a command file', () => {
    const dir = tmpDir()
    createManagedFile(dir, 'command', 'deploy')
    expect(listManagedFiles(dir, 'command').map((f) => f.name)).toEqual(['deploy.md'])
    renameManagedFile(dir, 'command', 'deploy', 'release')
    expect(listManagedFiles(dir, 'command').map((f) => f.name)).toEqual(['release.md'])
    deleteManagedFile(dir, 'command', 'release')
    expect(listManagedFiles(dir, 'command')).toEqual([])
  })

  it('creates skill as a folder with SKILL.md', () => {
    const dir = tmpDir()
    createManagedFile(dir, 'skill', 'my-skill')
    expect(listManagedFiles(dir, 'skill').map((f) => f.name)).toEqual(['my-skill'])
  })

  it('lists pre-existing skills from the skills directory', () => {
    const dir = tmpDir()
    createManagedFile(dir, 'skill', 'existing')
    const nested = join(dir, 'skills', 'existing', 'SKILL.md')
    expect(existsSync(nested)).toBe(true)
    expect(listManagedFiles(dir, 'skill').map((f) => f.name)).toEqual(['existing'])
  })

  it('rejects unsafe names in create and writes nothing', () => {
    const dir = tmpDir()
    for (const name of ['../evil', 'a/b', '..', '', '.', 'a\\b']) {
      expect(() => createManagedFile(dir, 'command', name)).toThrow()
    }
    expect(listManagedFiles(dir, 'command')).toEqual([])
    expect(existsSync(join(dir, 'evil.md'))).toBe(false)
  })

  it('rejects unsafe names in rename and delete', () => {
    const dir = tmpDir()
    createManagedFile(dir, 'command', 'ok')
    expect(() => renameManagedFile(dir, 'command', 'ok', '../x')).toThrow()
    expect(() => renameManagedFile(dir, 'command', '../x', 'ok')).toThrow()
    expect(() => deleteManagedFile(dir, 'command', '../x')).toThrow()
    expect(listManagedFiles(dir, 'command').map((f) => f.name)).toEqual(['ok.md'])
  })

  it('rejects creating a file that already exists and keeps original content', () => {
    const dir = tmpDir()
    createManagedFile(dir, 'command', 'deploy')
    const target = join(dir, 'command', 'deploy.md')
    writeFileSync(target, 'custom content', 'utf8')
    expect(() => createManagedFile(dir, 'command', 'deploy')).toThrow('同名文件已存在')
    expect(readFileSync(target, 'utf8')).toBe('custom content')
  })

  it('rejects renaming onto an existing file and keeps both files', () => {
    const dir = tmpDir()
    createManagedFile(dir, 'command', 'deploy')
    createManagedFile(dir, 'command', 'release')
    const source = join(dir, 'command', 'deploy.md')
    const target = join(dir, 'command', 'release.md')
    const sourceContent = readFileSync(source, 'utf8')
    const targetContent = readFileSync(target, 'utf8')
    expect(() => renameManagedFile(dir, 'command', 'deploy', 'release')).toThrow('目标名称已存在')
    expect(readFileSync(source, 'utf8')).toBe(sourceContent)
    expect(readFileSync(target, 'utf8')).toBe(targetContent)
    expect(
      listManagedFiles(dir, 'command')
        .map((f) => f.name)
        .sort()
    ).toEqual(['deploy.md', 'release.md'])
  })

  it('treats renaming to the same name as a no-op', () => {
    const dir = tmpDir()
    createManagedFile(dir, 'command', 'deploy')
    const target = join(dir, 'command', 'deploy.md')
    writeFileSync(target, 'custom content', 'utf8')
    expect(() => renameManagedFile(dir, 'command', 'deploy', 'deploy')).not.toThrow()
    expect(readFileSync(target, 'utf8')).toBe('custom content')
    expect(listManagedFiles(dir, 'command').map((f) => f.name)).toEqual(['deploy.md'])
  })

  it('renames a file when only the case differs', () => {
    const dir = tmpDir()
    createManagedFile(dir, 'command', 'deploy')
    const source = join(dir, 'command', 'deploy.md')
    writeFileSync(source, 'custom content', 'utf8')
    expect(() => renameManagedFile(dir, 'command', 'deploy', 'Deploy')).not.toThrow()
    expect(existsSync(join(dir, 'command', 'Deploy.md'))).toBe(true)
    expect(readFileSync(join(dir, 'command', 'Deploy.md'), 'utf8')).toBe('custom content')
  })

  it('rejects renaming onto a distinct same-name-different-case file on case-sensitive FS', () => {
    const dir = tmpDir()
    createManagedFile(dir, 'command', 'deploy')
    const lower = join(dir, 'command', 'deploy.md')
    const upper = join(dir, 'command', 'Deploy.md')
    if (existsSync(upper)) {
      expect(existsSync(lower)).toBe(true)
      return
    }
    writeFileSync(lower, 'lower content', 'utf8')
    writeFileSync(upper, 'upper content', 'utf8')
    expect(() => renameManagedFile(dir, 'command', 'deploy', 'Deploy')).toThrow('目标名称已存在')
    expect(readFileSync(lower, 'utf8')).toBe('lower content')
    expect(readFileSync(upper, 'utf8')).toBe('upper content')
    expect(
      listManagedFiles(dir, 'command')
        .map((f) => f.name)
        .sort()
    ).toEqual(['Deploy.md', 'deploy.md'])
  })

  it('reads and writes skill content through SKILL.md', () => {
    const dir = tmpDir()
    createManagedFile(dir, 'skill', 'my-skill')
    expect(readManagedFileContent(dir, 'skill', 'my-skill')).toContain('name: my-skill')
    writeManagedFileContent(dir, 'skill', 'my-skill', '新内容')
    expect(readManagedFileContent(dir, 'skill', 'my-skill')).toBe('新内容')
  })

  it('reads and writes agent content', () => {
    const dir = tmpDir()
    createManagedFile(dir, 'agent', 'reviewer')
    writeManagedFileContent(dir, 'agent', 'reviewer', '你好')
    expect(readManagedFileContent(dir, 'agent', 'reviewer')).toBe('你好')
  })

  it('returns an empty string for missing content', () => {
    const dir = tmpDir()
    expect(readManagedFileContent(dir, 'skill', 'missing')).toBe('')
  })
})
