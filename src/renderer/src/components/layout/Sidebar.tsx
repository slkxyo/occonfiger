import { Menu } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ColorModeButton } from '../app/color-mode'

export type NavItem = { id: string; label: string; icon?: LucideIcon }

export function Sidebar(props: {
  items: NavItem[]
  active: string
  collapsed: boolean
  onNavigate: (id: string) => void
  onToggleCollapse: () => void
}): React.JSX.Element {
  return (
    <nav
      className="flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-2 py-3 transition-[width] duration-150 ease-out"
      style={{ width: props.collapsed ? '64px' : '220px' }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {props.items.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={props.active === item.id ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full min-w-0 shrink-0 justify-start gap-0"
              title={item.label}
              aria-label={item.label}
              onClick={() => props.onNavigate(item.id)}
            >
              {Icon ? (
                <span
                  className="inline-flex shrink-0 transition-[margin-left] duration-[180ms] ease-out"
                  style={{ marginLeft: props.collapsed ? 'calc(50% - 9px)' : '0px' }}
                >
                  <Icon size={18} />
                </span>
              ) : null}
              <span
                className="block overflow-hidden text-sm whitespace-nowrap transition-[max-width,opacity,margin-left] duration-[180ms] ease-out"
                style={{
                  marginLeft: props.collapsed ? '0px' : '8px',
                  maxWidth: props.collapsed ? '0px' : '170px',
                  opacity: props.collapsed ? 0 : 1
                }}
              >
                {item.label}
              </span>
            </Button>
          )
        })}
      </div>
      <div className="mt-2 flex flex-col items-center gap-1 border-t border-sidebar-border pt-2">
        <ColorModeButton />
        <Button
          size="sm"
          variant="ghost"
          aria-label={props.collapsed ? '展开侧栏' : '折叠侧栏'}
          onClick={props.onToggleCollapse}
        >
          <Menu size={16} />
        </Button>
      </div>
    </nav>
  )
}
