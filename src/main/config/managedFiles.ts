import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { join } from 'node:path'

export type ManagedKind = 'agent' | 'command' | 'skill'
export type ManagedFile = { name: string; path: string }

function assertSafeName(name: string): void {
  if (name === '' || name === '.' || name === '..' || name.includes('/') || name.includes('\\')) {
    throw new Error(`非法的名称：${JSON.stringify(name)}`)
  }
}

export function managedDirFor(configDir: string, kind: ManagedKind): string {
  return join(configDir, kind)
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
  mkdirSync(join(target, '..'), { recursive: true })
  writeFileSync(target, content, 'utf8')
  return target
}

export function renameManagedFile(dir: string, kind: ManagedKind, from: string, to: string): void {
  assertSafeName(from)
  assertSafeName(to)
  const base = managedDirFor(dir, kind)
  if (kind === 'skill') {
    renameSync(join(base, from), join(base, to))
    return
  }
  renameSync(join(base, `${from}.md`), join(base, `${to}.md`))
}

export function deleteManagedFile(dir: string, kind: ManagedKind, name: string): void {
  assertSafeName(name)
  const base = managedDirFor(dir, kind)
  const target = kind === 'skill' ? join(base, name) : join(base, `${name}.md`)
  rmSync(target, { recursive: kind === 'skill', force: true })
}
