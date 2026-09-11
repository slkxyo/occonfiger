import { Box, Text } from '@chakra-ui/react'

export function Field(props: {
  label: string
  description?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <Box mb="16px">
      <Text as="label" display="block" fontSize="sm" fontWeight="medium" mb="4px">
        {props.label}
      </Text>
      {props.children}
      {props.description ? (
        <Text fontSize="xs" color="fg.muted" mt="4px">
          {props.description}
        </Text>
      ) : null}
    </Box>
  )
}
