import { Button, HStack } from '@chakra-ui/react'
import { useTheme } from 'next-themes'

export function ColorModeButton(): React.JSX.Element {
  const { theme, setTheme } = useTheme()
  const variant = (value: string): React.ComponentProps<typeof Button>['variant'] =>
    theme === value ? 'subtle' : 'ghost'
  return (
    <HStack gap="0">
      <Button
        size="xs"
        variant={variant('light')}
        aria-label="亮色"
        onClick={() => setTheme('light')}
      >
        ☀️
      </Button>
      <Button
        size="xs"
        variant={variant('dark')}
        aria-label="暗色"
        onClick={() => setTheme('dark')}
      >
        🌙
      </Button>
      <Button
        size="xs"
        variant={variant('system')}
        aria-label="切换主题"
        onClick={() => setTheme('system')}
      >
        自动
      </Button>
    </HStack>
  )
}
