import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useConfigStore } from '../store/configStore'
import { useAutoSave } from './useAutoSave'

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useConfigStore.getState().loadConfig({ model: 'a/b' })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('debounces consecutive edits into a single save', async () => {
    const saveConfig = vi.fn().mockResolvedValue([])
    vi.stubGlobal('api', { saveConfig })
    renderHook(() => useAutoSave())
    act(() => {
      useConfigStore.getState().setField(['model'], 'c/d')
      useConfigStore.getState().setField(['model'], 'e/f')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })
    expect(saveConfig).toHaveBeenCalledTimes(1)
    expect(saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'e/f', $schema: 'https://opencode.ai/config.json' }),
      false
    )
  })

  it('saves immediately for immediate changes', async () => {
    const saveConfig = vi.fn().mockResolvedValue([])
    vi.stubGlobal('api', { saveConfig })
    renderHook(() => useAutoSave())
    act(() => {
      useConfigStore.getState().setField(['model'], 'c/d', { immediate: true })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(saveConfig).toHaveBeenCalledTimes(1)
    expect(useConfigStore.getState().saveState).toBe('saved')
  })

  it('records validation errors and keeps the draft', async () => {
    const saveConfig = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('校验未通过'), { errors: ['坏配置'] }))
    vi.stubGlobal('api', { saveConfig })
    const { result } = renderHook(() => useAutoSave())
    act(() => {
      useConfigStore.getState().setField(['model'], 'c/d', { immediate: true })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.saveErrors).toEqual(['坏配置'])
    expect(result.current.status).toContain('校验未通过')
    expect(useConfigStore.getState().draft.model).toBe('c/d')
  })

  it('force saves the current draft bypassing validation', async () => {
    const saveConfig = vi.fn().mockResolvedValue(['坏配置'])
    vi.stubGlobal('api', { saveConfig })
    const { result } = renderHook(() => useAutoSave())
    await act(async () => {
      await result.current.forceSave()
    })
    expect(saveConfig).toHaveBeenCalledWith(expect.any(Object), true)
  })
})
