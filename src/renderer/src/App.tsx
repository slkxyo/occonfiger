import { useEffect, useState } from 'react'
import { Box, Button, Text } from '@chakra-ui/react'
import {
  FolderOpen,
  History,
  KeyRound,
  MessageSquareText,
  Plug,
  Puzzle,
  Settings
} from 'lucide-react'
import { AppLayout } from './components/layout/AppLayout'
import { useConfigStore } from './store/configStore'
import { useAutoSave } from './hooks/useAutoSave'
import { McpPage } from './pages/McpPage'
import { CredentialsPage } from './pages/CredentialsPage'
import { FileManagerPage } from './pages/FileManagerPage'
import { AgentsPage } from './pages/AgentsPage'
import { SettingsPage } from './pages/SettingsPage'
import { PluginPage } from './pages/PluginPage'
import { SessionsPage } from './pages/SessionsPage'

const NAV = [
  { id: 'settings', label: '全局设置', icon: Settings },
  { id: 'mcp', label: 'MCP 服务', icon: Plug },
  { id: 'plugins', label: '插件管理', icon: Puzzle },
  { id: 'prompt', label: '全局提示词', icon: MessageSquareText },
  { id: 'credentials', label: '服务商凭证', icon: KeyRound },
  { id: 'files', label: 'SKILL 管理', icon: FolderOpen },
  { id: 'sessions', label: '会话管理', icon: History }
]

function CurrentPage({ id }: { id: string }): React.JSX.Element {
  if (id === 'mcp') return <McpPage />
  if (id === 'credentials') return <CredentialsPage />
  if (id === 'files') return <FileManagerPage />
  if (id === 'prompt') return <AgentsPage />
  if (id === 'settings') return <SettingsPage />
  if (id === 'plugins') return <PluginPage />
  if (id === 'sessions') return <SessionsPage />
  return <Text color="fg.muted">页面不存在。</Text>
}

export function App(): React.JSX.Element {
  const [active, setActive] = useState('mcp')
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const loadConfig = useConfigStore((s) => s.loadConfig)
  const { forceSave, status, saveErrors } = useAutoSave()

  useEffect(() => {
    window.api
      .readConfig()
      .then((config) => {
        loadConfig(config)
        setLoaded(true)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [loadConfig])

  return (
    <AppLayout navItems={NAV} active={active} onNavigate={setActive}>
      {error ? (
        <Box
          role="alert"
          className="oc-fade"
          borderWidth="1px"
          borderColor="error"
          borderRadius="card"
          p="12px"
          mb="16px"
        >
          <Text fontSize="sm" color="error">
            {error}
          </Text>
        </Box>
      ) : null}
      {saveErrors.length > 0 ? (
        <Box
          role="alert"
          className="oc-fade"
          borderWidth="1px"
          borderColor="error"
          borderRadius="card"
          p="12px"
          mb="16px"
        >
          <Text fontSize="sm" color="error" fontWeight="medium">
            校验未通过
          </Text>
          <Box as="ul" mt="4px" pl="16px">
            {saveErrors.map((item) => (
              <Box as="li" key={item}>
                <Text fontSize="sm" color="error">
                  {item}
                </Text>
              </Box>
            ))}
          </Box>
          <Button size="xs" mt="8px" colorPalette="error" onClick={forceSave}>
            强制保存
          </Button>
        </Box>
      ) : null}
      {!loaded && !error ? (
        <Text className="oc-fade" fontSize="sm" color="fg.muted">
          加载配置中…
        </Text>
      ) : null}
      {loaded && !error ? (
        <Box key={active} className="oc-enter">
          <CurrentPage id={active} />
        </Box>
      ) : null}
      {status ? (
        <Box className="oc-fade" mt="16px">
          <Text fontSize="sm" color="fg.muted">
            {status}
          </Text>
        </Box>
      ) : null}
    </AppLayout>
  )
}

export default App
