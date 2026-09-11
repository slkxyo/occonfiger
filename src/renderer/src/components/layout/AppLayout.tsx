import { Box, Flex } from '@chakra-ui/react'
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
    <Flex h="100vh" overflow="hidden" bg="bg.default" color="fg.default">
      <Sidebar
        items={props.navItems}
        active={props.active}
        collapsed={collapsed}
        onNavigate={props.onNavigate}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />
      <Box flex="1" minW="0" minH="0" overflowY="auto" p="24px">
        {props.children}
      </Box>
    </Flex>
  )
}
