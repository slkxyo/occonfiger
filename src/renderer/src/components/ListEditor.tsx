import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getAt } from '../fields/path'
import { useConfigStore } from '../store/configStore'
import { enterStyle } from './motion'

function ListItem(props: {
  name: string
  collapsible: boolean
  defaultCollapsed: boolean
  accessory?: React.ReactNode
  onDelete: () => void
  children: React.ReactNode
}): React.JSX.Element {
  const [open, setOpen] = useState(!props.defaultCollapsed)
  const content = <div className="pt-3">{props.children}</div>
  return (
    <div className="mb-3 rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {props.collapsible ? (
            <Button
              size="sm"
              variant="ghost"
              aria-expanded={open}
              aria-label={`${open ? '折叠' : '展开'} ${props.name}`}
              onClick={() => setOpen((v) => !v)}
              className="justify-start"
            >
              <span className="font-mono text-sm font-medium">
                <span
                  className="oc-rotate inline-block transition-transform duration-200"
                  style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                  ▸
                </span>{' '}
                {props.name}
              </span>
            </Button>
          ) : (
            <span className="font-mono text-sm font-medium">{props.name}</span>
          )}
          {props.accessory}
        </div>
        <Button size="xs" variant="destructive" onClick={props.onDelete}>
          删除
        </Button>
      </div>
      {props.collapsible ? (open ? content : null) : content}
    </div>
  )
}

export function ListEditor(props: {
  path: string[]
  collapsible?: boolean
  defaultCollapsed?: boolean
  sortKeys?: (keys: string[], container: Record<string, unknown>) => string[]
  titleAccessory?: (key: string) => React.ReactNode
  children: (key: string) => React.ReactNode
}): React.JSX.Element {
  const draft = useConfigStore((s) => s.draft)
  const deleteField = useConfigStore((s) => s.deleteField)
  const container = getAt(draft, props.path)
  const record =
    container && typeof container === 'object' && !Array.isArray(container)
      ? (container as Record<string, unknown>)
      : {}
  const rawKeys = Object.keys(record)
  const keys = props.sortKeys ? props.sortKeys(rawKeys, record) : rawKeys

  return (
    <div>
      {keys.map((key, index) => (
        <div key={key} className="oc-enter" style={enterStyle(index)}>
          <ListItem
            name={key}
            collapsible={props.collapsible === true}
            defaultCollapsed={props.defaultCollapsed === true}
            accessory={props.titleAccessory ? props.titleAccessory(key) : null}
            onDelete={() => deleteField([...props.path, key], { immediate: true })}
          >
            {props.children(key)}
          </ListItem>
        </div>
      ))}
    </div>
  )
}
