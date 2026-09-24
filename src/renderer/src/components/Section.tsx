import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

export function Section(props: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        {props.action ? <CardAction>{props.action}</CardAction> : null}
        {props.description ? <CardDescription>{props.description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{props.children}</CardContent>
    </Card>
  )
}
