import { Button, Dialog, Portal } from '@chakra-ui/react'
import { useConfigStore } from '../store/configStore'

export function RawJsonDialog(props: {
  open: boolean
  onClose: () => void
  content?: string
}): React.JSX.Element {
  const draft = useConfigStore((s) => s.draft)
  const text = props.content ?? JSON.stringify(draft, null, 2)
  return (
    <Dialog.Root
      open={props.open}
      onOpenChange={(e) => (e.open ? null : props.onClose())}
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>原始 JSON</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <pre
                style={{
                  fontFamily: 'var(--chakra-fonts-mono)',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {text}
              </pre>
            </Dialog.Body>
            <Dialog.Footer>
              <Button size="sm" onClick={props.onClose}>
                关闭
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
