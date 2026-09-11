import { useEffect, useState } from 'react'
import { Box, Button, Text } from '@chakra-ui/react'
import { AppLayout } from './components/layout/AppLayout'
import { RawJsonDialog } from './components/RawJsonDialog'
import { useConfigStore } from './store/configStore'
import { normalizeDraft } from './store/normalize'
import { useSaveConfig } from './hooks/useSaveConfig'
import { GeneralPage } from './pages/GeneralPage'
import { ModelPage } from './pages/ModelPage'
import { ProviderPage } from './pages/ProviderPage'
import { McpPage } from './pages/McpPage'
import { PermissionPage } from './pages/PermissionPage'
import { AgentPage } from './pages/AgentPage'
import { CommandPage } from './pages/CommandPage'
import { SkillsPage } from './pages/SkillsPage'
import { PluginsPage } from './pages/PluginsPage'
import { AdvancedPage } from './pages/AdvancedPage'

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

function CurrentPage({ id }: { id: string }): React.JSX.Element {
  if (id === 'general') return <GeneralPage />
  if (id === 'model') return <ModelPage />
  if (id === 'provider') return <ProviderPage />
  if (id === 'mcp') return <McpPage />
  if (id === 'permission') return <PermissionPage />
  if (id === 'agent') return <AgentPage />
  if (id === 'command') return <CommandPage />
  if (id === 'skills') return <SkillsPage />
  if (id === 'plugins') return <PluginsPage />
  if (id === 'advanced') return <AdvancedPage />
  return <Text color="fg.muted">该页面将在 Plan 3 实现。</Text>
}

export function App(): React.JSX.Element {
  const [active, setActive] = useState('general')
  const [configPath, setConfigPath] = useState('')
  const [rawOpen, setRawOpen] = useState(false)
  const [rawContent, setRawContent] = useState<string | undefined>(undefined)
  const [error, setError] = useState('')
  const dirty = useConfigStore((s) => s.dirty)
  const loadConfig = useConfigStore((s) => s.loadConfig)
  const { save, forceSave, status, saveErrors } = useSaveConfig()

  useEffect(() => {
    Promise.all([window.api.readConfig(), window.api.getConfigPath()])
      .then(([config, path]) => {
        loadConfig(config)
        setConfigPath(path)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [loadConfig])

  return (
    <>
      <AppLayout
        navItems={NAV}
        active={active}
        onNavigate={setActive}
        configPath={configPath}
        dirty={dirty}
        onSave={save}
        onShowRaw={() => {
          setRawContent(JSON.stringify(normalizeDraft(useConfigStore.getState().draft), null, 2))
          setRawOpen(true)
        }}
      >
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
            <Button
              size="xs"
              mt="8px"
              onClick={() =>
                window.api.getRawContent().then((content) => {
                  setRawContent(content ?? '')
                  setRawOpen(true)
                })
              }
            >
              查看原始文件内容
            </Button>
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
        <CurrentPage id={active} />
        {status ? (
          <Box mt="16px">
            <Text fontSize="sm" color="fg.muted">
              {status}
            </Text>
          </Box>
        ) : null}
      </AppLayout>
      <RawJsonDialog
        open={rawOpen}
        onClose={() => {
          setRawOpen(false)
          setRawContent(undefined)
        }}
        content={rawContent}
      />
    </>
  )
}

export default App
