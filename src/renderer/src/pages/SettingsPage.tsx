import { Box, HStack, Switch, Text, VStack } from '@chakra-ui/react'
import { Section } from '../components/Section'
import { PermissionRulesEditor } from '../components/PermissionRulesEditor'
import { useField } from '../fields/useField'
import { ConfigViewButton } from '../components/ConfigViewButton'

function AutoUpdateSetting(): React.JSX.Element {
  const { value, set, clear } = useField(['autoupdate'])
  return (
    <HStack justify="space-between" align="start">
      <Box>
        <Text fontSize="sm" fontWeight="medium">
          自动更新
        </Text>
        <Text fontSize="xs" color="fg.muted">
          允许 opencode 自动检查并安装更新；关闭后需手动更新。
        </Text>
      </Box>
      <Switch.Root
        checked={value !== false}
        onCheckedChange={(e) =>
          e.checked ? clear({ immediate: true }) : set(false, { immediate: true })
        }
      >
        <Switch.HiddenInput aria-label="自动更新" />
        <Switch.Control />
      </Switch.Root>
    </HStack>
  )
}

export function SettingsPage(): React.JSX.Element {
  return (
    <Section title="全局设置" description="opencode 的通用设置。" action={<ConfigViewButton />}>
      <VStack align="stretch" gap="20px">
        <AutoUpdateSetting />
        <PermissionRulesEditor />
      </VStack>
    </Section>
  )
}
