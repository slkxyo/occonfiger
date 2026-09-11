import { Button, HStack, Input, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { Box } from '@chakra-ui/react'
import { getAt } from '../fields/path'
import { useConfigStore } from '../store/configStore'

export function ListEditor(props: {
  path: string[]
  addLabel: string
  inputLabel: string
  placeholder?: string
  initialValue?: unknown
  children: (key: string) => React.ReactNode
}): React.JSX.Element {
  const [name, setName] = useState('')
  const draft = useConfigStore((s) => s.draft)
  const setField = useConfigStore((s) => s.setField)
  const deleteField = useConfigStore((s) => s.deleteField)
  const container = getAt(draft, props.path)
  const keys =
    container && typeof container === 'object' && !Array.isArray(container)
      ? Object.keys(container as Record<string, unknown>)
      : []

  return (
    <Box>
      <HStack mb="16px">
        <Input
          aria-label={props.inputLabel}
          placeholder={props.placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          size="sm"
          colorPalette="accent"
          onClick={() => {
            const trimmed = name.trim()
            if (!trimmed || keys.includes(trimmed)) {
              setName('')
              return
            }
            setField([...props.path, trimmed], props.initialValue ?? {})
            setName('')
          }}
        >
          {props.addLabel}
        </Button>
      </HStack>
      {keys.map((key) => (
        <Box
          key={key}
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="card"
          p="16px"
          mb="12px"
          bg="bg.default"
        >
          <HStack justify="space-between" mb="12px">
            <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
              {key}
            </Text>
            <Button
              size="xs"
              variant="ghost"
              colorPalette="error"
              onClick={() => deleteField([...props.path, key])}
            >
              删除
            </Button>
          </HStack>
          {props.children(key)}
        </Box>
      ))}
    </Box>
  )
}
