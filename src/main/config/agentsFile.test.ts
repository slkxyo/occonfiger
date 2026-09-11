import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { readAgentsFile, writeAgentsFile } from './agentsFile'

const dirs: string[] = []
function tmpDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'occ-agents-'))
  dirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('agentsFile', () => {
  it('returns an empty string when the file does not exist', () => {
    const dir = tmpDir()
    expect(readAgentsFile(join(dir, 'AGENTS.md'))).toBe('')
  })

  it('reads existing content', () => {
    const dir = tmpDir()
    const file = join(dir, 'AGENTS.md')
    writeFileSync(file, '# 提示词', 'utf8')
    expect(readAgentsFile(file)).toBe('# 提示词')
  })

  it('creates the file and writes content', () => {
    const dir = tmpDir()
    const file = join(dir, 'nested', 'AGENTS.md')
    writeAgentsFile(file, '你好')
    expect(readFileSync(file, 'utf8')).toBe('你好')
  })

  it('overwrites existing content', () => {
    const dir = tmpDir()
    const file = join(dir, 'AGENTS.md')
    writeFileSync(file, '旧内容', 'utf8')
    writeAgentsFile(file, '新内容')
    expect(readAgentsFile(file)).toBe('新内容')
  })
})
