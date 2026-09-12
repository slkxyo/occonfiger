import { create } from 'zustand'
import { deleteAt, setAt } from '../fields/path'

type Draft = Record<string, unknown>

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export type ChangeOptions = { immediate?: boolean }

export const SAVE_DEBOUNCE_MS = 600

function clone<T>(value: T): T {
  return structuredClone(value)
}

type ConfigState = {
  draft: Draft
  revision: number
  savedRevision: number
  saveDelay: number
  saveState: SaveState
  saveErrors: string[]
  loadConfig: (data: Draft) => void
  setField: (path: string[], value: unknown, options?: ChangeOptions) => void
  deleteField: (path: string[], options?: ChangeOptions) => void
  flush: () => void
  beginSave: () => void
  markSaved: (revision?: number) => void
  markSaveError: (errors: string[]) => void
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  draft: {},
  revision: 0,
  savedRevision: 0,
  saveDelay: SAVE_DEBOUNCE_MS,
  saveState: 'idle',
  saveErrors: [],
  loadConfig: (data) =>
    set({
      draft: clone(data),
      revision: 0,
      savedRevision: 0,
      saveDelay: SAVE_DEBOUNCE_MS,
      saveState: 'idle',
      saveErrors: []
    }),
  setField: (path, value, options) => {
    const draft = clone(get().draft)
    setAt(draft, path, value)
    set({
      draft,
      revision: get().revision + 1,
      saveDelay: options?.immediate ? 0 : SAVE_DEBOUNCE_MS
    })
  },
  deleteField: (path, options) => {
    const draft = clone(get().draft)
    deleteAt(draft, path)
    set({
      draft,
      revision: get().revision + 1,
      saveDelay: options?.immediate ? 0 : SAVE_DEBOUNCE_MS
    })
  },
  flush: () => {
    if (get().revision === get().savedRevision) return
    set({ revision: get().revision + 1, saveDelay: 0 })
  },
  beginSave: () => set({ saveState: 'saving' }),
  markSaved: (revision) =>
    set({
      saveState: 'saved',
      saveErrors: [],
      savedRevision: revision ?? get().revision
    }),
  markSaveError: (errors) => set({ saveState: 'error', saveErrors: errors })
}))
