import {
  NumberField,
  SelectField,
  SwitchField,
  TagsField,
  TextField,
  ValidatedTextField
} from './controls'

export type FieldSpec =
  | { kind: 'text'; path: string[]; label: string; description?: string; placeholder?: string }
  | { kind: 'number'; path: string[]; label: string; description?: string }
  | { kind: 'switch'; path: string[]; label: string; description?: string }
  | { kind: 'select'; path: string[]; label: string; description?: string; options: string[] }
  | { kind: 'tags'; path: string[]; label: string; description?: string; placeholder?: string }
  | {
      kind: 'validated-text'
      path: string[]
      label: string
      description?: string
      placeholder?: string
      validate: (value: string) => string | null
    }

export function FieldsForm({ specs }: { specs: FieldSpec[] }): React.JSX.Element {
  return (
    <>
      {specs.map((spec) => {
        const key = spec.path.join('.')
        if (spec.kind === 'text') return <TextField key={key} {...spec} />
        if (spec.kind === 'number') return <NumberField key={key} {...spec} />
        if (spec.kind === 'switch') return <SwitchField key={key} {...spec} />
        if (spec.kind === 'select') return <SelectField key={key} {...spec} />
        if (spec.kind === 'validated-text') return <ValidatedTextField key={key} {...spec} />
        return <TagsField key={key} {...spec} />
      })}
    </>
  )
}
