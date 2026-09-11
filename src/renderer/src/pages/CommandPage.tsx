import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { SwitchField, TextField } from '../fields/controls'

export function CommandPage(): React.JSX.Element {
  return (
    <Section title="Commands" description="自定义命令，正文即模板。">
      <ListEditor
        path={['command']}
        addLabel="添加 Command"
        inputLabel="新 Command 名称"
        placeholder="deploy"
      >
        {(command) => (
          <>
            <TextField path={['command', command, 'description']} label="描述" />
            <TextField path={['command', command, 'template']} label="模板" multiline />
            <TextField path={['command', command, 'agent']} label="Agent" />
            <TextField
              path={['command', command, 'model']}
              label="模型"
              placeholder="provider/model"
            />
            <SwitchField path={['command', command, 'subtask']} label="作为子任务" />
          </>
        )}
      </ListEditor>
    </Section>
  )
}
