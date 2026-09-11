import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'jsonc-parser'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepMerge(preferred: unknown, fallback: unknown): unknown {
  if (isPlainObject(preferred) && isPlainObject(fallback)) {
    const result: Record<string, unknown> = { ...fallback }
    for (const key of Object.keys(preferred)) {
      result[key] = key in fallback ? deepMerge(preferred[key], fallback[key]) : preferred[key]
    }
    return result
  }
  return preferred
}

function readObject(file: string): Record<string, unknown> {
  const text = readFileSync(file, 'utf8')
  const parsed = text.trim() === '' ? {} : parse(text, undefined, { allowTrailingComma: true })
  return isPlainObject(parsed) ? parsed : {}
}

export function migrateConfig(configDir: string): void {
  const jsonc = join(configDir, 'opencode.jsonc')
  const json = join(configDir, 'opencode.json')
  const hasJsonc = existsSync(jsonc)
  const hasJson = existsSync(json)
  if (hasJsonc && hasJson) {
    const merged = deepMerge(readObject(jsonc), readObject(json))
    writeFileSync(jsonc, `${JSON.stringify(merged, null, 2)}\n`, 'utf8')
    rmSync(json)
    return
  }
  if (!hasJsonc && hasJson) {
    renameSync(json, jsonc)
  }
}
