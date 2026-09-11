export type IpcResponse<T> = { ok: true; data: T } | { ok: false; error: string; data?: unknown }
export type Invoke = (channel: string, ...args: unknown[]) => Promise<unknown>

export interface Api {
  readConfig: () => Promise<Record<string, unknown>>
  saveConfig: (data: unknown, force?: boolean) => Promise<string[]>
  getConfigPath: () => Promise<string>
  getRawContent: () => Promise<string | null>
  listCredentials: () => Promise<{ provider: string; type: string; keyTail?: string }[]>
  updateCredentialKey: (provider: string, key: string) => Promise<null>
  deleteCredential: (provider: string) => Promise<null>
  listManagedFiles: (kind: string) => Promise<{ name: string; path: string }[]>
  createManagedFile: (kind: string, name: string) => Promise<string>
  renameManagedFile: (kind: string, from: string, to: string) => Promise<null>
  deleteManagedFile: (kind: string, name: string) => Promise<null>
  openManagedFile: (path: string) => Promise<null>
}

async function unwrap<T>(invoke: Invoke, channel: string, ...args: unknown[]): Promise<T> {
  const response = (await invoke(channel, ...args)) as IpcResponse<T>
  if (!response || response.ok !== true) {
    throw new Error(response && 'error' in response ? response.error : '未知错误')
  }
  return response.data
}

export function createApi(invoke: Invoke): Api {
  return {
    readConfig: () => unwrap<Record<string, unknown>>(invoke, 'config:read'),
    saveConfig: (data: unknown, force = false) =>
      unwrap<string[]>(invoke, 'config:save', data, force),
    getConfigPath: () => unwrap<string>(invoke, 'config:path'),
    getRawContent: () => unwrap<string | null>(invoke, 'config:raw'),
    listCredentials: () =>
      unwrap<{ provider: string; type: string; keyTail?: string }[]>(invoke, 'auth:list'),
    updateCredentialKey: (provider: string, key: string) =>
      unwrap<null>(invoke, 'auth:updateKey', provider, key),
    deleteCredential: (provider: string) => unwrap<null>(invoke, 'auth:delete', provider),
    listManagedFiles: (kind: string) =>
      unwrap<{ name: string; path: string }[]>(invoke, 'files:list', kind),
    createManagedFile: (kind: string, name: string) =>
      unwrap<string>(invoke, 'files:create', kind, name),
    renameManagedFile: (kind: string, from: string, to: string) =>
      unwrap<null>(invoke, 'files:rename', kind, from, to),
    deleteManagedFile: (kind: string, name: string) =>
      unwrap<null>(invoke, 'files:delete', kind, name),
    openManagedFile: (path: string) => unwrap<null>(invoke, 'files:open', path)
  }
}
