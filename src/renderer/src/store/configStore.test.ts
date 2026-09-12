import { beforeEach, describe, expect, it } from 'vitest'
import { useConfigStore } from './configStore'

describe('configStore', () => {
  beforeEach(() => {
    useConfigStore.getState().loadConfig({})
  })

  it('loads a draft and resets save state', () => {
    useConfigStore.getState().loadConfig({ model: 'a/b' })
    const state = useConfigStore.getState()
    expect(state.draft.model).toBe('a/b')
    expect(state.revision).toBe(0)
    expect(state.saveState).toBe('idle')
    expect(state.saveErrors).toEqual([])
  })

  it('sets a nested field and bumps revision with debounce delay', () => {
    useConfigStore.getState().setField(['permission', 'edit'], 'deny')
    const state = useConfigStore.getState()
    expect(state.draft).toEqual({ permission: { edit: 'deny' } })
    expect(state.revision).toBe(1)
    expect(state.saveDelay).toBe(600)
  })

  it('marks immediate changes with zero delay', () => {
    useConfigStore.getState().setField(['model'], 'a/b', { immediate: true })
    expect(useConfigStore.getState().saveDelay).toBe(0)
    useConfigStore.getState().setField(['model'], 'c/d')
    expect(useConfigStore.getState().saveDelay).toBe(600)
  })

  it('deletes a field and cleans empty parents', () => {
    useConfigStore.getState().setField(['a', 'b'], 1)
    useConfigStore.getState().deleteField(['a', 'b'], { immediate: true })
    expect(useConfigStore.getState().draft).toEqual({})
  })

  it('tracks the save lifecycle', () => {
    useConfigStore.getState().beginSave()
    expect(useConfigStore.getState().saveState).toBe('saving')
    useConfigStore.getState().markSaveError(['坏配置'])
    expect(useConfigStore.getState().saveState).toBe('error')
    expect(useConfigStore.getState().saveErrors).toEqual(['坏配置'])
    useConfigStore.getState().markSaved()
    expect(useConfigStore.getState().saveState).toBe('saved')
    expect(useConfigStore.getState().saveErrors).toEqual([])
  })

  it('flushes only when there are unsaved changes', () => {
    useConfigStore.getState().setField(['model'], 'a/b', { immediate: true })
    const before = useConfigStore.getState().revision
    useConfigStore.getState().flush()
    expect(useConfigStore.getState().revision).toBe(before + 1)
    expect(useConfigStore.getState().saveDelay).toBe(0)
    useConfigStore.getState().markSaved()
    const saved = useConfigStore.getState().revision
    useConfigStore.getState().flush()
    expect(useConfigStore.getState().revision).toBe(saved)
  })

  it('preserves unknown fields when editing one field', () => {
    useConfigStore.getState().loadConfig({
      model: 'a/b',
      mode: 'build',
      reference: { alias: { path: './x.md' } },
      totally_unknown: [1, 2, 3]
    })
    useConfigStore.getState().setField(['model'], 'c/d')
    expect(useConfigStore.getState().draft).toEqual({
      model: 'c/d',
      mode: 'build',
      reference: { alias: { path: './x.md' } },
      totally_unknown: [1, 2, 3]
    })
  })
})
