export const IPC = {
  configRead: 'config:read',
  configSave: 'config:save',
  configPath: 'config:path',
  configRaw: 'config:raw',
  agentsRead: 'agents:read',
  agentsWrite: 'agents:write',
  authList: 'auth:list',
  authUpdateKey: 'auth:updateKey',
  authDelete: 'auth:delete',
  filesList: 'files:list',
  filesRead: 'files:read',
  filesWrite: 'files:write',
  filesDelete: 'files:delete',
  filesOpen: 'files:open',
  pluginsList: 'plugins:list',
  pluginsSetEnabled: 'plugins:setEnabled',
  pluginsDelete: 'plugins:delete'
} as const
