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

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
