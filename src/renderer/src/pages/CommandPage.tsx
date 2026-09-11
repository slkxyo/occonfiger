import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { SwitchField, TextField } from '../fields/controls'

export function CommandPage(): React.JSX.Element {
  return (
    <Section title="命令" description="自定义命令，正文即模板。">
      <ListEditor
        path={['command']}
        addLabel="添加命令"
        inputLabel="新命令名称"
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
            <TextField path={['command', command, 'variant']} label="模型变体" />
            <SwitchField path={['command', command, 'subtask']} label="作为子任务" />
          </>
        )}
      </ListEditor>
    </Section>
  )
}
