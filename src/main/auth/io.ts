import { chmodSync, existsSync, readFileSync } from 'node:fs'
import { writeFileAtomic } from '../util/atomicWrite'

type AuthFile = Record<string, Record<string, unknown>>

export type Credential = { provider: string; type: string; keyTail?: string }

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readAuth(file: string): AuthFile {
  if (!existsSync(file)) return {}
  const parsed = JSON.parse(readFileSync(file, 'utf8'))
  return isPlainObject(parsed) ? (parsed as AuthFile) : {}
}

function writeAuth(file: string, data: AuthFile): void {
  writeFileAtomic(file, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 })
  chmodSync(file, 0o600)
}

export function listCredentials(file: string): Credential[] {
  return Object.entries(readAuth(file)).map(([provider, entry]) => {
    const record = isPlainObject(entry) ? entry : {}
    const key = typeof record.key === 'string' ? record.key : undefined
    return {
      provider,
      type: typeof record.type === 'string' ? record.type : 'unknown',
      keyTail: key ? key.slice(-4) : undefined
    }
  })
}

export function updateCredentialKey(file: string, provider: string, key: string): void {
  const data = readAuth(file)
  if (!data[provider]) throw new Error(`服务商 ${provider} 不存在`)
  data[provider] = { ...data[provider], key }
  writeAuth(file, data)
}

export function deleteCredential(file: string, provider: string): void {
  const data = readAuth(file)
  if (!data[provider]) throw new Error(`服务商 ${provider} 不存在`)
  delete data[provider]
  writeAuth(file, data)
}
