import { Box, Button, HStack, Input, Tabs, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { Section } from '../components/Section'

type ManagedKind = 'agent' | 'command' | 'skill'
type ManagedFile = { name: string; path: string }

const TABS: { kind: ManagedKind; label: string }[] = [
  { kind: 'agent', label: 'Agents' },
  { kind: 'command', label: 'Commands' },
  { kind: 'skill', label: 'Skills' }
]

function KindPanel({ kind }: { kind: ManagedKind }): React.JSX.Element {
  const [files, setFiles] = useState<ManagedFile[]>([])
  const [name, setName] = useState('')

  const reload = (): Promise<void> => window.api.listManagedFiles(kind).then(setFiles)

  useEffect(() => {
    window.api.listManagedFiles(kind).then(setFiles)
  }, [kind])

  return (
    <Box pt="16px">
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
            window.api.createManagedFile(kind, name.trim()).then(() => {
              setName('')
              reload()
            })
          }}
        >
          新建
        </Button>
      </HStack>
      {files.length === 0 ? (
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
                onClick={() => window.api.openManagedFile(kind, file.name)}
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
                  window.api.renameManagedFile(kind, file.name, next).then(reload)
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
                  window.api.deleteManagedFile(kind, file.name).then(reload)
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
