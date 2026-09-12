import { Box, Button, HStack, Text } from '@chakra-ui/react'
import { useState } from 'react'
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
                <Box
                  as="span"
                  className="oc-rotate"
                  display="inline-block"
                  transition="transform 200ms cubic-bezier(0.16, 1, 0.3, 1)"
                  transform={open ? 'rotate(90deg)' : 'rotate(0deg)'}
                >
                  ▸
                </Box>{' '}
                {props.name}
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
    <Box>
      {keys.map((key, index) => (
        <Box key={key} className="oc-enter" style={enterStyle(index)}>
          <ListItem
            name={key}
            collapsible={props.collapsible === true}
            defaultCollapsed={props.defaultCollapsed === true}
            accessory={props.titleAccessory ? props.titleAccessory(key) : null}
            onDelete={() => deleteField([...props.path, key], { immediate: true })}
          >
            {props.children(key)}
          </ListItem>
        </Box>
      ))}
    </Box>
  )
}
