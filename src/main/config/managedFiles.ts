import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { writeFileAtomic } from '../util/atomicWrite'

export type ManagedFile = { name: string; path: string }

export function assertSafeName(name: string): void {
  if (name === '' || name === '.' || name === '..' || name.includes('/') || name.includes('\\')) {
    throw new Error(`非法的名称：${JSON.stringify(name)}`)
  }
}

export function skillsDir(configDir: string): string {
  return join(configDir, 'skills')
}

export function skillPath(configDir: string, name: string): string {
  assertSafeName(name)
  return join(skillsDir(configDir), name)
}

export function skillContentPath(configDir: string, name: string): string {
  assertSafeName(name)
  return join(skillsDir(configDir), name, 'SKILL.md')
}

export function listManagedFiles(configDir: string): ManagedFile[] {
  const base = skillsDir(configDir)
  if (!existsSync(base)) return []
  const files: ManagedFile[] = []
  for (const name of readdirSync(base)) {
    try {
      if (statSync(join(base, name)).isDirectory()) files.push({ name, path: join(base, name) })
    } catch {
      // 跳过无法访问的条目（断链符号链接、权限不足、竞态删除）
    }
  }
  return files
}

export function deleteManagedFile(configDir: string, name: string): void {
  rmSync(skillPath(configDir, name), { recursive: true, force: true })
}

export function readManagedFileContent(configDir: string, name: string): string {
  const target = skillContentPath(configDir, name)
  if (!existsSync(target)) return ''
  return readFileSync(target, 'utf8')
}

export function writeManagedFileContent(configDir: string, name: string, content: string): void {
  writeFileAtomic(skillContentPath(configDir, name), content)
}
