import {
  Box,
  Button,
  Dialog,
  HStack,
  IconButton,
  Input,
  Portal,
  Text,
  VStack
} from '@chakra-ui/react'
import { useState } from 'react'
import { getAt } from '../fields/path'
import { MenuSelect } from '../fields/MenuSelect'
import { Field } from '../fields/Field'
import { useConfigStore } from '../store/configStore'

export type FieldWhen = { field: string; equals: string }

export type CreateField =
  | {
      kind: 'text'
      key: string
      label: string
      placeholder?: string
      required?: boolean
      when?: FieldWhen
    }
  | {
      kind: 'select'
      key: string
      label: string
      options: string[]
      defaultValue?: string
      required?: boolean
      when?: FieldWhen
    }
  | {
      kind: 'tags'
      key: string
      label: string
      placeholder?: string
      required?: boolean
      when?: FieldWhen
    }

type FieldValues = Record<string, string | string[]>

function isFieldVisible(field: CreateField, values: FieldValues): boolean {
  if (!field.when) return true
  return values[field.when.field] === field.when.equals
}

function initValues(fields: CreateField[]): FieldValues {
  const out: FieldValues = {}
  for (const field of fields) {
    if (field.kind === 'select' && field.defaultValue) out[field.key] = field.defaultValue
  }
  return out
}

function CreateDialog(props: {
  addLabel: string
  nameLabel: string
  namePlaceholder?: string
  existingKeys: string[]
  createFields?: CreateField[]
  onCreate: (name: string, value: Record<string, unknown>) => void
  onClose: () => void
}): React.JSX.Element {
  const [name, setName] = useState('')
  const [values, setValues] = useState<FieldValues>(() => initValues(props.createFields ?? []))
  const [error, setError] = useState('')
  const fields = props.createFields ?? []

  const setValue = (key: string, value: string | string[]): void => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = (): void => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('名称不能为空。')
      return
    }
    if (props.existingKeys.includes(trimmed)) {
      setError('同名条目已存在。')
      return
    }
    const visible = fields.filter((field) => isFieldVisible(field, values))
    for (const field of visible) {
      if (!field.required) continue
      const value = values[field.key]
      const empty =
        value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
      if (empty) {
        setError(`「${field.label}」为必填项。`)
        return
      }
    }
    const result: Record<string, unknown> = {}
    for (const field of visible) {
      const value = values[field.key]
      if (typeof value === 'string' && value.trim() !== '') {
        result[field.key] = value.trim()
      } else if (Array.isArray(value) && value.length > 0) {
        result[field.key] = value
      }
    }
    props.onCreate(trimmed, result)
    props.onClose()
  }

  return (
    <Dialog.Root open onOpenChange={(e) => (e.open ? null : props.onClose())}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{props.addLabel}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap="16px">
                <Field label={props.nameLabel}>
                  <Input
                    aria-label={props.nameLabel}
                    placeholder={props.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </Field>
                {fields.map((field) =>
                  isFieldVisible(field, values) ? (
                    <Field key={field.key} label={field.label}>
                      {field.kind === 'text' ? (
                        <Input
                          aria-label={field.label}
                          placeholder={field.placeholder}
                          value={
                            typeof values[field.key] === 'string'
                              ? (values[field.key] as string)
                              : ''
                          }
                          onChange={(e) => setValue(field.key, e.target.value)}
                        />
                      ) : null}
                      {field.kind === 'select' ? (
                        <MenuSelect
                          ariaLabel={field.label}
                          options={field.options}
                          value={
                            typeof values[field.key] === 'string'
                              ? (values[field.key] as string)
                              : ''
                          }
                          allowEmpty={false}
                          onChange={(v) => setValue(field.key, v)}
                        />
                      ) : null}
                      {field.kind === 'tags' ? (
                        <TagsInput
                          label={field.label}
                          placeholder={field.placeholder}
                          items={
                            Array.isArray(values[field.key]) ? (values[field.key] as string[]) : []
                          }
                          onAdd={(item) =>
                            setValue(field.key, [
                              ...(Array.isArray(values[field.key])
                                ? (values[field.key] as string[])
                                : []),
                              item
                            ])
                          }
                          onRemove={(item) =>
                            setValue(
                              field.key,
                              (Array.isArray(values[field.key])
                                ? (values[field.key] as string[])
                                : []
                              ).filter((i) => i !== item)
                            )
                          }
                        />
                      ) : null}
                    </Field>
                  ) : null
                )}
                {error ? (
                  <Text role="alert" fontSize="sm" color="error">
                    {error}
                  </Text>
                ) : null}
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button size="sm" variant="ghost" onClick={props.onClose}>
                取消
              </Button>
              <Button size="sm" colorPalette="accent" onClick={handleSave}>
                保存
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

function TagsInput(props: {
  label: string
  placeholder?: string
  items: string[]
  onAdd: (item: string) => void
  onRemove: (item: string) => void
}): React.JSX.Element {
  return (
    <Box>
      <Input
        aria-label={props.label}
        placeholder={props.placeholder ?? '回车添加'}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return
          e.preventDefault()
          const input = e.currentTarget
          const next = input.value.trim()
          if (!next || props.items.includes(next)) return
          props.onAdd(next)
          input.value = ''
        }}
      />
      {props.items.length > 0 ? (
        <HStack mt="8px" gap="8px" wrap="wrap">
          {props.items.map((item) => (
            <HStack key={item} gap="4px" bg="bg.muted" borderRadius="control" px="8px" py="2px">
              <Text fontSize="xs" fontFamily="mono">
                {item}
              </Text>
              <IconButton
                aria-label={`删除 ${item}`}
                size="2xs"
                variant="ghost"
                onClick={() => props.onRemove(item)}
              >
                ×
              </IconButton>
            </HStack>
          ))}
        </HStack>
      ) : null}
    </Box>
  )
}

