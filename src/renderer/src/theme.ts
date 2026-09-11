import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: 'Inter, -apple-system, PingFang SC, system-ui, sans-serif' },
        body: { value: 'Inter, -apple-system, PingFang SC, system-ui, sans-serif' },
        mono: { value: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace' }
      },
      radii: {
        card: { value: '12px' },
        control: { value: '8px' }
      }
    },
    semanticTokens: {
      colors: {
        accent: {
          solid: { value: { base: '#4F46E5', _dark: '#818CF8' } },
          contrast: { value: { base: 'white', _dark: '#0F1115' } },
          muted: { value: { base: '#EEF2FF', _dark: '#1E1B4B' } }
        },
        bg: {
          default: { value: { base: '#FFFFFF', _dark: '#0F1115' } },
          subtle: { value: { base: '#F7F8FA', _dark: '#16181D' } },
          muted: { value: { base: '#F0F1F3', _dark: '#1E2128' } }
        },
        fg: {
          default: { value: { base: '#1A1D21', _dark: '#E8EAED' } },
          muted: { value: { base: '#6B7280', _dark: '#9BA1A9' } },
          subtle: { value: { base: '#9CA3AF', _dark: '#6B7280' } }
        },
        border: {
          default: { value: { base: '#E4E6EA', _dark: '#262A31' } }
        },
        success: { value: { base: '#10B981', _dark: '#34D399' } },
        warning: { value: { base: '#F59E0B', _dark: '#FBBF24' } },
        error: { value: { base: '#EF4444', _dark: '#F87171' } }
      }
    }
  }
})

export const system = createSystem(defaultConfig, config)
