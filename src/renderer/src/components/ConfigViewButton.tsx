import { Box, Button, Dialog, Portal } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useConfigStore } from '../store/configStore'
import { normalizeDraft } from '../store/normalize'

export function ConfigViewButton(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const draft = useConfigStore((s) => s.draft)
  const text = useMemo(() => JSON.stringify(normalizeDraft(draft), null, 2), [draft])

  return (
    <>
      <Button size="xs" variant="outline" onClick={() => setOpen(true)}>
        查看配置文件
      </Button>
      <Dialog.Root open={open} onOpenChange={(e) => (e.open ? null : setOpen(false))}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="720px">
              <Dialog.Header>
                <Dialog.Title>配置文件</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Box
                  as="pre"
                  maxH="60vh"
                  overflowY="auto"
                  bg="bg.subtle"
                  borderWidth="1px"
                  borderColor="border.default"
                  borderRadius="card"
                  p="12px"
                  fontFamily="mono"
                  fontSize="12px"
                  lineHeight="1.6"
                  whiteSpace="pre-wrap"
                  wordBreak="break-word"
                >
                  {text}
                </Box>
              </Dialog.Body>
              <Dialog.Footer>
                <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                  关闭
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
