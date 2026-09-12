import { shell } from 'electron'
import type { ConfigPaths } from './config/paths'
import { readConfig, readRaw, writeConfig } from './config/io'
import { readAgentsFile, writeAgentsFile } from './config/agentsFile'
import {
  deleteManagedFile,
  listManagedFiles,
  readManagedFileContent,
  skillContentPath,
  writeManagedFileContent
} from './config/managedFiles'
import { deleteCredential, listCredentials, updateCredentialKey } from './auth/io'
import { deletePlugin, listPlugins, setPluginEnabled } from './config/plugins'
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

  on(IPC.filesList, () => {
    try {
      return ok(listManagedFiles(paths.configDir))
    } catch (error) {
      return fail(error)
    }
  })
  on(IPC.filesRead, (name: string) => {
    try {
      return ok(readManagedFileContent(paths.configDir, name))
    } catch (error) {
      return fail(error)
    }
  })
  on(IPC.filesWrite, (name: string, content: string) => {
    try {
      writeManagedFileContent(paths.configDir, name, content)
      return ok(null)
    } catch (error) {
      return fail(error)
    }
  })
  on(IPC.filesDelete, (name: string) => {
    try {
      deleteManagedFile(paths.configDir, name)
      return ok(null)
    } catch (error) {
      return fail(error)
    }
  })
  on(IPC.filesOpen, async (name: string) => {
    try {
      const message = await shell.openPath(skillContentPath(paths.configDir, name))
      if (message) return fail(new Error(message))
      return ok(null)
    } catch (error) {
      return fail(error)
    }
  })

  on(IPC.pluginsList, () => {
    try {
      return ok(listPlugins(paths.configFile, paths.disabledPluginsFile))
    } catch (error) {
      return fail(error)
    }
  })
  on(IPC.pluginsSetEnabled, (name: string, enabled: boolean) => {
    try {
      setPluginEnabled(paths.configFile, paths.disabledPluginsFile, name, enabled)
      return ok(null)
    } catch (error) {
      return fail(error)
    }
  })
  on(IPC.pluginsDelete, (name: string) => {
    try {
      deletePlugin(paths.configFile, paths.disabledPluginsFile, name)
      return ok(null)
    } catch (error) {
      return fail(error)
    }
  })
}
