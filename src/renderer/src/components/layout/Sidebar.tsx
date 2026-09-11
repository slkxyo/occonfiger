import { Box, Button, VStack } from '@chakra-ui/react'

export type NavItem = { id: string; label: string }

export function Sidebar(props: {
  items: NavItem[]
  active: string
  collapsed: boolean
  onNavigate: (id: string) => void
}): React.JSX.Element {
  return (
    <Box
      as="nav"
      w={props.collapsed ? '64px' : '220px'}
      borderRightWidth="1px"
      borderColor="border.default"
      bg="bg.subtle"
      py="12px"
      px="8px"
      transition="width 0.15s ease"
    >
      <VStack align="stretch" gap="2px">
        {props.items.map((item) => (
          <Button
            key={item.id}
            variant={props.active === item.id ? 'subtle' : 'ghost'}
            colorPalette={props.active === item.id ? 'accent' : undefined}
            justifyContent="flex-start"
            size="sm"
            onClick={() => props.onNavigate(item.id)}
          >
            {props.collapsed ? item.label.slice(0, 1) : item.label}
          </Button>
        ))}
      </VStack>
    </Box>
  )
}
