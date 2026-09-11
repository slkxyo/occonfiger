import { Button, HStack, IconButton, Input, Switch, Text, Textarea } from '@chakra-ui/react'
import { Field } from './Field'
import { MenuSelect } from './MenuSelect'
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

export function ValidatedTextField(props: {
  path: string[]
  label: string
  description?: string
  placeholder?: string
  validate: (value: string) => string | null
}): React.JSX.Element {
  const { value, set } = useField(props.path)
  const text = asString(value)
  const error = props.validate(text)
  return (
    <Field label={props.label} description={props.description}>
      <Input
        aria-label={props.label}
        value={text}
        placeholder={props.placeholder}
        borderColor={error ? 'error' : undefined}
        onChange={(e) => set(e.target.value)}
      />
      {error ? (
        <Text role="alert" fontSize="xs" color="error" mt="4px">
          {error}
        </Text>
      ) : null}
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

export function BoolOrObjectField(props: {
  path: string[]
  label: string
  description?: string
  objectHint?: string
}): React.JSX.Element {
  const { value, set } = useField(props.path)
  if (typeof value === 'object' && value !== null) {
    return (
      <Field label={props.label} description={props.description}>
        <Text fontSize="sm" color="fg.muted">
          {props.objectHint ?? '当前为对象配置，暂不支持可视化编辑'}
        </Text>
        <Button
          size="sm"
          variant="outline"
          mt="8px"
          onClick={() => {
            if (window.confirm('转为启用（布尔）将替换当前对象配置，确定继续？')) set(true)
          }}
        >
          转为启用（布尔）
        </Button>
      </Field>
    )
  }
  return (
    <Field label={props.label} description={props.description}>
      <Switch.Root checked={value === true} onCheckedChange={(e) => set(e.checked)}>
        <Switch.HiddenInput aria-label={props.label} />
        <Switch.Control />
      </Switch.Root>
    </Field>
  )
}

export function OAuthField(props: {
  path: string[]
  label: string
  description?: string
  objectHint?: string
}): React.JSX.Element {
  const { value, set, clear } = useField(props.path)
  if (typeof value === 'object' && value !== null) {
    return (
      <Field label={props.label} description={props.description}>
        <Text fontSize="sm" color="fg.muted">
          {props.objectHint ?? '当前为对象配置，暂不支持可视化编辑'}
        </Text>
      </Field>
    )
  }
  return (
    <Field label={props.label} description={props.description}>
      <Switch.Root
        checked={value === false}
        onCheckedChange={(e) => (e.checked ? set(false) : clear())}
      >
        <Switch.HiddenInput aria-label="禁用自动检测" />
        <Switch.Control />
        <Switch.Label>禁用自动检测</Switch.Label>
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
      <MenuSelect
        ariaLabel={props.label}
        options={props.options}
        value={asString(value)}
        allowEmpty={props.allowEmpty}
        onChange={(v) => (v === '' ? clear() : set(v))}
      />
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

export function PluginField(props: {
  path: string[]
  label: string
  description?: string
  placeholder?: string
}): React.JSX.Element {
  const { value, set } = useField(props.path)
  const items = Array.isArray(value) ? value : []
  const labels = items.map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
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
          {items.map((_, index) => (
            <HStack key={index} gap="4px" bg="bg.muted" borderRadius="control" px="8px" py="2px">
              <Text fontSize="xs" fontFamily="mono">
                {labels[index]}
              </Text>
              <IconButton
                aria-label={`删除 ${labels[index]}`}
                size="2xs"
                variant="ghost"
                onClick={() => set(items.filter((_, i) => i !== index))}
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
