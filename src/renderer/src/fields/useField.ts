import { useConfigStore, type ChangeOptions } from '../store/configStore'
import { getAt } from './path'

export type FieldBinding = {
  key: string
  value: unknown
  set: (v: unknown, options?: ChangeOptions) => void
  clear: (options?: ChangeOptions) => void
  flush: () => void
}

export function useField(path: string[]): FieldBinding {
  const value = useConfigStore((s) => getAt(s.draft, path))
  const setField = useConfigStore((s) => s.setField)
  const deleteField = useConfigStore((s) => s.deleteField)
  const flush = useConfigStore((s) => s.flush)
  const key = path.join('.')
  return {
    key,
    value,
    set: (v, options) => setField(path, v, options),
    clear: (options) => deleteField(path, options),
    flush
  }
}
