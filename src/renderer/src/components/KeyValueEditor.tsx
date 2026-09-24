import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Field } from '../fields/Field'
import { useField } from '../fields/useField'
import type { ChangeOptions } from '../store/configStore'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function KeyValueEditor(props: {
  path: string[]
  label: string
  description?: string
  valueLabel?: string
  valueKind?: 'string' | 'boolean'
}): React.JSX.Element {
  const { value, set, flush } = useField(props.path)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newBoolean, setNewBoolean] = useState(false)
  const booleanValue = props.valueKind === 'boolean'
  const record: Record<string, unknown> = isRecord(value) ? value : {}
  const entries = Object.entries(record)

  const setValue = (key: string, next: unknown, options?: ChangeOptions): void => {
    set({ ...record, [key]: next }, options)
  }

  const renameKey = (oldKey: string, rawNext: string): void => {
    const next = rawNext.trim()
    if (!next || next === oldKey || next in record) return
    const output: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(record)) {
      output[key === oldKey ? next : key] = item
    }
    set(output, { immediate: true })
  }

  const removeKey = (key: string): void => {
    const output: Record<string, unknown> = { ...record }
    delete output[key]
    set(output, { immediate: true })
  }

  const addEntry = (): void => {
    const key = newKey.trim()
    if (!key || key in record) return
    set({ ...record, [key]: booleanValue ? newBoolean : newValue }, { immediate: true })
    setNewKey('')
    setNewValue('')
    setNewBoolean(false)
  }

  return (
    <Field label={props.label} description={props.description}>
      {entries.map(([key, item]) => (
        <div key={key} className="mb-2 flex items-center gap-2">
          <Input
            aria-label={`${props.label} 键 ${key}`}
            defaultValue={key}
            onBlur={(e) => renameKey(key, e.target.value)}
          />
          {booleanValue ? (
            <Switch
              aria-label={`${props.label} 值 ${key}`}
              checked={item === true}
              onCheckedChange={(checked) => setValue(key, checked, { immediate: true })}
            />
          ) : (
            <Input
              aria-label={`${props.label} 值 ${key}`}
              value={typeof item === 'string' ? item : String(item ?? '')}
              onChange={(e) => setValue(key, e.target.value)}
              onBlur={() => flush()}
            />
          )}
          <Button
            aria-label={`删除 ${props.label} ${key}`}
            size="icon-sm"
            variant="destructive"
            onClick={() => removeKey(key)}
          >
            ×
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Input
          aria-label={`${props.label} 新键`}
          placeholder="键"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
        {booleanValue ? (
          <Switch
            aria-label={`${props.label} 新值`}
            checked={newBoolean}
            onCheckedChange={setNewBoolean}
          />
        ) : (
          <Input
            aria-label={`${props.label} 新值`}
            placeholder={props.valueLabel ?? '值'}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        )}
        <Button size="sm" onClick={addEntry}>
          添加{props.label}
        </Button>
      </div>
    </Field>
  )
}