function ListItem(props: {
  name: string
  collapsible: boolean
  defaultCollapsed: boolean
  accessory?: React.ReactNode
  onDelete: () => void
  children: React.ReactNode
}): React.JSX.Element {
  const [open, setOpen] = useState(!props.defaultCollapsed)
  const content = <Box pt="12px">{props.children}</Box>
  return (
    <Box
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      p="16px"
      mb="12px"
      bg="bg.default"
    >
      <HStack justify="space-between">
        <HStack gap="12px">
          {props.collapsible ? (
            <Button
              size="sm"
              variant="ghost"
              aria-expanded={open}
              aria-label={`${open ? '折叠' : '展开'} ${props.name}`}
              onClick={() => setOpen((v) => !v)}
            >
              <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
                {open ? '▾' : '▸'} {props.name}
              </Text>
            </Button>
          ) : (
            <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
              {props.name}
            </Text>
          )}
          {props.accessory}
        </HStack>
        <Button size="xs" variant="ghost" colorPalette="error" onClick={props.onDelete}>
          删除
        </Button>
      </HStack>
      {props.collapsible ? (open ? content : null) : content}
    </Box>
  )
}

export function ListEditor(props: {
  path: string[]
  addLabel: string
  inputLabel: string
  placeholder?: string
  createFields?: CreateField[]
  hideAdd?: boolean
  collapsible?: boolean
  defaultCollapsed?: boolean
  sortKeys?: (keys: string[], container: Record<string, unknown>) => string[]
  titleAccessory?: (key: string) => React.ReactNode
  children: (key: string) => React.ReactNode
}): React.JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false)
  const draft = useConfigStore((s) => s.draft)
  const setField = useConfigStore((s) => s.setField)
  const deleteField = useConfigStore((s) => s.deleteField)
  const container = getAt(draft, props.path)
  const record =
    container && typeof container === 'object' && !Array.isArray(container)
      ? (container as Record<string, unknown>)
      : {}
  const rawKeys = Object.keys(record)
  const keys = props.sortKeys ? props.sortKeys(rawKeys, record) : rawKeys

  return (
    <Box>
      {props.hideAdd ? null : (
        <Button size="sm" colorPalette="accent" mb="16px" onClick={() => setDialogOpen(true)}>
          {props.addLabel}
        </Button>
      )}
      {keys.map((key) => (
        <ListItem
          key={key}
          name={key}
          collapsible={props.collapsible === true}
          defaultCollapsed={props.defaultCollapsed === true}
          accessory={props.titleAccessory ? props.titleAccessory(key) : null}
          onDelete={() => deleteField([...props.path, key])}
        >
          {props.children(key)}
        </ListItem>
      ))}
      {dialogOpen ? (
        <CreateDialog
          addLabel={props.addLabel}
          nameLabel={props.inputLabel}
          namePlaceholder={props.placeholder}
          existingKeys={keys}
          createFields={props.createFields}
          onClose={() => setDialogOpen(false)}
          onCreate={(name, value) => setField([...props.path, name], value)}
        />
      ) : null}
    </Box>
  )
}
