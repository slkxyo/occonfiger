import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { createApi } from './api'

const api = createApi((channel, ...args) => ipcRenderer.invoke(channel, ...args))

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-ignore: window is populated when context isolation is disabled
  window.electron = electronAPI
  // @ts-ignore: window is populated when context isolation is disabled
  window.api = api
}
