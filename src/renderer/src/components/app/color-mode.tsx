import { Button } from '@/components/ui/button'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { nextTheme, type ThemeName } from './theme-order'

const LABELS: Record<ThemeName, string> = { light: '亮色', dark: '暗色', system: '自动' }
const ICONS: Record<ThemeName, typeof Sun> = { light: Sun, dark: Moon, system: Monitor }

export function ColorModeButton(): React.JSX.Element {
  const { theme, setTheme } = useTheme()
  const current = (theme ?? 'system') as ThemeName
  const Icon = ICONS[current] ?? Monitor
  const next = nextTheme(current)
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label={`主题：${LABELS[current]}，点击切换为${LABELS[next]}`}
      onClick={() => setTheme(next)}
    >
      <Icon size={16} />
    </Button>
  )
}
