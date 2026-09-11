import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { KeyValueEditor } from '../components/KeyValueEditor'
import {
  BoolOrObjectField,
  SelectField,
  SwitchField,
  TagsField,
  TextField
} from '../fields/controls'
import { useField } from '../fields/useField'

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
      <SwitchField path={['mcp', server, 'enabled']} label="启用" />
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
          <BoolOrObjectField
            path={['mcp', server, 'oauth']}
            label="OAuth"
            description="关闭时写入 false，禁用 OAuth 自动检测。"
            objectHint="当前为 OAuth 对象配置，暂不支持可视化编辑"
          />
        </>
      )}
      <TextField path={['mcp', server, 'timeout']} label="超时（毫秒）" />
    </>
  )
}

export function McpPage(): React.JSX.Element {
  return (
    <Section title="MCP 服务" description="Model Context Protocol 服务器配置。">
      <ListEditor
        path={['mcp']}
        addLabel="添加 MCP 服务"
        inputLabel="新 MCP 服务名"
        placeholder="playwright"
        initialValue={{ type: 'local' }}
      >
        {(server) => <McpCard server={server} />}
      </ListEditor>
    </Section>
  )
}
