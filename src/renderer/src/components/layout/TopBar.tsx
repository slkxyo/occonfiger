import { Button, Flex, Text } from '@chakra-ui/react'
import { ColorModeButton } from '../ui/color-mode'

export function TopBar(props: {
  configPath: string
  dirty: boolean
  onSave: () => void
  onShowRaw: () => void
  onToggleSidebar: () => void
}): React.JSX.Element {
  return (
    <Flex
      as="header"
      h="56px"
      px="16px"
      align="center"
      justify="space-between"
      borderBottomWidth="1px"
      borderColor="border.default"
      bg="bg.default"
    >
      <Flex align="center" gap="8px">
        <Button size="sm" variant="ghost" onClick={props.onToggleSidebar} aria-label="折叠侧栏">
          ☰
        </Button>
        <Text fontSize="sm" color="fg.muted" fontFamily="mono">
          {props.configPath}
        </Text>
      </Flex>
      <Flex align="center" gap="8px">
        {props.dirty ? (
          <Text fontSize="xs" color="warning">
            已修改
          </Text>
        ) : null}
        <Button size="sm" variant="ghost" onClick={props.onShowRaw}>
          查看原始 JSON
        </Button>
        <Button size="sm" colorPalette="accent" onClick={props.onSave}>
          保存
        </Button>
        <ColorModeButton />
      </Flex>
    </Flex>
  )
}
