import { Switch } from '@chakra-ui/react'
import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { KeyValueEditor } from '../components/KeyValueEditor'
import { OAuthField, SelectField, TagsField, TextField } from '../fields/controls'
import { useField } from '../fields/useField'
import { ConfigViewButton } from '../components/ConfigViewButton'

function EnabledSwitch({ server }: { server: string }): React.JSX.Element {
  const { value, set, clear } = useField(['mcp', 'servers', server, 'disabled'])
  return (
    <Switch.Root
      checked={value !== true}
      onCheckedChange={(e) =>
        e.checked ? clear({ immediate: true }) : set(true, { immediate: true })
      }
    >
      <Switch.HiddenInput aria-label={`${server} 启用`} />
      <Switch.Control />
    </Switch.Root>
  )
}

function McpCard({ server }: { server: string }): React.JSX.Element {
  const { value } = useField(['mcp', 'servers', server, 'type'])
  const type = typeof value === 'string' ? value : 'local'
  return (
    <>
      <SelectField
        path={['mcp', 'servers', server, 'type']}
        label="类型"
        options={['local', 'remote']}
        allowEmpty={false}
      />
      {type === 'local' ? (
        <>
          <TagsField
            path={['mcp', 'servers', server, 'command']}
            label="命令"
            placeholder="回车添加参数"
          />
          <TextField path={['mcp', 'servers', server, 'cwd']} label="工作目录" />
          <KeyValueEditor
            path={['mcp', 'servers', server, 'environment']}
            label="环境变量"
            valueLabel="值"
          />
        </>
      ) : (
        <>
          <TextField path={['mcp', 'servers', server, 'url']} label="URL" />
          <KeyValueEditor
            path={['mcp', 'servers', server, 'headers']}
            label="请求头"
            valueLabel="值"
          />
          <OAuthField
            path={['mcp', 'servers', server, 'oauth']}
            label="OAuth"
            description="勾选写入 false 以禁用自动检测；取消勾选移除配置，恢复自动检测。"
            objectHint="当前为 OAuth 对象配置，暂不支持可视化编辑"
          />
        </>
      )}
      <TextField
        kind="number"
        path={['mcp', 'servers', server, 'timeout', 'request']}
        label="请求超时（毫秒）"
      />
    </>
  )
}

function sortByEnabled(keys: string[], container: Record<string, unknown>): string[] {
  return [...keys].sort((a, b) => {
    const av = (container[a] as { disabled?: unknown } | undefined)?.disabled
    const bv = (container[b] as { disabled?: unknown } | undefined)?.disabled
    return (av === true ? 1 : 0) - (bv === true ? 1 : 0)
  })
}

export function McpPage(): React.JSX.Element {
  return (
    <Section
      title="MCP 服务"
      description="Model Context Protocol 服务器配置。"
      action={<ConfigViewButton />}
    >
      <ListEditor
        path={['mcp', 'servers']}
        collapsible
        defaultCollapsed
        sortKeys={sortByEnabled}
        titleAccessory={(server) => <EnabledSwitch server={server} />}
      >
        {(server) => <McpCard server={server} />}
      </ListEditor>
    </Section>
  )
}
