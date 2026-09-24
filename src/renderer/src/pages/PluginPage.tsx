import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Section } from '../components/Section'
import { enterStyle } from '../components/motion'
import { ConfigViewButton } from '../components/ConfigViewButton'

type Plugin = { name: string; enabled: boolean; spec: unknown }

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function PluginPage(): React.JSX.Element {
  const [items, setItems] = useState<Plugin[]>([])
  const [error, setError] = useState('')

  const reload = (): Promise<void> =>
    window.api
      .listPlugins()
      .then((next) => {
        setItems(next)
        setError('')
      })
      .catch((e: unknown) => setError(toMessage(e)))

  useEffect(() => {
    reload()
  }, [])

  const toggle = (item: Plugin): void => {
    window.api
      .setPluginEnabled(item.name, !item.enabled)
      .then(reload)
      .catch((e: unknown) => setError(toMessage(e)))
  }

  const remove = (item: Plugin): void => {
    if (!window.confirm(`确定删除插件 ${item.name} 吗？`)) return
    window.api
      .deletePlugin(item.name)
      .then(reload)
      .catch((e: unknown) => setError(toMessage(e)))
  }

  const sorted = [...items].sort((a, b) => Number(b.enabled) - Number(a.enabled))

  return (
    <Section
      title="插件管理"
      description="管理 opencode.jsonc 中 plugins 数组的插件。停用会移出配置并记录，重新启用可原样还原。"
      action={<ConfigViewButton />}
    >
      {error ? (
        <div role="alert" className="mb-3 rounded-xl border border-destructive p-3">
          <p className="text-sm text-destructive">操作失败：{error}</p>
        </div>
      ) : null}
      {!error && sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          尚未配置任何插件，可在 opencode.jsonc 中添加 plugins 后返回本页。
        </p>
      ) : null}
      {sorted.map((item, index) => (
        <div
          key={item.name}
          className="oc-enter mb-3 rounded-xl border border-border bg-background p-4"
          style={{ ...enterStyle(index), opacity: item.enabled ? 1 : 0.65 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium">{item.name}</span>
              <span className="text-xs text-muted-foreground">
                {item.enabled ? '已启用' : '已停用'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                aria-label={`${item.name} 启用`}
                checked={item.enabled}
                onCheckedChange={() => toggle(item)}
              />
              <Button
                size="xs"
                variant="destructive"
                aria-label={`删除 ${item.name}`}
                onClick={() => remove(item)}
              >
                删除
              </Button>
            </div>
          </div>
        </div>
      ))}
    </Section>
  )
}
