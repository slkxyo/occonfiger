import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { SwitchField, TextField, TagsField } from '../fields/controls'

export function ProviderPage(): React.JSX.Element {
  return (
    <Section
      title="Provider"
      description="opencode.json 中的 provider 配置：自定义 provider、baseURL 与模型。"
    >
      <ListEditor
        path={['provider']}
        addLabel="添加 Provider"
        inputLabel="新 Provider ID"
        placeholder="myprovider"
      >
        {(key) => (
          <>
            <TextField path={['provider', key, 'name']} label="显示名称" />
            <TextField path={['provider', key, 'api']} label="API 类型" placeholder="openai" />
            <TextField
              path={['provider', key, 'npm']}
              label="npm 包"
              placeholder="@ai-sdk/openai-compatible"
            />
            <TextField path={['provider', key, 'options', 'baseURL']} label="Base URL" />
            <TextField path={['provider', key, 'options', 'apiKey']} label="API Key" />
            <TagsField path={['provider', key, 'env']} label="环境变量" />
            <ListEditor
              path={['provider', key, 'models']}
              addLabel="添加模型"
              inputLabel={`${key} 新模型名`}
              placeholder="gpt-4o"
            >
              {(model) => (
                <>
                  <TextField path={['provider', key, 'models', model, 'id']} label="模型 ID" />
                  <TextField path={['provider', key, 'models', model, 'name']} label="模型名称" />
                  <TextField path={['provider', key, 'models', model, 'family']} label="模型系列" />
                  <TextField
                    path={['provider', key, 'models', model, 'release_date']}
                    label="发布日期"
                  />
                  <SwitchField
                    path={['provider', key, 'models', model, 'attachment']}
                    label="支持附件"
                  />
                  <SwitchField
                    path={['provider', key, 'models', model, 'reasoning']}
                    label="支持推理"
                  />
                  <SwitchField
                    path={['provider', key, 'models', model, 'tool_call']}
                    label="支持工具调用"
                  />
                  <SwitchField
                    path={['provider', key, 'models', model, 'temperature']}
                    label="支持温度"
                  />
                </>
              )}
            </ListEditor>
          </>
        )}
      </ListEditor>
    </Section>
  )
}
