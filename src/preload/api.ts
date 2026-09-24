import { IPC } from '../shared/ipc-channels'
import type { SessionSummary } from '../shared/session-types'

export type IpcResponse<T> = { ok: true; data: T } | { ok: false; error: string; data?: unknown }
export type Invoke = (channel: string, ...args: unknown[]) => Promise<unknown>
export type IpcError = Error & { errors?: string[] }

export interface Api {
  readConfig: () => Promise<Record<string, unknown>>
  saveConfig: (data: unknown, force?: boolean) => Promise<string[]>
  getConfigPath: () => Promise<string>
  getRawContent: () => Promise<string | null>
  readAgents: () => Promise<string>
  writeAgents: (content: string) => Promise<null>
  listCredentials: () => Promise<{ provider: string; type: string; keyTail?: string }[]>
  updateCredentialKey: (provider: string, key: string) => Promise<null>
  deleteCredential: (provider: string) => Promise<null>
  listManagedFiles: () => Promise<{ name: string; path: string }[]>
  readManagedFile: (name: string) => Promise<string>
  writeManagedFile: (name: string, content: string) => Promise<null>
  deleteManagedFile: (name: string) => Promise<null>
  openManagedFile: (name: string) => Promise<null>
  listPlugins: () => Promise<{ name: string; enabled: boolean; spec: unknown }[]>
  setPluginEnabled: (name: string, enabled: boolean) => Promise<null>
  deletePlugin: (name: string) => Promise<null>
  listSessions: () => Promise<SessionSummary[]>
  renameSession: (id: string, title: string) => Promise<null>
  deleteSession: (id: string) => Promise<null>
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
    readAgents: () => unwrap<string>(invoke, IPC.agentsRead),
    writeAgents: (content: string) => unwrap<null>(invoke, IPC.agentsWrite, content),
    listCredentials: () =>
      unwrap<{ provider: string; type: string; keyTail?: string }[]>(invoke, IPC.authList),
    updateCredentialKey: (provider: string, key: string) =>
      unwrap<null>(invoke, IPC.authUpdateKey, provider, key),
    deleteCredential: (provider: string) => unwrap<null>(invoke, IPC.authDelete, provider),
    listManagedFiles: () => unwrap<{ name: string; path: string }[]>(invoke, IPC.filesList),
    readManagedFile: (name: string) => unwrap<string>(invoke, IPC.filesRead, name),
    writeManagedFile: (name: string, content: string) =>
      unwrap<null>(invoke, IPC.filesWrite, name, content),
    deleteManagedFile: (name: string) => unwrap<null>(invoke, IPC.filesDelete, name),
    openManagedFile: (name: string) => unwrap<null>(invoke, IPC.filesOpen, name),
    listPlugins: () =>
      unwrap<{ name: string; enabled: boolean; spec: unknown }[]>(invoke, IPC.pluginsList),
    setPluginEnabled: (name: string, enabled: boolean) =>
      unwrap<null>(invoke, IPC.pluginsSetEnabled, name, enabled),
    deletePlugin: (name: string) => unwrap<null>(invoke, IPC.pluginsDelete, name),
    listSessions: () => unwrap<SessionSummary[]>(invoke, IPC.sessionList),
    renameSession: (id: string, title: string) =>
      unwrap<null>(invoke, IPC.sessionRename, id, title),
    deleteSession: (id: string) => unwrap<null>(invoke, IPC.sessionDelete, id)
  }
}
