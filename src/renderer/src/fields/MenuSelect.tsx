import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export function MenuSelect(props: {
  options: string[]
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  placeholder?: string
  allowEmpty?: boolean
  size?: 'xs' | 'sm'
  width?: string
}): React.JSX.Element {
  const placeholder = props.placeholder ?? '（未设置）'
  const items = props.allowEmpty !== false ? ['', ...props.options] : props.options
  const size = props.size === 'xs' ? 'sm' : 'default'

  return (
    <Select
      value={props.value}
      onValueChange={(value) => props.onChange(typeof value === 'string' ? value : '')}
    >
      <SelectTrigger
        aria-label={props.ariaLabel}
        size={size}
        className="w-full"
        style={props.width ? { width: props.width } : undefined}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item || '__unset__'} value={item}>
            {item === '' ? placeholder : item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
