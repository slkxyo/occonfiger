import { useEffect, useState } from 'react'
import { Box, Button, Text } from '@chakra-ui/react'
import { Braces, FolderOpen, KeyRound, MessageSquareText, Plug, Settings } from 'lucide-react'
import { AppLayout } from './components/layout/AppLayout'
import { RawJsonView } from './components/RawJsonView'
import { UnsavedChangesDialog } from './components/UnsavedChangesDialog'
import { useConfigStore } from './store/configStore'
import { useSaveConfig } from './hooks/useSaveConfig'
import { McpPage } from './pages/McpPage'
import { CredentialsPage } from './pages/CredentialsPage'
import { FileManagerPage } from './pages/FileManagerPage'
import { AgentsPage } from './pages/AgentsPage'
import { SettingsPage } from './pages/SettingsPage'

const NAV = [
  { id: 'mcp', label: 'MCP 服务', icon: Plug },
  { id: 'prompt', label: '全局提示词', icon: MessageSquareText },
  { id: 'settings', label: '设置', icon: Settings },
  { id: 'raw', label: '查看原始 JSON', icon: Braces },
  { id: 'credentials', label: '服务商凭证', icon: KeyRound },
  { id: 'files', label: 'SKILL 管理', icon: FolderOpen }
]

function CurrentPage({ id }: { id: string }): React.JSX.Element {
  if (id === 'mcp') return <McpPage />
  if (id === 'credentials') return <CredentialsPage />
  if (id === 'files') return <FileManagerPage />
  if (id === 'prompt') return <AgentsPage />
  if (id === 'settings') return <SettingsPage />
  if (id === 'raw') return <RawJsonView />
  return <Text color="fg.muted">页面不存在。</Text>
}

export function App(): React.JSX.Element {
  const [active, setActive] = useState('mcp')
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [pendingNav, setPendingNav] = useState<string | null>(null)
  const dirty = useConfigStore((s) => s.dirty)
  const loadConfig = useConfigStore((s) => s.loadConfig)
  const discardChanges = useConfigStore((s) => s.discardChanges)
  const { save, forceSave, status, saveErrors } = useSaveConfig()

  useEffect(() => {
    window.api
      .readConfig()
      .then((config) => {
        loadConfig(config)
        setLoaded(true)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [loadConfig])

  const navigate = (id: string): void => {
    if (id === active) return
    if (dirty) {
      setPendingNav(id)
      return
    }
    setActive(id)
  }

  const confirmSave = (): void => {
    const target = pendingNav
    void save().then((result) => {
      if (result.saved && target) {
        setPendingNav(null)
        setActive(target)
      }
    })
  }

  const discardAndLeave = (): void => {
    const target = pendingNav
    discardChanges()
    setPendingNav(null)
    if (target) setActive(target)
  }

  return (
    <>
      <AppLayout navItems={NAV} active={active} onNavigate={navigate}>
        {error ? (
          <Box
            role="alert"
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
          <Text fontSize="sm" color="fg.muted">
            加载配置中…
          </Text>
        ) : null}
        {loaded && !error ? <CurrentPage id={active} /> : null}
        {status ? (
          <Box mt="16px">
            <Text fontSize="sm" color="fg.muted">
              {status}
            </Text>
          </Box>
        ) : null}
      </AppLayout>
      <UnsavedChangesDialog
        open={pendingNav !== null}
        onSave={confirmSave}
        onDiscard={discardAndLeave}
        onCancel={() => setPendingNav(null)}
      />
    </>
  )
}

export default App
