import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from './provider'
import { ColorModeButton } from './color-mode'
import { nextTheme } from './theme-order'

describe('nextTheme', () => {
  it('cycles light -> dark -> system -> light', () => {
    expect(nextTheme('light')).toBe('dark')
    expect(nextTheme('dark')).toBe('system')
    expect(nextTheme('system')).toBe('light')
  })

  it('treats an unknown current theme as system', () => {
    expect(nextTheme(undefined)).toBe('light')
  })
})

describe('ColorModeButton', () => {
  it('renders a single toggle button', () => {
    render(
      <Provider>
        <ColorModeButton />
      </Provider>
    )
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: /主题/ })).toBeInTheDocument()
  })
})
