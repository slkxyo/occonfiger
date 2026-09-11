import { Section } from '../components/Section'
import { FieldsForm, type FieldSpec } from '../fields/FieldsForm'

const specs: FieldSpec[] = [
  { kind: 'text', path: ['model'], label: '主模型', placeholder: 'provider/model' },
  { kind: 'text', path: ['small_model'], label: '小模型', placeholder: 'provider/model' }
]

export function ModelPage(): React.JSX.Element {
  return (
    <Section title="模型" description="主模型与小模型，格式为 provider/model。">
      <FieldsForm specs={specs} />
    </Section>
  )
}
