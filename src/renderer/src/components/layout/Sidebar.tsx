import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react'
import { Menu } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ColorModeButton } from '../ui/color-mode'

export type NavItem = { id: string; label: string; icon?: LucideIcon }

export function Sidebar(props: {
  items: NavItem[]
  active: string
  collapsed: boolean
  onNavigate: (id: string) => void
  onToggleCollapse: () => void
}): React.JSX.Element {
  return (
    <Flex
      as="nav"
      direction="column"
      w={props.collapsed ? '64px' : '220px'}
      h="100%"
      flexShrink={0}
      borderRightWidth="1px"
      borderColor="border.default"
      bg="bg.subtle"
      py="12px"
      px="8px"
      transition="width 0.15s ease"
    >
      <VStack flex="1" minH="0" overflowY="auto" align="stretch" gap="2px">
        {props.items.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={props.active === item.id ? 'subtle' : 'ghost'}
              colorPalette={props.active === item.id ? 'accent' : undefined}
              justifyContent="flex-start"
              gap="0px"
              size="sm"
              flexShrink={0}
              w="100%"
              minW="0"
              title={item.label}
              aria-label={item.label}
              onClick={() => props.onNavigate(item.id)}
            >
              {Icon ? (
                <Box
                  as="span"
                  display="inline-flex"
                  flexShrink={0}
                  ml={props.collapsed ? 'calc(50% - 9px)' : '0px'}
                  transition="margin-left 0.18s ease"
                >
                  <Icon size={18} />
                </Box>
              ) : null}
              <Text
                as="span"
                display="block"
                fontSize="sm"
                overflow="hidden"
                whiteSpace="nowrap"
                ml={props.collapsed ? '0px' : '8px'}
                maxW={props.collapsed ? '0px' : '170px'}
                opacity={props.collapsed ? 0 : 1}
                transition="max-width 0.18s ease, opacity 0.18s ease, margin-left 0.18s ease"
              >
                {item.label}
              </Text>
            </Button>
          )
        })}
      </VStack>
      <VStack
        gap="4px"
        pt="8px"
        mt="8px"
        borderTopWidth="1px"
        borderColor="border.default"
        align="center"
      >
        <ColorModeButton />
        <Button
          size="sm"
          variant="ghost"
          aria-label={props.collapsed ? '展开侧栏' : '折叠侧栏'}
          onClick={props.onToggleCollapse}
        >
          <Menu size={16} />
        </Button>
      </VStack>
    </Flex>
  )
}
