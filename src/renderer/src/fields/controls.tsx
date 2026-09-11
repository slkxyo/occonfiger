import { HStack, IconButton, Input, Switch, Text, Textarea } from '@chakra-ui/react'
import { Field } from './Field'
import { useField } from './useField'

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

export function TextField(props: {
  path: string[]
  label: string
  description?: string
  placeholder?: string
  multiline?: boolean
}): React.JSX.Element {
  const { value, set } = useField(props.path)
  return (
    <Field label={props.label} description={props.description}>
      {props.multiline ? (
        <Textarea
          aria-label={props.label}
          value={asString(value)}
          placeholder={props.placeholder}
          onChange={(e) => set(e.target.value)}
        />
      ) : (
        <Input
          aria-label={props.label}
          value={asString(value)}
          placeholder={props.placeholder}
          onChange={(e) => set(e.target.value)}
        />
      )}
    </Field>
  )
}

export function NumberField(props: {
  path: string[]
  label: string
  description?: string
}): React.JSX.Element {
  const { value, set, clear } = useField(props.path)
  return (
    <Field label={props.label} description={props.description}>
      <Input
        aria-label={props.label}
        type="number"
        value={typeof value === 'number' ? value : ''}
        onChange={(e) => (e.target.value === '' ? clear() : set(Number(e.target.value)))}
      />
    </Field>
  )
}

export function SwitchField(props: {
  path: string[]
  label: string
  description?: string
}): React.JSX.Element {
  const { value, set } = useField(props.path)
  return (
    <Field label={props.label} description={props.description}>
      <Switch.Root checked={value === true} onCheckedChange={(e) => set(e.checked)}>
        <Switch.HiddenInput aria-label={props.label} />
        <Switch.Control />
      </Switch.Root>
    </Field>
  )
}

export function SelectField(props: {
  path: string[]
  label: string
  description?: string
  options: string[]
  allowEmpty?: boolean
}): React.JSX.Element {
  const { value, set, clear } = useField(props.path)
  return (
    <Field label={props.label} description={props.description}>
      <select
        aria-label={props.label}
        value={asString(value)}
        onChange={(e) => (e.target.value === '' ? clear() : set(e.target.value))}
        style={{
          width: '100%',
          height: '32px',
          borderRadius: '8px',
          border: '1px solid var(--chakra-colors-border-default)',
          background: 'var(--chakra-colors-bg-default)',
          color: 'inherit',
          padding: '0 8px'
        }}
      >
        {props.allowEmpty !== false ? <option value="">（未设置）</option> : null}
        {props.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function TagsField(props: {
  path: string[]
  label: string
  description?: string
  placeholder?: string
}): React.JSX.Element {
  const { value, set } = useField(props.path)
  const items = asArray(value)
  return (
    <Field label={props.label} description={props.description}>
      <Input
        aria-label={props.label}
        placeholder={props.placeholder}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return
          e.preventDefault()
          const input = e.currentTarget
          const next = input.value.trim()
          if (!next || items.includes(next)) return
          set([...items, next])
          input.value = ''
        }}
      />
      {items.length > 0 ? (
        <HStack mt="8px" gap="8px" wrap="wrap">
          {items.map((item) => (
            <HStack key={item} gap="4px" bg="bg.muted" borderRadius="control" px="8px" py="2px">
              <Text fontSize="xs" fontFamily="mono">
                {item}
              </Text>
              <IconButton
                aria-label={`删除 ${item}`}
                size="2xs"
                variant="ghost"
                onClick={() => set(items.filter((i) => i !== item))}
              >
                ×
              </IconButton>
            </HStack>
          ))}
        </HStack>
      ) : null}
    </Field>
  )
}
