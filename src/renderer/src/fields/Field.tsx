import { Label } from '@/components/ui/label'

export function Field(props: {
  label: string
  description?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="mb-4">
      <Label className="mb-1 block">{props.label}</Label>
      {props.children}
      {props.description ? (
        <p className="mt-1 text-xs text-muted-foreground">{props.description}</p>
      ) : null}
    </div>
  )
}
