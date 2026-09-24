import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { shell } from 'electron'
import { writeConfig } from './config/io'
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
  agentsFile: '/cfg/AGENTS.md',
  disabledPluginsFile: '/cfg/.occonfiger/disabled-plugins.json',
  dataDir: '/data',
  authFile: '/data/auth.json',
  dbPath: '/data/opencode.db'
}

// 会话 handler 测试用的基础依赖（只关心注入的 repository 函数）。
const baseDeps = {
  readConfig: () => ({ data: {} }),
  writeConfig: () => undefined,
  readRaw: () => null
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
    const result = (await ipc.invoke(IPC.configSave, { snapshots: 'yes' }, false)) as {
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

  it('opens the SKILL.md content file', async () => {
    const ipc = fakeIpc()
    registerIpc(ipc, paths)
    vi.mocked(shell.openPath).mockResolvedValue('')
    const result = await ipc.invoke(IPC.filesOpen, 'my-skill')
    expect(result).toEqual({ ok: true, data: null })
    expect(shell.openPath).toHaveBeenCalledWith('/cfg/skills/my-skill/SKILL.md')
  })

  it('wraps shell.openPath failures', async () => {
    const ipc = fakeIpc()
    registerIpc(ipc, paths)
    vi.mocked(shell.openPath).mockResolvedValue('权限不足')
    const result = (await ipc.invoke(IPC.filesOpen, 'my-skill')) as {
      ok: boolean
      error?: string
    }
    expect(result.ok).toBe(false)
    expect(result.error).toBe('权限不足')
  })

  it('rejects path traversal in filesOpen before touching the shell', async () => {
    const ipc = fakeIpc()
    registerIpc(ipc, paths)
    const result = (await ipc.invoke(IPC.filesOpen, '../../..')) as {
      ok: boolean
      error?: string
    }
    expect(result.ok).toBe(false)
    expect(result.error).toContain('非法的名称')
    expect(shell.openPath).not.toHaveBeenCalled()
  })

  it('reads and writes the global AGENTS.md content', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'occ-ipc-agents-'))
    try {
      const ipc = fakeIpc()
      registerIpc(ipc, { ...paths, configDir: dir, agentsFile: join(dir, 'AGENTS.md') })
      expect(await ipc.invoke(IPC.agentsRead)).toEqual({ ok: true, data: '' })
      expect(await ipc.invoke(IPC.agentsWrite, '你好世界')).toEqual({ ok: true, data: null })
      expect(await ipc.invoke(IPC.agentsRead)).toEqual({ ok: true, data: '你好世界' })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('reads and writes managed file content', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'occ-ipc-files-'))
    try {
      const ipc = fakeIpc()
      registerIpc(ipc, { ...paths, configDir: dir })
      expect(await ipc.invoke(IPC.filesWrite, 'my-skill', '内容')).toEqual({
        ok: true,
        data: null
      })
      expect(await ipc.invoke(IPC.filesRead, 'my-skill')).toEqual({
        ok: true,
        data: '内容'
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('lists, toggles and deletes plugins through the config file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'occ-ipc-plugins-'))
    try {
      const configFile = join(dir, 'opencode.jsonc')
      const disabledPluginsFile = join(dir, '.occonfiger', 'disabled-plugins.json')
      writeConfig(configFile, { plugins: ['a', 'b'] })
      const ipc = fakeIpc()
      registerIpc(ipc, { ...paths, configFile, disabledPluginsFile })
      expect(await ipc.invoke(IPC.pluginsList)).toEqual({
        ok: true,
        data: [
          { name: 'a', enabled: true, spec: 'a' },
          { name: 'b', enabled: true, spec: 'b' }
        ]
      })
      expect(await ipc.invoke(IPC.pluginsSetEnabled, 'b', false)).toEqual({ ok: true, data: null })
      expect(await ipc.invoke(IPC.pluginsDelete, 'a')).toEqual({ ok: true, data: null })
      expect(await ipc.invoke(IPC.pluginsList)).toEqual({
        ok: true,
        data: [{ name: 'b', enabled: false, spec: 'b' }]
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('lists sessions through the injected repository', async () => {
    const ipc = fakeIpc()
    const seen: string[] = []
    const summary = {
      id: 's1',
      title: '标题',
      directory: '/w',
      timeCreated: 1,
      timeUpdated: 2,
      timeArchived: null,
      messageCount: 3
    }
    registerIpc(ipc, paths, {
      ...baseDeps,
      listSessions: (dbPath) => {
        seen.push(dbPath)
        return [summary]
      }
    })
    expect(await ipc.invoke(IPC.sessionList)).toEqual({ ok: true, data: [summary] })
    expect(seen).toEqual(['/data/opencode.db'])
  })

  it('renames a session with the id and title', async () => {
    const ipc = fakeIpc()
    const calls: unknown[] = []
    registerIpc(ipc, paths, {
      ...baseDeps,
      renameSession: (dbPath, id, title) => {
        calls.push(dbPath, id, title)
      }
    })
    expect(await ipc.invoke(IPC.sessionRename, 's1', '新标题')).toEqual({ ok: true, data: null })
    expect(calls).toEqual(['/data/opencode.db', 's1', '新标题'])
  })

  it('deletes a session with the id', async () => {
    const ipc = fakeIpc()
    const calls: unknown[] = []
    registerIpc(ipc, paths, {
      ...baseDeps,
      deleteSession: (dbPath, id) => {
        calls.push(dbPath, id)
      }
    })
    expect(await ipc.invoke(IPC.sessionDelete, 's1')).toEqual({ ok: true, data: null })
    expect(calls).toEqual(['/data/opencode.db', 's1'])
  })

  it('wraps session repository failures', async () => {
    const ipc = fakeIpc()
    registerIpc(ipc, paths, {
      ...baseDeps,
      deleteSession: () => {
        throw new Error('数据库被锁定')
      }
    })
    const result = (await ipc.invoke(IPC.sessionDelete, 's1')) as { ok: boolean; error?: string }
    expect(result.ok).toBe(false)
    expect(result.error).toBe('数据库被锁定')
  })
})
