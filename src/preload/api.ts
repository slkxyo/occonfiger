import { IPC } from '../shared/ipc-channels'

export type IpcResponse<T> = { ok: true; data: T } | { ok: false; error: string; data?: unknown }
export type Invoke = (channel: string, ...args: unknown[]) => Promise<unknown>
export type IpcError = Error & { errors?: string[] }

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
  openManagedFile: (kind: string, name: string) => Promise<null>
}

function toError(response: IpcResponse<unknown> | null | undefined): IpcError {
  const error = new Error(response && 'error' in response ? response.error : '未知错误') as IpcError
  if (response && 'data' in response && Array.isArray(response.data)) {
    error.errors = response.data.filter((item): item is string => typeof item === 'string')
  }
  return error
}

async function unwrap<T>(invoke: Invoke, channel: string, ...args: unknown[]): Promise<T> {
  const response = (await invoke(channel, ...args)) as IpcResponse<T>
  if (!response || response.ok !== true) throw toError(response)
  return response.data
}

export function createApi(invoke: Invoke): Api {
  return {
    readConfig: () => unwrap<Record<string, unknown>>(invoke, IPC.configRead),
    saveConfig: (data: unknown, force = false) =>
      unwrap<string[]>(invoke, IPC.configSave, data, force),
    getConfigPath: () => unwrap<string>(invoke, IPC.configPath),
    getRawContent: () => unwrap<string | null>(invoke, IPC.configRaw),
    listCredentials: () =>
      unwrap<{ provider: string; type: string; keyTail?: string }[]>(invoke, IPC.authList),
    updateCredentialKey: (provider: string, key: string) =>
      unwrap<null>(invoke, IPC.authUpdateKey, provider, key),
    deleteCredential: (provider: string) => unwrap<null>(invoke, IPC.authDelete, provider),
    listManagedFiles: (kind: string) =>
      unwrap<{ name: string; path: string }[]>(invoke, IPC.filesList, kind),
    createManagedFile: (kind: string, name: string) =>
      unwrap<string>(invoke, IPC.filesCreate, kind, name),
    renameManagedFile: (kind: string, from: string, to: string) =>
      unwrap<null>(invoke, IPC.filesRename, kind, from, to),
    deleteManagedFile: (kind: string, name: string) =>
      unwrap<null>(invoke, IPC.filesDelete, kind, name),
    openManagedFile: (kind: string, name: string) => unwrap<null>(invoke, IPC.filesOpen, kind, name)
  }
}
