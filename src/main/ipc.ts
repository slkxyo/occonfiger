import { shell } from 'electron'
import type { ConfigPaths } from './config/paths'
import { readConfig, readRaw, writeConfig } from './config/io'
import {
  createManagedFile,
  deleteManagedFile,
  listManagedFiles,
  renameManagedFile,
  type ManagedKind
} from './config/managedFiles'
import { deleteCredential, listCredentials, updateCredentialKey } from './auth/io'
import { validateConfig } from './schema/validate'

export const IPC = {
  configRead: 'config:read',
  configSave: 'config:save',
  configPath: 'config:path',
  configRaw: 'config:raw',
  authList: 'auth:list',
  authUpdateKey: 'auth:updateKey',
  authDelete: 'auth:delete',
  filesList: 'files:list',
  filesCreate: 'files:create',
  filesRename: 'files:rename',
  filesDelete: 'files:delete',
  filesOpen: 'files:open'
} as const

type IpcLike = { handle: (channel: string, fn: (...args: unknown[]) => unknown) => void }
type Deps = {
  readConfig: typeof readConfig
  writeConfig: typeof writeConfig
  readRaw: typeof readRaw
}

const defaultDeps: Deps = { readConfig, writeConfig, readRaw }

function ok(data: unknown): { ok: true; data: unknown } {
  return { ok: true, data }
}

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : String(error) }
}

export function registerIpc(ipc: IpcLike, paths: ConfigPaths, deps: Deps = defaultDeps): void {
  const on = <A extends unknown[]>(channel: string, fn: (...args: A) => unknown): void =>
    ipc.handle(channel, (...args: unknown[]) => fn(...(args.slice(1) as A)))

  on(IPC.configRead, () => ok(deps.readConfig(paths.configFile)))
  on(IPC.configPath, () => ok(paths.configFile))
  on(IPC.configRaw, () => ok(deps.readRaw(paths.configFile)))
  on(IPC.configSave, (data: unknown, force?: boolean) => {
    try {
      const validation = validateConfig(data)
      if (!validation.valid && !force) {
        return { ok: false, error: '校验未通过', data: validation.errors }
      }
      deps.writeConfig(paths.configFile, data)
      return ok(validation.errors)
    } catch (error) {
      return fail(error)
    }
  })

  on(IPC.authList, () => ok(listCredentials(paths.authFile)))
  on(IPC.authUpdateKey, (provider: string, key: string) => {
    try {
      updateCredentialKey(paths.authFile, provider, key)
      return ok(null)
    } catch (error) {
      return fail(error)
    }
  })
  on(IPC.authDelete, (provider: string) => {
    try {
      deleteCredential(paths.authFile, provider)
      return ok(null)
    } catch (error) {
      return fail(error)
    }
  })

  on(IPC.filesList, (kind: ManagedKind) => ok(listManagedFiles(paths.configDir, kind)))
  on(IPC.filesCreate, (kind: ManagedKind, name: string) => {
    try {
      return ok(createManagedFile(paths.configDir, kind, name))
    } catch (error) {
      return fail(error)
    }
  })
  on(IPC.filesRename, (kind: ManagedKind, from: string, to: string) => {
    try {
      renameManagedFile(paths.configDir, kind, from, to)
      return ok(null)
    } catch (error) {
      return fail(error)
    }
  })
  on(IPC.filesDelete, (kind: ManagedKind, name: string) => {
    try {
      deleteManagedFile(paths.configDir, kind, name)
      return ok(null)
    } catch (error) {
      return fail(error)
    }
  })
  on(IPC.filesOpen, (path: string) => {
    shell.openPath(path)
    return ok(null)
  })
}
