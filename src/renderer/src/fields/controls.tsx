import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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
  kind?: 'text' | 'number'
}): React.JSX.Element {
  const { value, set, clear, flush } = useField(props.path)
  const handleChange = (raw: string): void => {
    if (props.kind !== 'number') {
      set(raw)
      return
    }
    const trimmed = raw.trim()
    if (trimmed === '') {
      clear()
      return
    }
    const parsed = Number(trimmed)
    if (Number.isFinite(parsed) && parsed > 0) set(parsed)
  }
  return (
    <Field label={props.label} description={props.description}>
      {props.multiline ? (
        <Textarea
          aria-label={props.label}
          value={asString(value)}
          placeholder={props.placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => flush()}
        />
      ) : (
        <Input
          aria-label={props.label}
          value={asString(value)}
          placeholder={props.placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => flush()}
        />
      )}
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
        <p className="text-sm text-muted-foreground">
          {props.objectHint ?? '当前为对象配置，暂不支持可视化编辑'}
        </p>
      </Field>
    )
  }
  return (
    <Field label={props.label} description={props.description}>
      <div className="flex items-center gap-2">
        <Switch
          aria-label="禁用自动检测"
          checked={value === false}
          onCheckedChange={(checked) =>
            checked ? set(false, { immediate: true }) : clear({ immediate: true })
          }
        />
        <span className="text-sm">禁用自动检测</span>
      </div>
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
        onChange={(v) => (v === '' ? clear({ immediate: true }) : set(v, { immediate: true }))}
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
          set([...items, next], { immediate: true })
          input.value = ''
        }}
      />
      {items.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
              <span className="font-mono text-xs">{item}</span>
              <Button
                aria-label={`删除 ${item}`}
                size="icon-xs"
                variant="ghost"
                onClick={() =>
                  set(
                    items.filter((i) => i !== item),
                    { immediate: true }
                  )
                }
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </Field>
  )
}
