import { create } from 'zustand'

type Draft = Record<string, unknown>

function clone<T>(value: T): T {
  return structuredClone(value)
}

function setAt(root: Draft, path: string[], value: unknown): void {
  let node = root
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i]
    if (typeof node[key] !== 'object' || node[key] === null) node[key] = {}
    node = node[key] as Draft
  }
  node[path[path.length - 1]] = value
}

function deleteAt(root: Draft, path: string[]): void {
  const parents: Draft[] = [root]
  let node = root
  for (let i = 0; i < path.length - 1; i += 1) {
    const next = node[path[i]]
    if (typeof next !== 'object' || next === null) return
    node = next as Draft
    parents.push(node)
  }
  delete node[path[path.length - 1]]
  for (let i = parents.length - 1; i > 0; i -= 1) {
    if (Object.keys(parents[i]).length === 0) delete parents[i - 1][path[i - 1]]
    else break
  }
}

type ConfigState = {
  draft: Draft
  original: Draft
  dirty: boolean
  loadConfig: (data: Draft) => void
  setField: (path: string[], value: unknown) => void
  deleteField: (path: string[]) => void
  markSaved: () => void
  discardChanges: () => void
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  draft: {},
  original: {},
  dirty: false,
  loadConfig: (data) => set({ draft: clone(data), original: clone(data), dirty: false }),
  setField: (path, value) => {
    const draft = clone(get().draft)
    setAt(draft, path, value)
    set({ draft, dirty: true })
  },
  deleteField: (path) => {
    const draft = clone(get().draft)
    deleteAt(draft, path)
    set({ draft, dirty: true })
  },
  markSaved: () => set({ original: clone(get().draft), dirty: false }),
  discardChanges: () => set({ draft: clone(get().original), dirty: false })
}))
