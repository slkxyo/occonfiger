import { useEffect, useState } from 'react'
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
import { Button } from './components/ui/button'
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
  return <p className="text-muted-foreground">页面不存在。</p>
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
        <div role="alert" className="oc-fade mb-4 rounded-xl border border-destructive p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}
      {saveErrors.length > 0 ? (
        <div role="alert" className="oc-fade mb-4 rounded-xl border border-destructive p-3">
          <p className="text-sm font-medium text-destructive">校验未通过</p>
          <ul className="mt-1 pl-4">
            {saveErrors.map((item) => (
              <li key={item}>
                <p className="text-sm text-destructive">{item}</p>
              </li>
            ))}
          </ul>
          <Button variant="destructive" size="xs" className="mt-2" onClick={forceSave}>
            强制保存
          </Button>
        </div>
      ) : null}
      {!loaded && !error ? (
        <p className="oc-fade text-sm text-muted-foreground">加载配置中…</p>
      ) : null}
      {loaded && !error ? (
        <div key={active} className="oc-enter">
          <CurrentPage id={active} />
        </div>
      ) : null}
      {status ? (
        <div className="oc-fade mt-4">
          <p className="text-sm text-muted-foreground">{status}</p>
        </div>
      ) : null}
    </AppLayout>
  )
}

export default App
