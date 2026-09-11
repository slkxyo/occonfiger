import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { join, normalize } from 'node:path'

export type ManagedKind = 'agent' | 'command' | 'skill'
export type ManagedFile = { name: string; path: string }

const MANAGED_KINDS = ['agent', 'command', 'skill'] as const

function assertSafeName(name: string): void {
  if (name === '' || name === '.' || name === '..' || name.includes('/') || name.includes('\\')) {
    throw new Error(`非法的名称：${JSON.stringify(name)}`)
  }
}

function assertManagedKind(kind: unknown): asserts kind is ManagedKind {
  if (typeof kind !== 'string' || !(MANAGED_KINDS as readonly string[]).includes(kind)) {
    throw new Error(`非法的类型：${JSON.stringify(kind)}`)
  }
}

export function managedDirFor(configDir: string, kind: ManagedKind): string {
  assertManagedKind(kind)
  return join(configDir, kind)
}

export function managedFilePath(configDir: string, kind: ManagedKind, name: string): string {
  assertSafeName(name)
  const base = managedDirFor(configDir, kind)
  return kind === 'skill' ? join(base, name) : join(base, `${name}.md`)
}

export function listManagedFiles(dir: string, kind: ManagedKind): ManagedFile[] {
  const base = managedDirFor(dir, kind)
  if (!existsSync(base)) return []
  return readdirSync(base)
    .filter((name) =>
      kind === 'skill' ? statSync(join(base, name)).isDirectory() : name.endsWith('.md')
    )
    .map((name) => ({ name, path: join(base, name) }))
}

function templates(kind: ManagedKind, name: string): { file: string; content: string } {
  if (kind === 'agent') {
    return {
      file: `${name}.md`,
      content: `---\ndescription: \nmode: subagent\n---\n\n`
    }
  }
  if (kind === 'command') {
    return {
      file: `${name}.md`,
      content: `---\ndescription: \n---\n\n$ARGUMENTS\n`
    }
  }
  return {
    file: join(name, 'SKILL.md'),
    content: `---\nname: ${name}\ndescription: \n---\n\n`
  }
}

export function createManagedFile(dir: string, kind: ManagedKind, name: string): string {
  assertSafeName(name)
  const base = managedDirFor(dir, kind)
  const { file, content } = templates(kind, name)
  const target = join(base, file)
  if (existsSync(target)) {
    throw new Error(`同名文件已存在：${name}`)
  }
  mkdirSync(join(target, '..'), { recursive: true })
  writeFileSync(target, content, { encoding: 'utf8', flag: 'wx' })
  return target
}

function isSameFile(a: string, b: string): boolean {
  try {
    const statA = statSync(a)
    const statB = statSync(b)
    return statA.dev === statB.dev && statA.ino === statB.ino
  } catch {
    return false
  }
}

export function renameManagedFile(dir: string, kind: ManagedKind, from: string, to: string): void {
  assertSafeName(from)
  assertSafeName(to)
  const base = managedDirFor(dir, kind)
  const source = kind === 'skill' ? join(base, from) : join(base, `${from}.md`)
  const target = kind === 'skill' ? join(base, to) : join(base, `${to}.md`)
  if (normalize(source) === normalize(target)) {
    return
  }
  if (existsSync(target)) {
    if (isSameFile(source, target)) {
      const temp = `${target}.rename-${Date.now()}`
      renameSync(source, temp)
      renameSync(temp, target)
      return
    }
    throw new Error(`目标名称已存在：${to}`)
  }
  renameSync(source, target)
}

export function deleteManagedFile(dir: string, kind: ManagedKind, name: string): void {
  const target = managedFilePath(dir, kind, name)
  rmSync(target, { recursive: kind === 'skill', force: true })
}
