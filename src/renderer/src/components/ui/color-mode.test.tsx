import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from './provider'
import { ColorModeButton } from './color-mode'

describe('ColorModeButton', () => {
  it('renders a toggle button', () => {
    render(
      <Provider>
        <ColorModeButton />
      </Provider>
    )
    expect(screen.getByRole('button', { name: /切换主题|theme/i })).toBeInTheDocument()
  })
})
