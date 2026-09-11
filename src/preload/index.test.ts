import { describe, expect, it, vi } from 'vitest'
import { createApi } from './api'
import { IPC } from '../shared/ipc-channels'

describe('createApi', () => {
  it('forwards readConfig to the invoke bridge', async () => {
    const invoke = vi.fn().mockResolvedValue({ ok: true, data: { model: 'a/b' } })
    const api = createApi(invoke)
    const result = await api.readConfig()
    expect(invoke).toHaveBeenCalledWith(IPC.configRead)
    expect(result).toEqual({ model: 'a/b' })
  })

  it('throws on failed response', async () => {
    const invoke = vi.fn().mockResolvedValue({ ok: false, error: 'boom' })
    const api = createApi(invoke)
    await expect(api.getConfigPath()).rejects.toThrow('boom')
  })

  it('attaches validation errors to the thrown error', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue({ ok: false, error: '校验未通过', data: ['/model invalid', 42] })
    const api = createApi(invoke)
    await expect(api.saveConfig({}, false)).rejects.toMatchObject({
      message: '校验未通过',
      errors: ['/model invalid']
    })
  })

  it('forwards openManagedFile kind and name', async () => {
    const invoke = vi.fn().mockResolvedValue({ ok: true, data: null })
    const api = createApi(invoke)
    await api.openManagedFile('skill', 'my-skill')
    expect(invoke).toHaveBeenCalledWith(IPC.filesOpen, 'skill', 'my-skill')
  })

  it('forwards readAgents and writeAgents', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: '提示词' })
      .mockResolvedValueOnce({ ok: true, data: null })
    const api = createApi(invoke)
    await expect(api.readAgents()).resolves.toBe('提示词')
    await api.writeAgents('新提示词')
    expect(invoke).toHaveBeenNthCalledWith(1, IPC.agentsRead)
    expect(invoke).toHaveBeenNthCalledWith(2, IPC.agentsWrite, '新提示词')
  })

  it('forwards readManagedFile and writeManagedFile', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: '内容' })
      .mockResolvedValueOnce({ ok: true, data: null })
    const api = createApi(invoke)
    await expect(api.readManagedFile('skill', 's')).resolves.toBe('内容')
    await api.writeManagedFile('skill', 's', '新')
    expect(invoke).toHaveBeenNthCalledWith(1, IPC.filesRead, 'skill', 's')
    expect(invoke).toHaveBeenNthCalledWith(2, IPC.filesWrite, 'skill', 's', '新')
  })
})
