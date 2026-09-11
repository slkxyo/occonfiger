import { Box, HStack, Switch, Text, VStack } from '@chakra-ui/react'
import { Section } from '../components/Section'
import { MenuSelect } from '../fields/MenuSelect'
import { useField } from '../fields/useField'
import { useConfigStore } from '../store/configStore'
import { getAt } from '../fields/path'

const PERMISSION_ACTIONS = ['allow', 'ask', 'deny']

function currentPermission(draft: Record<string, unknown>): string {
  if (typeof draft.permission === 'string') return draft.permission
  const star = getAt(draft, ['permission', '*'])
  return typeof star === 'string' ? star : ''
}

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
        onCheckedChange={(e) => (e.checked ? clear() : set(false))}
      >
        <Switch.HiddenInput aria-label="自动更新" />
        <Switch.Control />
      </Switch.Root>
    </HStack>
  )
}

function PermissionSetting(): React.JSX.Element {
  const draft = useConfigStore((s) => s.draft)
  const setField = useConfigStore((s) => s.setField)
  const deleteField = useConfigStore((s) => s.deleteField)
  const action = currentPermission(draft)
  return (
    <HStack justify="space-between" align="start">
      <Box>
        <Text fontSize="sm" fontWeight="medium">
          权限
        </Text>
        <Text fontSize="xs" color="fg.muted">
          统一设置所有工具的默认动作：allow / ask / deny。
        </Text>
      </Box>
      <Box w="160px" flexShrink={0}>
        <MenuSelect
          ariaLabel="全局权限"
          options={PERMISSION_ACTIONS}
          value={action}
          width="160px"
          onChange={(v) => {
            if (v === '') deleteField(['permission'])
            else setField(['permission'], { '*': v })
          }}
        />
      </Box>
    </HStack>
  )
}

export function SettingsPage(): React.JSX.Element {
  return (
    <Section title="设置" description="opencode 的通用设置。">
      <VStack align="stretch" gap="20px">
        <AutoUpdateSetting />
        <PermissionSetting />
      </VStack>
    </Section>
  )
}
