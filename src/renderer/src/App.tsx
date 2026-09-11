import { useState } from 'react'
import { AppLayout } from './components/layout/AppLayout'

const navItems = [
  { id: 'general', label: '常规' },
  { id: 'model', label: '模型' }
]

function App(): React.JSX.Element {
  const [active, setActive] = useState('general')

  return (
    <AppLayout navItems={navItems} active={active} onNavigate={setActive} configPath="config.json">
      <div>{active === 'general' ? '常规设置' : '模型设置'}</div>
    </AppLayout>
  )
}

export default App
