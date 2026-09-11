import { readFileSync } from 'node:fs'
import { join } from 'node:path'

let cached: object | null = null

function schemaPath(): string {
  return join(process.resourcesPath ?? '', 'schema', 'opencode-config.schema.json')
}

function devSchemaPath(): string {
  return join(__dirname, '../../resources/schema/opencode-config.schema.json')
}

function sourceSchemaPath(): string {
  return join(__dirname, '../../../resources/schema/opencode-config.schema.json')
}

export function loadBuiltinSchema(): object {
  if (cached) return cached
  const candidates = [schemaPath(), devSchemaPath(), sourceSchemaPath()]
  for (const candidate of candidates) {
    try {
      cached = JSON.parse(readFileSync(candidate, 'utf8')) as object
      return cached
    } catch {
      continue
    }
  }
  throw new Error('内置 schema 未找到')
}
