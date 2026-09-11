import { Box, Heading, Text } from '@chakra-ui/react'

export function Section(props: {
  title: string
  description?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <Box
      as="section"
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      p="20px"
      mb="16px"
    >
      <Heading size="md" mb="4px">
        {props.title}
      </Heading>
      {props.description ? (
        <Text fontSize="sm" color="fg.muted" mb="16px">
          {props.description}
        </Text>
      ) : null}
      {props.children}
    </Box>
  )
}
