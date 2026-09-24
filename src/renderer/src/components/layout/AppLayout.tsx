import { useState } from 'react'
import { Sidebar, type NavItem } from './Sidebar'

export function AppLayout(props: {
  navItems: NavItem[]
  active: string
  onNavigate: (id: string) => void
  children: React.ReactNode
}): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        items={props.navItems}
        active={props.active}
        collapsed={collapsed}
        onNavigate={props.onNavigate}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">{props.children}</div>
    </div>
  )
}
