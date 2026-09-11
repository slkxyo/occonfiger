import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { NumberField, SelectField, SwitchField, TextField } from '../fields/controls'

export function AgentPage(): React.JSX.Element {
  return (
    <Section title="Agents" description="自定义 agent 的模型、模式与权限。">
      <ListEditor
        path={['agent']}
        addLabel="添加 Agent"
        inputLabel="新 Agent 名称"
        placeholder="reviewer"
      >
        {(agent) => (
          <>
            <TextField path={['agent', agent, 'description']} label="描述" />
            <SelectField
              path={['agent', agent, 'mode']}
              label="模式"
              options={['primary', 'subagent', 'all']}
            />
            <TextField path={['agent', agent, 'model']} label="模型" placeholder="provider/model" />
            <NumberField path={['agent', agent, 'temperature']} label="温度" />
            <NumberField path={['agent', agent, 'top_p']} label="Top P" />
            <NumberField path={['agent', agent, 'steps']} label="最大步数" />
            <SwitchField path={['agent', agent, 'hidden']} label="在自动补全中隐藏" />
            <SwitchField path={['agent', agent, 'disable']} label="禁用" />
            <TextField path={['agent', agent, 'prompt']} label="Prompt" multiline />
          </>
        )}
      </ListEditor>
    </Section>
  )
}
