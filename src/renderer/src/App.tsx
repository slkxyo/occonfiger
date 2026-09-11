import { useEffect, useState } from 'react'
import { Box, Text } from '@chakra-ui/react'
import { AppLayout } from './components/layout/AppLayout'
import { useConfigStore } from './store/configStore'

const NAV = [
  { id: 'general', label: '常规' },
  { id: 'model', label: '模型' },
  { id: 'provider', label: 'Provider' },
  { id: 'credentials', label: '服务商凭证' },
  { id: 'mcp', label: 'MCP 服务' },
  { id: 'permission', label: '权限' },
  { id: 'agent', label: 'Agents' },
  { id: 'command', label: 'Commands' },
  { id: 'skills', label: 'Skills 与 References' },
  { id: 'plugins', label: '插件与工具' },
  { id: 'advanced', label: '高级' },
  { id: 'files', label: '文件管理' }
]

export function App(): React.JSX.Element {
  const [active, setActive] = useState('general')
  const [configPath, setConfigPath] = useState('')
  const [error, setError] = useState<string | null>(null)
  const draft = useConfigStore((s) => s.draft)
  const dirty = useConfigStore((s) => s.dirty)
  const loadConfig = useConfigStore((s) => s.loadConfig)

  useEffect(() => {
    Promise.all([window.api.readConfig(), window.api.getConfigPath()])
      .then(([config, path]) => {
        loadConfig(config)
        setConfigPath(path)
        setError(null)
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : String(cause))
      })
  }, [loadConfig])

  return (
    <AppLayout
      navItems={NAV}
      active={active}
      onNavigate={setActive}
      configPath={configPath}
      dirty={dirty}
    >
      {error ? (
        <Box
          role="alert"
          mb="16px"
          p="12px 16px"
          borderWidth="1px"
          borderColor="error"
          borderRadius="control"
          color="error"
          bg="bg.subtle"
        >
          <Text fontSize="sm">配置读取失败：{error}</Text>
        </Box>
      ) : null}
      <Box>
        <Text fontSize="sm" color="fg.muted">
          当前页：{active}，字段数：{Object.keys(draft).length}
        </Text>
      </Box>
    </AppLayout>
  )
}

export default App
