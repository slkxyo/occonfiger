import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react'

export function UnsavedChangesDialog(props: {
  open: boolean
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}): React.JSX.Element | null {
  if (!props.open) return null
  return (
    <Flex
      position="fixed"
      inset="0"
      bg="blackAlpha.600"
      align="center"
      justify="center"
      zIndex="modal"
    >
      <Box
        role="dialog"
        aria-label="有未保存的修改"
        bg="bg.default"
        borderWidth="1px"
        borderColor="border.default"
        borderRadius="card"
        p="20px"
        w="360px"
        shadow="lg"
      >
        <Text fontWeight="medium" mb="8px">
          有未保存的修改
        </Text>
        <Text fontSize="sm" color="fg.muted" mb="16px">
          离开当前界面将丢失未保存的配置修改，是否保存？
        </Text>
        <HStack justify="flex-end">
          <Button size="sm" variant="ghost" onClick={props.onCancel}>
            取消
          </Button>
          <Button size="sm" variant="ghost" colorPalette="error" onClick={props.onDiscard}>
            不保存
          </Button>
          <Button size="sm" colorPalette="accent" onClick={props.onSave}>
            保存
          </Button>
        </HStack>
      </Box>
    </Flex>
  )
}
