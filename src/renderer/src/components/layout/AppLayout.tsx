import { Box, Flex } from '@chakra-ui/react'
import { useState } from 'react'
import { Sidebar, type NavItem } from './Sidebar'
import { TopBar } from './TopBar'

export function AppLayout(props: {
  navItems: NavItem[]
  active: string
  onNavigate: (id: string) => void
  configPath?: string
  dirty?: boolean
  onSave?: () => void
  onShowRaw?: () => void
  children: React.ReactNode
}): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <Flex h="100vh" bg="bg.default" color="fg.default">
      <Sidebar
        items={props.navItems}
        active={props.active}
        collapsed={collapsed}
        onNavigate={props.onNavigate}
      />
      <Flex direction="column" flex="1" minW="0">
        <TopBar
          configPath={props.configPath ?? ''}
          dirty={props.dirty ?? false}
          onSave={props.onSave ?? (() => {})}
          onShowRaw={props.onShowRaw ?? (() => {})}
          onToggleSidebar={() => setCollapsed((v) => !v)}
        />
        <Box flex="1" overflowY="auto" p="24px">
          <Box maxW="920px" mx="auto">
            {props.children}
          </Box>
        </Box>
      </Flex>
    </Flex>
  )
}
