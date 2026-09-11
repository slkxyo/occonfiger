import { shell } from 'electron'
import type { ConfigPaths } from './config/paths'
import { readConfig, readRaw, writeConfig } from './config/io'
import { readAgentsFile, writeAgentsFile } from './config/agentsFile'
import {
  createManagedFile,
  deleteManagedFile,
  listManagedFiles,
  managedFilePath,
  readManagedFileContent,
  renameManagedFile,
  writeManagedFileContent,
  type ManagedKind
} from './config/managedFiles'
import { deleteCredential, listCredentials, updateCredentialKey } from './auth/io'
import { validateConfig } from './schema/validate'
import { IPC } from '../shared/ipc-channels'

export { IPC }

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

  on(IPC.configRead, () => {
    try {
      const result = deps.readConfig(paths.configFile)
      if (result.parseError) return { ok: false, error: result.parseError, data: result.data }
      return ok(result.data)
    } catch (error) {
      return fail(error)
    }
  })
  on(IPC.configPath, () => ok(paths.configFile))
  on(IPC.configRaw, () => {
    try {
      return ok(deps.readRaw(paths.configFile))
    } catch (error) {
      return fail(error)
    }
  })
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

  on(IPC.agentsRead, () => {
    try {
      return ok(readAgentsFile(paths.agentsFile))
    } catch (error) {
      return fail(error)
    }
  })
  on(IPC.agentsWrite, (content: string) => {
    try {
      writeAgentsFile(paths.agentsFile, content)
      return ok(null)
    } catch (error) {
      return fail(error)
    }
  })

  on(IPC.authList, () => {
    try {
      return ok(listCredentials(paths.authFile))
    } catch (error) {
      return fail(error)
    }
  })
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

  on(IPC.filesList, (kind: ManagedKind) => {
    try {
      return ok(listManagedFiles(paths.configDir, kind))
    } catch (error) {
      return fail(error)
    }
  })
  on(IPC.filesRead, (kind: ManagedKind, name: string) => {
    try {
      return ok(readManagedFileContent(paths.configDir, kind, name))
    } catch (error) {
      return fail(error)
    }
  })
  on(IPC.filesWrite, (kind: ManagedKind, name: string, content: string) => {
    try {
      writeManagedFileContent(paths.configDir, kind, name, content)
      return ok(null)
    } catch (error) {
      return fail(error)
    }
  })
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
  on(IPC.filesOpen, async (kind: ManagedKind, name: string) => {
    try {
      const target = managedFilePath(paths.configDir, kind, name)
      const message = await shell.openPath(target)
      if (message) return fail(new Error(message))
      return ok(null)
    } catch (error) {
      return fail(error)
    }
  })
}
