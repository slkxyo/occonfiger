import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { parse } from 'jsonc-parser'

export function readRaw(file: string): string | null {
  return existsSync(file) ? readFileSync(file, 'utf8') : null
}

export function readConfig(file: string): Record<string, unknown> {
  const raw = readRaw(file)
  if (raw === null || raw.trim() === '') return {}
  const parsed = parse(raw)
  return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
}

export function writeConfig(file: string, data: unknown): void {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.tmp-${process.pid}`
  writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  renameSync(tmp, file)
}
