import { existsSync, readFileSync } from 'node:fs'
import { parse, printParseErrorCode, type ParseError } from 'jsonc-parser'
import { writeFileAtomic } from '../util/atomicWrite'

export type ConfigReadResult = {
  data: Record<string, unknown>
  parseError?: string
}

export function readRaw(file: string): string | null {
  return existsSync(file) ? readFileSync(file, 'utf8') : null
}

export function readConfig(file: string): ConfigReadResult {
  const raw = readRaw(file)
  if (raw === null || raw.trim() === '') return { data: {} }
  const errors: ParseError[] = []
  const parsed = parse(raw, errors, { allowTrailingComma: true })
  const data =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  if (errors.length === 0) return { data }
  const first = errors[0]
  return {
    data,
    parseError: `配置文件解析失败：${printParseErrorCode(first.error)}（偏移 ${first.offset}）`
  }
}

export function writeConfig(file: string, data: unknown): void {
  writeFileAtomic(file, `${JSON.stringify(data, null, 2)}\n`)
}
