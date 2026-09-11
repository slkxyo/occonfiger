import { useConfigStore } from '../store/configStore'
import { getAt } from './path'

export type FieldBinding = {
  key: string
  value: unknown
  set: (v: unknown) => void
  clear: () => void
}

export function useField(path: string[]): FieldBinding {
  const value = useConfigStore((s) => getAt(s.draft, path))
  const setField = useConfigStore((s) => s.setField)
  const deleteField = useConfigStore((s) => s.deleteField)
  const key = path.join('.')
  return {
    key,
    value,
    set: (v: unknown) => setField(path, v),
    clear: () => deleteField(path)
  }
}
