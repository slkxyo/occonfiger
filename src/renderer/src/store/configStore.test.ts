import { beforeEach, describe, expect, it } from 'vitest'
import { useConfigStore } from './configStore'

describe('configStore', () => {
  beforeEach(() => {
    useConfigStore.getState().loadConfig({})
  })

  it('loads and clears dirty', () => {
    useConfigStore.getState().loadConfig({ model: 'a/b' })
    expect(useConfigStore.getState().draft.model).toBe('a/b')
    expect(useConfigStore.getState().dirty).toBe(false)
  })

  it('sets a nested field and marks dirty', () => {
    useConfigStore.getState().setField(['permission', 'edit'], 'deny')
    expect(useConfigStore.getState().draft).toEqual({ permission: { edit: 'deny' } })
    expect(useConfigStore.getState().dirty).toBe(true)
  })

  it('deletes a field and cleans empty parents', () => {
    useConfigStore.getState().setField(['a', 'b'], 1)
    useConfigStore.getState().deleteField(['a', 'b'])
    expect(useConfigStore.getState().draft).toEqual({})
  })

  it('markSaved resets dirty', () => {
    useConfigStore.getState().setField(['model'], 'x')
    useConfigStore.getState().markSaved()
    expect(useConfigStore.getState().dirty).toBe(false)
  })

  it('discards changes back to the loaded snapshot', () => {
    useConfigStore.getState().loadConfig({ model: 'a/b' })
    useConfigStore.getState().setField(['model'], 'c/d')
    expect(useConfigStore.getState().dirty).toBe(true)
    useConfigStore.getState().discardChanges()
    expect(useConfigStore.getState().draft).toEqual({ model: 'a/b' })
    expect(useConfigStore.getState().dirty).toBe(false)
  })

  it('treats the saved draft as the new baseline', () => {
    useConfigStore.getState().loadConfig({ model: 'a/b' })
    useConfigStore.getState().setField(['model'], 'c/d')
    useConfigStore.getState().markSaved()
    useConfigStore.getState().discardChanges()
    expect(useConfigStore.getState().draft).toEqual({ model: 'c/d' })
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
