import { Box, Flex, Heading, Text } from '@chakra-ui/react'

export function Section(props: {
  title: string
  description?: string
  action?: React.ReactNode
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
      <Flex justify="space-between" align="start" gap="12px" mb="4px">
        <Heading size="md">{props.title}</Heading>
        {props.action ? <Box flexShrink={0}>{props.action}</Box> : null}
      </Flex>
      {props.description ? (
        <Text fontSize="sm" color="fg.muted" mb="16px">
          {props.description}
        </Text>
      ) : null}
      {props.children}
    </Box>
  )
}
