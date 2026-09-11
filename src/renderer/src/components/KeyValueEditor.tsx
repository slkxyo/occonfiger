import { Button, HStack, IconButton, Input, Switch } from '@chakra-ui/react'
import { useState } from 'react'
import { Field } from '../fields/Field'
import { useField } from '../fields/useField'

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
  const { value, set } = useField(props.path)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newBoolean, setNewBoolean] = useState(false)
  const booleanValue = props.valueKind === 'boolean'
  const record: Record<string, unknown> = isRecord(value) ? value : {}
  const entries = Object.entries(record)

  const setValue = (key: string, next: unknown): void => {
    set({ ...record, [key]: next })
  }

  const renameKey = (oldKey: string, rawNext: string): void => {
    const next = rawNext.trim()
    if (!next || next === oldKey || next in record) return
    const output: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(record)) {
      output[key === oldKey ? next : key] = item
    }
    set(output)
  }

  const removeKey = (key: string): void => {
    const output: Record<string, unknown> = { ...record }
    delete output[key]
    set(output)
  }

  const addEntry = (): void => {
    const key = newKey.trim()
    if (!key || key in record) return
    set({ ...record, [key]: booleanValue ? newBoolean : newValue })
    setNewKey('')
    setNewValue('')
    setNewBoolean(false)
  }

  return (
    <Field label={props.label} description={props.description}>
      {entries.map(([key, item]) => (
        <HStack key={key} mb="8px">
          <Input
            aria-label={`${props.label} 键 ${key}`}
            defaultValue={key}
            onBlur={(e) => renameKey(key, e.target.value)}
          />
          {booleanValue ? (
            <Switch.Root checked={item === true} onCheckedChange={(e) => setValue(key, e.checked)}>
              <Switch.HiddenInput aria-label={`${props.label} 值 ${key}`} />
              <Switch.Control />
            </Switch.Root>
          ) : (
            <Input
              aria-label={`${props.label} 值 ${key}`}
              value={typeof item === 'string' ? item : String(item ?? '')}
              onChange={(e) => setValue(key, e.target.value)}
            />
          )}
          <IconButton
            aria-label={`删除 ${props.label} ${key}`}
            size="sm"
            variant="ghost"
            colorPalette="error"
            onClick={() => removeKey(key)}
          >
            ×
          </IconButton>
        </HStack>
      ))}
      <HStack>
        <Input
          aria-label={`${props.label} 新键`}
          placeholder="键"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
        {booleanValue ? (
          <Switch.Root checked={newBoolean} onCheckedChange={(e) => setNewBoolean(e.checked)}>
            <Switch.HiddenInput aria-label={`${props.label} 新值`} />
            <Switch.Control />
          </Switch.Root>
        ) : (
          <Input
            aria-label={`${props.label} 新值`}
            placeholder={props.valueLabel ?? '值'}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        )}
        <Button size="sm" colorPalette="accent" onClick={addEntry}>
          添加{props.label}
        </Button>
      </HStack>
    </Field>
  )
}
