import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../ui/provider'
import { AppLayout } from './AppLayout'

const items = [
  { id: 'general', label: '常规' },
  { id: 'model', label: '模型' }
]

describe('AppLayout', () => {
  it('renders nav items and fires onNavigate', async () => {
    const onNavigate = vi.fn()
    render(
      <Provider>
        <AppLayout navItems={items} active="general" onNavigate={onNavigate}>
          <div>内容</div>
        </AppLayout>
      </Provider>
    )
    await userEvent.click(screen.getByRole('button', { name: '模型' }))
    expect(onNavigate).toHaveBeenCalledWith('model')
  })
})
