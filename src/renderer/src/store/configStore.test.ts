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
})
