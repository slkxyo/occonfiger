import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

type AuthEntry = Record<string, unknown> & { type?: string; key?: string }
type AuthFile = Record<string, AuthEntry>

export type Credential = { provider: string; type: string; keyTail?: string }

function readAuth(file: string): AuthFile {
  if (!existsSync(file)) return {}
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    return parsed && typeof parsed === 'object' ? (parsed as AuthFile) : {}
  } catch {
    return {}
  }
}

function writeAuth(file: string, data: AuthFile): void {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.tmp-${process.pid}`
  writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  renameSync(tmp, file)
  chmodSync(file, 0o600)
}

export function listCredentials(file: string): Credential[] {
  return Object.entries(readAuth(file)).map(([provider, entry]) => {
    const key = typeof entry.key === 'string' ? entry.key : undefined
    return {
      provider,
      type: entry.type ?? 'unknown',
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
  delete data[provider]
  writeAuth(file, data)
}
