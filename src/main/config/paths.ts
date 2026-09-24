import { homedir } from 'node:os'
import { join } from 'node:path'

export type PathEnv = { XDG_CONFIG_HOME?: string; XDG_DATA_HOME?: string; HOME?: string }

export type ConfigPaths = {
  configDir: string
  configFile: string
  agentsFile: string
  disabledPluginsFile: string
  dataDir: string
  authFile: string
  dbPath: string
}

export function resolvePaths(env: PathEnv = process.env as PathEnv): ConfigPaths {
  const home = env.HOME ?? homedir()
  const configDir = join(env.XDG_CONFIG_HOME ?? join(home, '.config'), 'opencode')
  const dataDir = join(env.XDG_DATA_HOME ?? join(home, '.local', 'share'), 'opencode')
  return {
    configDir,
    configFile: join(configDir, 'opencode.jsonc'),
    agentsFile: join(configDir, 'AGENTS.md'),
    disabledPluginsFile: join(configDir, '.occonfiger', 'disabled-plugins.json'),
    dataDir,
    authFile: join(dataDir, 'auth.json'),
    dbPath: join(dataDir, 'opencode.db')
  }
}
