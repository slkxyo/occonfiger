import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Input } from '@/components/ui/input'
import { cn } from 'cn'

export function Autocomplete(props: {
  options: string[]
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  placeholder?: string
  className?: string
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLUListElement>(null)

  const filtered = useMemo(() => {
    const needle = props.value.trim().toLowerCase()
    if (!needle) return props.options
    return props.options.filter((o) => o.toLowerCase().includes(needle))
  }, [props.options, props.value])

  // 渲染时 clamp，避免 active 越界（filtered 缩短时）
  const shownActive = active < filtered.length ? active : 0

  const pick = useCallback(
    (value: string): void => {
      props.onChange(value)
      setOpen(false)
      setActive(0)
    },
    [props]
  )

  // 面板挂在 body 上，需手动定位；用 ref 直接写 style 避免 effect 内 setState
  const reposition = useCallback((): void => {
    const anchor = anchorRef.current
    const panel = panelRef.current
    if (!anchor || !panel) return
    const rect = anchor.getBoundingClientRect()
    const gap = 4
    const panelHeight = panel.offsetHeight
    const fitsBelow = rect.bottom + gap + panelHeight <= window.innerHeight - 8
    panel.style.left = `${rect.left}px`
    panel.style.width = `${rect.width}px`
    panel.style.top = fitsBelow
      ? `${rect.bottom + gap}px`
      : `${Math.max(8, rect.top - gap - panelHeight)}px`
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    reposition()
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [open, reposition, filtered])

  useEffect(() => {
    return () => {
      if (blurTimer.current) clearTimeout(blurTimer.current)
    }
  }, [])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, filtered.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.max(i - 1, 0))
      return
    }
    if (e.key === 'Enter' && open && shownActive < filtered.length) {
      e.preventDefault()
      pick(filtered[shownActive])
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setActive(0)
    }
  }

  return (
    <div ref={anchorRef} className="relative">
      <Input
        aria-label={props.ariaLabel}
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${props.ariaLabel}-listbox`}
        placeholder={props.placeholder}
        value={props.value}
        className={cn('font-mono', props.className)}
        onChange={(e) => {
          props.onChange(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // 延迟关闭，让选项 mousedown 先触发
          blurTimer.current = setTimeout(() => {
            setOpen(false)
            setActive(0)
          }, 120)
        }}
        onKeyDown={onKeyDown}
      />
      {open && filtered.length > 0
        ? createPortal(
            <ul
              ref={panelRef}
              id={`${props.ariaLabel}-listbox`}
              role="listbox"
              aria-label={props.ariaLabel}
              className="fixed z-50 max-h-60 overflow-y-auto rounded-xl bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/5 backdrop-blur-sm"
            >
              {filtered.map((option, index) => (
                <li
                  key={option}
                  role="option"
                  aria-selected={index === shownActive}
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(option)}
                  className={cn(
                    'flex w-full cursor-default items-center rounded-md px-2 py-1.5 font-mono text-sm transition-[background-color] duration-100',
                    index === shownActive
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/70'
                  )}
                >
                  {option}
                </li>
              ))}
            </ul>,
            document.body
          )
        : null}
    </div>
  )
}
