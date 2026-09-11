import { Box, Button } from '@chakra-ui/react'
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const placeholder = props.placeholder ?? '（未设置）'
  const display = props.value !== '' ? props.value : placeholder
  const items = props.allowEmpty !== false ? ['', ...props.options] : props.options

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e: PointerEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (item: string): void => {
    props.onChange(item)
    setOpen(false)
  }

  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    const buttons = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="option"]')
    )
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = e.key === 'ArrowDown' ? index + 1 : index - 1
      const target = buttons[(next + buttons.length) % buttons.length]
      target?.focus()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <Box ref={rootRef} position="relative" w={props.width ?? '100%'}>
      <Button
        type="button"
        variant="outline"
        size={props.size ?? 'sm'}
        w="100%"
        h="32px"
        px="10px"
        justifyContent="space-between"
        aria-label={props.ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Box
          as="span"
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          color={props.value === '' ? 'fg.muted' : undefined}
        >
          {display}
        </Box>
        <ChevronDown size={14} />
      </Button>
      {open ? (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left="0"
          minW="100%"
          maxH="240px"
          overflowY="auto"
          zIndex="modal"
          bg="bg.default"
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="md"
          shadow="md"
          py="4px"
          role="listbox"
          aria-label={props.ariaLabel}
          onKeyDown={onPanelKeyDown}
        >
          {items.map((item) => (
            <Button
              key={item || 'unset'}
              type="button"
              role="option"
              aria-selected={item === props.value}
              size="xs"
              variant="ghost"
              w="100%"
              h="28px"
              px="10px"
              justifyContent="space-between"
              borderRadius="0"
              color={item === '' ? 'fg.muted' : undefined}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(item)
              }}
            >
              <Box as="span" whiteSpace="nowrap" fontWeight="normal">
                {item === '' ? placeholder : item}
              </Box>
              {item === props.value ? <Check size={14} /> : null}
            </Button>
          ))}
        </Box>
      ) : null}
    </Box>
  )
}
