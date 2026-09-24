import { Switch } from '@/components/ui/switch'
import { Section } from '../components/Section'
import { PermissionRulesEditor } from '../components/PermissionRulesEditor'
import { useField } from '../fields/useField'
import { ConfigViewButton } from '../components/ConfigViewButton'

function AutoUpdateSetting(): React.JSX.Element {
  const { value, set, clear } = useField(['autoupdate'])
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">自动更新</p>
        <p className="text-xs text-muted-foreground">
          允许 opencode 自动检查并安装更新；关闭后需手动更新。
        </p>
      </div>
      <Switch
        aria-label="自动更新"
        checked={value !== false}
        onCheckedChange={(checked) =>
          checked ? clear({ immediate: true }) : set(false, { immediate: true })
        }
      />
    </div>
  )
}

export function SettingsPage(): React.JSX.Element {
  return (
    <Section title="全局设置" description="opencode 的通用设置。" action={<ConfigViewButton />}>
      <div className="flex flex-col gap-5">
        <AutoUpdateSetting />
        <PermissionRulesEditor />
      </div>
    </Section>
  )
}
