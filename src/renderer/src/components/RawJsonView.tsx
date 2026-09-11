import { Box, Text } from '@chakra-ui/react'
import { useConfigStore } from '../store/configStore'
import { normalizeDraft } from '../store/normalize'

export function RawJsonView(): React.JSX.Element {
  const draft = useConfigStore((s) => s.draft)
  const text = JSON.stringify(normalizeDraft(draft), null, 2)
  return (
    <Box
      as="section"
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      p="20px"
    >
      <Text fontSize="sm" color="fg.muted" mb="12px">
        原始 JSON（只读）
      </Text>
      <pre
        style={{
          fontFamily: 'var(--chakra-fonts-mono)',
          fontSize: '12px',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {text}
      </pre>
    </Box>
  )
}
