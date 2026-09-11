import { describe, expect, it } from 'vitest'
import { IPC, registerIpc } from './ipc'
import type { ConfigPaths } from './config/paths'

function fakeIpc(): {
  handle: (channel: string, fn: (...args: unknown[]) => unknown) => void
  invoke: (channel: string, ...args: unknown[]) => unknown
  channels: () => string[]
} {
  const handlers = new Map<string, (...args: unknown[]) => unknown>()
  return {
    handle: (channel: string, fn: (...args: unknown[]) => unknown): void => {
      handlers.set(channel, fn)
    },
    invoke: (channel: string, ...args: unknown[]): unknown => handlers.get(channel)?.({}, ...args),
    channels: (): string[] => [...handlers.keys()]
  }
}

const paths: ConfigPaths = {
  configDir: '/cfg',
  configFile: '/cfg/opencode.json',
  dataDir: '/data',
  authFile: '/data/auth.json'
}

describe('registerIpc', () => {
  it('registers all channels', () => {
    const ipc = fakeIpc()
    registerIpc(ipc, paths)
    expect(ipc.channels()).toContain(IPC.configRead)
    expect(ipc.channels()).toContain(IPC.configSave)
    expect(ipc.channels()).toContain(IPC.authList)
    expect(ipc.channels()).toContain(IPC.filesList)
  })

  it('returns config path', async () => {
    const ipc = fakeIpc()
    registerIpc(ipc, paths)
    const result = await ipc.invoke(IPC.configPath)
    expect(result).toEqual({ ok: true, data: '/cfg/opencode.json' })
  })

  it('reports save validation errors but still saves when forced', async () => {
    const ipc = fakeIpc()
    const saved: unknown[] = []
    registerIpc(ipc, paths, {
      writeConfig: (_file, data) => saved.push(data),
      readConfig: () => ({}),
      readRaw: () => null
    })
    const result = (await ipc.invoke(IPC.configSave, { bad: 1 }, true)) as { ok: boolean }
    expect(result.ok).toBe(true)
    expect(saved).toHaveLength(1)
  })
})
