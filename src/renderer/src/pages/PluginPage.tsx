import { Box, Button, HStack, Switch, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { Section } from '../components/Section'
import { enterStyle } from '../components/motion'
import { ConfigViewButton } from '../components/ConfigViewButton'

type Plugin = { name: string; enabled: boolean; spec: unknown }

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function PluginPage(): React.JSX.Element {
  const [items, setItems] = useState<Plugin[]>([])
  const [error, setError] = useState('')

  const reload = (): Promise<void> =>
    window.api
      .listPlugins()
      .then((next) => {
        setItems(next)
        setError('')
      })
      .catch((e: unknown) => setError(toMessage(e)))

  useEffect(() => {
    reload()
  }, [])

  const toggle = (item: Plugin): void => {
    window.api
      .setPluginEnabled(item.name, !item.enabled)
      .then(reload)
      .catch((e: unknown) => setError(toMessage(e)))
  }

  const remove = (item: Plugin): void => {
    if (!window.confirm(`确定删除插件 ${item.name} 吗？`)) return
    window.api
      .deletePlugin(item.name)
      .then(reload)
      .catch((e: unknown) => setError(toMessage(e)))
  }

  const sorted = [...items].sort((a, b) => Number(b.enabled) - Number(a.enabled))

  return (
    <Section
      title="插件管理"
      description="管理 opencode.jsonc 中 plugins 数组的插件。停用会移出配置并记录，重新启用可原样还原。"
      action={<ConfigViewButton />}
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
      {!error && sorted.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          尚未配置任何插件，可在 opencode.jsonc 中添加 plugins 后返回本页。
        </Text>
      ) : null}
      {sorted.map((item, index) => (
        <Box
          key={item.name}
          className="oc-enter"
          style={enterStyle(index)}
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="card"
          p="16px"
          mb="12px"
          bg="bg.default"
          opacity={item.enabled ? 1 : 0.65}
        >
          <HStack justify="space-between">
            <HStack gap="8px">
              <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
                {item.name}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {item.enabled ? '已启用' : '已停用'}
              </Text>
            </HStack>
            <HStack gap="8px">
              <Switch.Root checked={item.enabled} onCheckedChange={() => toggle(item)}>
                <Switch.HiddenInput aria-label={`${item.name} 启用`} />
                <Switch.Control />
              </Switch.Root>
              <Button
                size="xs"
                variant="ghost"
                colorPalette="error"
                aria-label={`删除 ${item.name}`}
                onClick={() => remove(item)}
              >
                删除
              </Button>
            </HStack>
          </HStack>
        </Box>
      ))}
    </Section>
  )
}
