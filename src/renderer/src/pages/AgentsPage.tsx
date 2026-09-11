import { Box, Button, HStack, Text, Textarea } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { Section } from '../components/Section'

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function AgentsPage(): React.JSX.Element {
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.api
      .readAgents()
      .then((text) => {
        setContent(text)
        setSaved(text)
      })
      .catch((e: unknown) => setError(toMessage(e)))
  }, [])

  const dirty = content !== saved

  const save = (): void => {
    if (saving || !dirty) return
    setSaving(true)
    setStatus('')
    setError('')
    window.api
      .writeAgents(content)
      .then(() => {
        setSaved(content)
        setStatus('已保存')
      })
      .catch((e: unknown) => setError(toMessage(e)))
      .finally(() => setSaving(false))
  }

  return (
    <Section
      title="全局提示词"
      description="编辑 opencode 的全局 AGENTS.md 提示词，保存后需重启 opencode 生效。"
    >
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
      <Textarea
        aria-label="全局提示词内容"
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          setStatus('')
        }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
            e.preventDefault()
            save()
          }
        }}
        fontFamily="mono"
        fontSize="sm"
        lineHeight="1.7"
        minH="60vh"
        p="16px"
        bg="bg.default"
        borderColor="border.default"
        borderRadius="card"
        resize="vertical"
        placeholder="在此编写全局提示词…"
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
          <Button size="sm" colorPalette="accent" disabled={!dirty || saving} onClick={save}>
            {saving ? '保存中…' : '保存'}
          </Button>
        </HStack>
      </HStack>
    </Section>
  )
}
