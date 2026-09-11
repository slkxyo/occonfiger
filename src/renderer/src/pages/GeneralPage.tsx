import { Section } from '../components/Section'
import { validateAgentName } from '../fields/validation'
import { FieldsForm, type FieldSpec } from '../fields/FieldsForm'

const specs: FieldSpec[] = [
  { kind: 'text', path: ['shell'], label: 'Shell', placeholder: '/bin/zsh' },
  { kind: 'text', path: ['username'], label: '用户名' },
  {
    kind: 'select',
    path: ['logLevel'],
    label: '日志级别',
    options: ['DEBUG', 'INFO', 'WARN', 'ERROR']
  },
  { kind: 'select', path: ['share'], label: '分享', options: ['manual', 'auto', 'disabled'] },
  { kind: 'select', path: ['autoupdate'], label: '自动更新', options: ['true', 'false', 'notify'] },
  { kind: 'switch', path: ['snapshot'], label: '快照' },
  {
    kind: 'validated-text',
    path: ['default_agent'],
    label: '默认 Agent',
    validate: validateAgentName
  },
  { kind: 'number', path: ['subagent_depth'], label: '子 Agent 嵌套深度' },
  { kind: 'tags', path: ['disabled_providers'], label: '禁用的 Provider', placeholder: '回车添加' },
  { kind: 'tags', path: ['enabled_providers'], label: '仅启用的 Provider', placeholder: '回车添加' }
]

export function GeneralPage(): React.JSX.Element {
  return (
    <Section title="常规" description="运行时与全局行为设置。">
      <FieldsForm specs={specs} />
    </Section>
  )
}
