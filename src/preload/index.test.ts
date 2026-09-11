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
})
