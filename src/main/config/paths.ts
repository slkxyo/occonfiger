import { homedir } from 'node:os'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export type PathEnv = { XDG_CONFIG_HOME?: string; XDG_DATA_HOME?: string; HOME?: string }

export type ConfigPaths = {
  configDir: string
  configFile: string
  dataDir: string
  authFile: string
}

export function resolvePaths(
  env: PathEnv = process.env as PathEnv,
  exists: (file: string) => boolean = existsSync
): ConfigPaths {
  const home = env.HOME ?? homedir()
  const configDir = join(env.XDG_CONFIG_HOME ?? join(home, '.config'), 'opencode')
  const dataDir = join(env.XDG_DATA_HOME ?? join(home, '.local', 'share'), 'opencode')
  const jsonc = join(configDir, 'opencode.jsonc')
  const json = join(configDir, 'opencode.json')
  const configFile = exists(jsonc) ? jsonc : json
  return { configDir, configFile, dataDir, authFile: join(dataDir, 'auth.json') }
}
