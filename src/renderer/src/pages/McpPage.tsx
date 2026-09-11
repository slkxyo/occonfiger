import { Switch } from '@chakra-ui/react'
import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { KeyValueEditor } from '../components/KeyValueEditor'
import { OAuthField, SelectField, TagsField, TextField } from '../fields/controls'
import { useField } from '../fields/useField'

function EnabledSwitch({ server }: { server: string }): React.JSX.Element {
  const { value, set, clear } = useField(['mcp', server, 'enabled'])
  return (
    <Switch.Root
      checked={value !== false}
      onCheckedChange={(e) => (e.checked ? clear() : set(false))}
    >
      <Switch.HiddenInput aria-label={`${server} 启用`} />
      <Switch.Control />
    </Switch.Root>
  )
}

function McpCard({ server }: { server: string }): React.JSX.Element {
  const { value } = useField(['mcp', server, 'type'])
  const type = typeof value === 'string' ? value : 'local'
  return (
    <>
      <SelectField
        path={['mcp', server, 'type']}
        label="类型"
        options={['local', 'remote']}
        allowEmpty={false}
      />
      {type === 'local' ? (
        <>
          <TagsField path={['mcp', server, 'command']} label="命令" placeholder="回车添加参数" />
          <TextField path={['mcp', server, 'cwd']} label="工作目录" />
          <KeyValueEditor path={['mcp', server, 'environment']} label="环境变量" valueLabel="值" />
        </>
      ) : (
        <>
          <TextField path={['mcp', server, 'url']} label="URL" />
          <KeyValueEditor path={['mcp', server, 'headers']} label="请求头" valueLabel="值" />
          <OAuthField
            path={['mcp', server, 'oauth']}
            label="OAuth"
            description="勾选写入 false 以禁用自动检测；取消勾选移除配置，恢复自动检测。"
            objectHint="当前为 OAuth 对象配置，暂不支持可视化编辑"
          />
        </>
      )}
      <TextField path={['mcp', server, 'timeout']} label="超时（毫秒）" />
    </>
  )
}

function sortByEnabled(keys: string[], container: Record<string, unknown>): string[] {
  return [...keys].sort((a, b) => {
    const av = (container[a] as { enabled?: unknown } | undefined)?.enabled
    const bv = (container[b] as { enabled?: unknown } | undefined)?.enabled
    return (av === false ? 1 : 0) - (bv === false ? 1 : 0)
  })
}

export function McpPage(): React.JSX.Element {
  return (
    <Section title="MCP 服务" description="Model Context Protocol 服务器配置。">
      <ListEditor
        path={['mcp']}
        addLabel="添加 MCP 服务"
        inputLabel="新 MCP 服务名"
        placeholder="playwright"
        hideAdd
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
