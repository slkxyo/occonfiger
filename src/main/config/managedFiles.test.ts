import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createManagedFile,
  deleteManagedFile,
  listManagedFiles,
  managedDirFor,
  renameManagedFile
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
    expect(managedDirFor('/cfg', 'skill')).toBe('/cfg/skill')
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
})
