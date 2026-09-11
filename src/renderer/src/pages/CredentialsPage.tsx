import { Box, Button, HStack, Input, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { Section } from '../components/Section'

type Credential = { provider: string; type: string; keyTail?: string }

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function CredentialsPage(): React.JSX.Element {
  const [items, setItems] = useState<Credential[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [newKey, setNewKey] = useState('')
  const [error, setError] = useState('')

  const reload = (): Promise<void> =>
    window.api
      .listCredentials()
      .then((next) => {
        setItems(next)
        setError('')
      })
      .catch((e: unknown) => {
        setError(toMessage(e))
      })

  useEffect(() => {
    reload()
  }, [])

  return (
    <Section
      title="服务商凭证"
      description="管理 /connect 已连接的服务商。新增凭证请在 opencode 中运行 /connect 或 opencode auth login。"
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
      {!error && items.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          尚无已连接的服务商，请在 opencode 中运行 /connect 添加。
        </Text>
      ) : null}
      {items.map((item) => (
        <Box
          key={item.provider}
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="card"
          p="16px"
          mb="12px"
          bg="bg.default"
        >
          <HStack justify="space-between" mb="8px">
            <HStack gap="8px">
              <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
                {item.provider}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {item.type}
              </Text>
            </HStack>
            <HStack gap="8px">
              {item.type === 'api' ? (
                <Button size="xs" variant="ghost" onClick={() => setEditing(item.provider)}>
                  修改密钥
                </Button>
              ) : null}
              <Button
                size="xs"
                variant="ghost"
                colorPalette="error"
                aria-label={`删除 ${item.provider}`}
                onClick={() => {
                  if (!window.confirm(`确定删除 ${item.provider} 的凭证吗？`)) return
                  window.api
                    .deleteCredential(item.provider)
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
          <Text fontSize="xs" color="fg.muted" fontFamily="mono">
            {item.keyTail ? `••••${item.keyTail}` : '（OAuth，需在 opencode 中重新连接）'}
          </Text>
          {editing === item.provider ? (
            <HStack mt="12px">
              <Input
                aria-label="新密钥"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="sk-..."
              />
              <Button
                size="sm"
                colorPalette="accent"
                onClick={() => {
                  window.api
                    .updateCredentialKey(item.provider, newKey)
                    .then(() => {
                      setEditing(null)
                      setNewKey('')
                      reload()
                    })
                    .catch((e: unknown) => {
                      setError(toMessage(e))
                    })
                }}
              >
                保存密钥
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                取消
              </Button>
            </HStack>
          ) : null}
        </Box>
      ))}
    </Section>
  )
}
