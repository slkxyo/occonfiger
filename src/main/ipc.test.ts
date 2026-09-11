import { beforeEach, describe, expect, it, vi } from 'vitest'
import { shell } from 'electron'
import { IPC, registerIpc } from './ipc'
import type { ConfigPaths } from './config/paths'

vi.mock('electron', () => ({ shell: { openPath: vi.fn() } }))

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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers a handler for every channel constant', () => {
    const ipc = fakeIpc()
    registerIpc(ipc, paths)
    for (const channel of Object.values(IPC)) {
      expect(ipc.channels()).toContain(channel)
    }
  })

  it('returns config path', async () => {
    const ipc = fakeIpc()
    registerIpc(ipc, paths)
    const result = await ipc.invoke(IPC.configPath)
    expect(result).toEqual({ ok: true, data: '/cfg/opencode.json' })
  })

  it('returns config data on a clean read', async () => {
    const ipc = fakeIpc()
    registerIpc(ipc, paths, {
      readConfig: () => ({ data: { model: 'a/b' } }),
      writeConfig: () => undefined,
      readRaw: () => null
    })
    const result = await ipc.invoke(IPC.configRead)
    expect(result).toEqual({ ok: true, data: { model: 'a/b' } })
  })

  it('surfaces a parse error instead of an empty draft', async () => {
    const ipc = fakeIpc()
    registerIpc(ipc, paths, {
      readConfig: () => ({ data: { model: 'a/b' }, parseError: '配置文件解析失败' }),
      writeConfig: () => undefined,
      readRaw: () => null
    })
    const result = (await ipc.invoke(IPC.configRead)) as {
      ok: boolean
      error?: string
      data?: unknown
    }
    expect(result.ok).toBe(false)
    expect(result.error).toBe('配置文件解析失败')
    expect(result.data).toEqual({ model: 'a/b' })
  })

  it('rejects invalid config when not forced and does not save', async () => {
    const ipc = fakeIpc()
    const saved: unknown[] = []
    registerIpc(ipc, paths, {
      writeConfig: (_file, data) => {
        saved.push(data)
      },
      readConfig: () => ({ data: {} }),
      readRaw: () => null
    })
    const result = (await ipc.invoke(IPC.configSave, { totally_unknown: 1 }, false)) as {
      ok: boolean
      error?: string
    }
    expect(result.ok).toBe(false)
    expect(result.error).toBeDefined()
    expect(saved).toHaveLength(0)
  })

  it('still saves when validation fails but is forced', async () => {
    const ipc = fakeIpc()
    const saved: unknown[] = []
    registerIpc(ipc, paths, {
      writeConfig: (_file, data) => {
        saved.push(data)
      },
      readConfig: () => ({ data: {} }),
      readRaw: () => null
    })
    const result = (await ipc.invoke(IPC.configSave, { bad: 1 }, true)) as { ok: boolean }
    expect(result.ok).toBe(true)
    expect(saved).toHaveLength(1)
  })

  it('returns error result when a read handler throws', async () => {
    const ipc = fakeIpc()
    registerIpc(ipc, paths, {
      readConfig: () => {
        throw new Error('boom')
      },
      writeConfig: () => undefined,
      readRaw: () => null
    })
    const result = (await ipc.invoke(IPC.configRead)) as { ok: boolean; error?: string }
    expect(result.ok).toBe(false)
    expect(result.error).toBe('boom')
  })

  it('opens a managed file with validated kind and name', async () => {
    const ipc = fakeIpc()
    registerIpc(ipc, paths)
    vi.mocked(shell.openPath).mockResolvedValue('')
    const result = await ipc.invoke(IPC.filesOpen, 'command', 'deploy')
    expect(result).toEqual({ ok: true, data: null })
    expect(shell.openPath).toHaveBeenCalledWith('/cfg/command/deploy.md')
  })

  it('wraps shell.openPath failures', async () => {
    const ipc = fakeIpc()
    registerIpc(ipc, paths)
    vi.mocked(shell.openPath).mockResolvedValue('权限不足')
    const result = (await ipc.invoke(IPC.filesOpen, 'command', 'deploy')) as {
      ok: boolean
      error?: string
    }
    expect(result.ok).toBe(false)
    expect(result.error).toBe('权限不足')
  })

  it('rejects path traversal in filesOpen before touching the shell', async () => {
    const ipc = fakeIpc()
    registerIpc(ipc, paths)
    const result = (await ipc.invoke(IPC.filesOpen, '../../..', 'passwd')) as {
      ok: boolean
      error?: string
    }
    expect(result.ok).toBe(false)
    expect(result.error).toContain('非法的类型')
    expect(shell.openPath).not.toHaveBeenCalled()
  })
})
