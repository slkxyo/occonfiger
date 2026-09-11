import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { TextField, TagsField } from '../fields/controls'

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
            <TextField
              path={['provider', key, 'npm']}
              label="npm 包"
              placeholder="@ai-sdk/openai-compatible"
            />
            <TextField path={['provider', key, 'options', 'baseURL']} label="Base URL" />
            <TextField path={['provider', key, 'options', 'apiKey']} label="API Key" />
            <TagsField path={['provider', key, 'env']} label="环境变量" />
          </>
        )}
      </ListEditor>
    </Section>
  )
}
