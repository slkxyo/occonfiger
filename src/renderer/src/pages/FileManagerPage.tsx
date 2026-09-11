import { Box, Button, Flex, HStack, Input, Text, Textarea } from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'
import { Section } from '../components/Section'

type ManagedFile = { name: string; path: string }

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function FileManagerPage(): React.JSX.Element {
  const [files, setFiles] = useState<ManagedFile[]>([])
  const [selected, setSelected] = useState('')
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const reload = useCallback((): Promise<void> => {
    return window.api
      .listManagedFiles('skill')
      .then((next) => {
        setFiles(next)
        setError('')
      })
      .catch((e: unknown) => setError(toMessage(e)))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const select = (skill: string): void => {
    setSelected(skill)
    setStatus('')
    setError('')
    window.api
      .readManagedFile('skill', skill)
      .then((text) => {
        setContent(text)
        setSaved(text)
      })
      .catch((e: unknown) => setError(toMessage(e)))
  }

  const dirty = content !== saved

  const save = (): void => {
    if (!selected || saving || !dirty) return
    setSaving(true)
    setStatus('')
    setError('')
    window.api
      .writeManagedFile('skill', selected, content)
      .then(() => {
        setSaved(content)
        setStatus('已保存')
      })
      .catch((e: unknown) => setError(toMessage(e)))
      .finally(() => setSaving(false))
  }

  return (
    <Section title="SKILL 管理" description="管理 skills 目录下的 SKILL，可直接预览并编辑内容。">
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
          placeholder="新 SKILL 名称"
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          size="sm"
          colorPalette="accent"
          onClick={() => {
            const next = name.trim()
            if (!next) return
            window.api
              .createManagedFile('skill', next)
              .then(() => {
                setName('')
                reload()
              })
              .catch((e: unknown) => setError(toMessage(e)))
          }}
        >
          新建
        </Button>
      </HStack>
      <Flex gap="16px" align="stretch">
        <Box w="220px" flexShrink={0} maxH="60vh" overflowY="auto">
          {files.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              暂无 SKILL。
            </Text>
          ) : (
            files.map((file) => (
              <Button
                key={file.path}
                variant={selected === file.name ? 'subtle' : 'ghost'}
                colorPalette={selected === file.name ? 'accent' : undefined}
                justifyContent="flex-start"
                w="100%"
                mb="4px"
                fontFamily="mono"
                fontWeight="normal"
                onClick={() => select(file.name)}
              >
                {file.name}
              </Button>
            ))
          )}
        </Box>
        <Box flex="1" minW="0">
          {selected ? (
            <>
              <HStack justify="space-between" mb="8px">
                <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
                  {selected}
                </Text>
                <HStack gap="8px">
                  <Button
                    size="xs"
                    variant="ghost"
                    aria-label={`打开 ${selected}`}
                    onClick={() => {
                      window.api.openManagedFile('skill', selected).catch((e: unknown) => {
                        setError(toMessage(e))
                      })
                    }}
                  >
                    打开
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    aria-label={`重命名 ${selected}`}
                    onClick={() => {
                      const next = window.prompt('新名称', selected)
                      if (!next || next === selected) return
                      window.api
                        .renameManagedFile('skill', selected, next)
                        .then(() => {
                          setSelected(next)
                          reload()
                        })
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
                    aria-label={`删除 ${selected}`}
                    onClick={() => {
                      if (!window.confirm(`确定删除 ${selected} 吗？`)) return
                      window.api
                        .deleteManagedFile('skill', selected)
                        .then(() => {
                          setSelected('')
                          setContent('')
                          setSaved('')
                          reload()
                        })
                        .catch((e: unknown) => {
                          setError(toMessage(e))
                        })
                    }}
                  >
                    删除
                  </Button>
                </HStack>
              </HStack>
              <Textarea
                aria-label="SKILL 内容"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  setStatus('')
                }}
                fontFamily="mono"
                fontSize="sm"
                lineHeight="1.7"
                minH="52vh"
                p="16px"
                bg="bg.default"
                borderColor="border.default"
                borderRadius="card"
                resize="vertical"
              />
              <HStack justify="space-between" mt="12px">
                <Text fontSize="xs" color="fg.muted">
                  {content.length} 字符
                </Text>
                <HStack gap="12px">
                  {status ? (
                    <Text fontSize="sm" color="fg.muted">
                      {status}
                    </Text>
                  ) : dirty ? (
                    <Text fontSize="sm" color="fg.muted">
                      有未保存的修改
                    </Text>
                  ) : null}
                  <Button
                    size="sm"
                    colorPalette="accent"
                    disabled={!dirty || saving}
                    onClick={save}
                  >
                    {saving ? '保存中…' : '保存'}
                  </Button>
                </HStack>
              </HStack>
            </>
          ) : (
            <Flex
              align="center"
              justify="center"
              h="52vh"
              borderWidth="1px"
              borderColor="border.default"
              borderRadius="card"
              bg="bg.default"
            >
              <Text fontSize="sm" color="fg.muted">
                请选择一个 SKILL。
              </Text>
            </Flex>
          )}
        </Box>
      </Flex>
    </Section>
  )
}
