import { Box, Button, HStack, Input, Tabs, Text } from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'
import { Section } from '../components/Section'

export type ManagedKind = 'agent' | 'command' | 'skill'
type ManagedFile = { name: string; path: string }

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

const TABS: { kind: ManagedKind; label: string }[] = [
  { kind: 'agent', label: 'Agents' },
  { kind: 'command', label: 'Commands' },
  { kind: 'skill', label: 'Skills' }
]

function KindPanel({ kind }: { kind: ManagedKind }): React.JSX.Element {
  const [files, setFiles] = useState<ManagedFile[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const reload = useCallback((): Promise<void> => {
    return window.api
      .listManagedFiles(kind)
      .then((next) => {
        setFiles(next)
        setError('')
      })
      .catch((e: unknown) => {
        setError(toMessage(e))
      })
  }, [kind])

  useEffect(() => {
    reload()
  }, [reload])

  return (
    <Box pt="16px">
      {error ? (
        <Box
          role="alert"
          borderWidth="1px"
          borderColor="error"
          borderRadius="card"
          p="12px"
          mb="12px"
        >
          <Text fontSize="sm" color="error">
            操作失败：{error}
          </Text>
        </Box>
      ) : null}
      <HStack mb="16px">
        <Input
          aria-label="新建名称"
          value={name}
          placeholder="名称"
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          size="sm"
          colorPalette="accent"
          onClick={() => {
            if (!name.trim()) return
            window.api
              .createManagedFile(kind, name.trim())
              .then(() => {
                setName('')
                reload()
              })
              .catch((e: unknown) => {
                setError(toMessage(e))
              })
          }}
        >
          新建
        </Button>
      </HStack>
      {!error && files.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          该目录下暂无文件。
        </Text>
      ) : (
        files.map((file) => (
          <HStack
            key={file.path}
            justify="space-between"
            borderWidth="1px"
            borderColor="border.default"
            borderRadius="card"
            p="12px"
            mb="8px"
            bg="bg.default"
          >
            <Text fontFamily="mono" fontSize="sm">
              {file.name}
            </Text>
            <HStack gap="8px">
              <Button
                size="xs"
                variant="ghost"
                aria-label={`打开 ${file.name}`}
                onClick={() => {
                  window.api.openManagedFile(kind, file.name).catch((e: unknown) => {
                    setError(toMessage(e))
                  })
                }}
              >
                打开
              </Button>
              <Button
                size="xs"
                variant="ghost"
                aria-label={`重命名 ${file.name}`}
                onClick={() => {
                  const next = window.prompt('新名称', file.name.replace(/\.md$/, ''))
                  if (!next) return
                  window.api
                    .renameManagedFile(kind, file.name, next)
                    .then(reload)
                    .catch((e: unknown) => {
                      setError(toMessage(e))
                    })
                }}
              >
                重命名
              </Button>
              <Button
                size="xs"
                variant="ghost"
                colorPalette="error"
                aria-label={`删除 ${file.name}`}
                onClick={() => {
                  if (!window.confirm(`确定删除 ${file.name} 吗？`)) return
                  window.api
                    .deleteManagedFile(kind, file.name)
                    .then(reload)
                    .catch((e: unknown) => {
                      setError(toMessage(e))
                    })
                }}
              >
                删除
              </Button>
            </HStack>
          </HStack>
        ))
      )}
    </Box>
  )
}

export function FileManagerPage(): React.JSX.Element {
  return (
    <Section
      title="文件管理"
      description="管理 agent / command / skill 目录下的文件。内容请用系统编辑器打开后编辑。"
    >
      <Tabs.Root defaultValue="agent" lazyMount unmountOnExit>
        <Tabs.List>
          {TABS.map((tab) => (
            <Tabs.Trigger key={tab.kind} value={tab.kind}>
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {TABS.map((tab) => (
          <Tabs.Content key={tab.kind} value={tab.kind}>
            <KindPanel kind={tab.kind} />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </Section>
  )
}
