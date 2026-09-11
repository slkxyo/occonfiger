import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useConfigStore } from '../store/configStore'
import { useSaveConfig, type SaveResult } from './useSaveConfig'

describe('useSaveConfig', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({ model: 'anthropic/claude' }))
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('saves successfully and clears errors', async () => {
    const saveConfig = vi.fn().mockResolvedValue([])
    vi.stubGlobal('api', { saveConfig })
    const { result } = renderHook(() => useSaveConfig())
    let outcome: SaveResult | undefined
    await act(async () => {
      outcome = await result.current.save()
    })
    expect(outcome).toEqual({ saved: true, errors: [] })
    expect(result.current.saveErrors).toEqual([])
    expect(saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'anthropic/claude',
        $schema: 'https://opencode.ai/config.json'
      }),
      false
    )
    expect(useConfigStore.getState().dirty).toBe(false)
  })

  it('returns validation errors without forcing', async () => {
    const saveConfig = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('校验未通过'), { errors: ['未知顶层键：foo'] }))
    vi.stubGlobal('api', { saveConfig })
    useConfigStore.getState().setField(['model'], 'anthropic/claude')
    const { result } = renderHook(() => useSaveConfig())
    let outcome: SaveResult | undefined
    await act(async () => {
      outcome = await result.current.save()
    })
    expect(outcome).toEqual({ saved: false, errors: ['未知顶层键：foo'] })
    expect(result.current.saveErrors).toEqual(['未知顶层键：foo'])
    expect(saveConfig).toHaveBeenCalledTimes(1)
    expect(useConfigStore.getState().dirty).toBe(true)
  })

  it('force saves after a validation failure', async () => {
    const saveConfig = vi
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error('校验未通过'), { errors: ['未知顶层键：foo'] })
      )
      .mockResolvedValueOnce(['未知顶层键：foo'])
    vi.stubGlobal('api', { saveConfig })
    const { result } = renderHook(() => useSaveConfig())
    await act(async () => {
      await result.current.save()
    })
    let outcome: SaveResult | undefined
    await act(async () => {
      outcome = await result.current.forceSave()
    })
    expect(outcome).toEqual({ saved: true, errors: ['未知顶层键：foo'] })
    expect(result.current.saveErrors).toEqual([])
    expect(saveConfig).toHaveBeenLastCalledWith(expect.any(Object), true)
  })

  it('reports a force save failure', async () => {
    const saveConfig = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('磁盘只读'), { errors: ['磁盘只读'] }))
    vi.stubGlobal('api', { saveConfig })
    const { result } = renderHook(() => useSaveConfig())
    let outcome: SaveResult | undefined
    await act(async () => {
      outcome = await result.current.forceSave()
    })
    expect(outcome).toEqual({ saved: false, errors: ['磁盘只读'] })
    expect(result.current.saveErrors).toEqual(['磁盘只读'])
  })
})
