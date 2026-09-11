import { describe, expect, it, vi } from 'vitest'
import { createApi } from './api'

describe('createApi', () => {
  it('forwards readConfig to the invoke bridge', async () => {
    const invoke = vi.fn().mockResolvedValue({ ok: true, data: { model: 'a/b' } })
    const api = createApi(invoke)
    const result = await api.readConfig()
    expect(invoke).toHaveBeenCalledWith('config:read')
    expect(result).toEqual({ model: 'a/b' })
  })

  it('throws on failed response', async () => {
    const invoke = vi.fn().mockResolvedValue({ ok: false, error: 'boom' })
    const api = createApi(invoke)
    await expect(api.getConfigPath()).rejects.toThrow('boom')
  })
})
