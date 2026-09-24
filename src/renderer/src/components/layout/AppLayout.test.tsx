import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Boxes, Settings } from 'lucide-react'
import { Provider } from '../app/provider'
import { AppLayout } from './AppLayout'

const items = [
  { id: 'general', label: '常规', icon: Settings },
  { id: 'model', label: '模型', icon: Boxes }
]

describe('AppLayout', () => {
  afterEach(() => cleanup())

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

  it('collapses from the control at the bottom of the sidebar', async () => {
    render(
      <Provider>
        <AppLayout navItems={items} active="general" onNavigate={() => {}}>
          <div>内容</div>
        </AppLayout>
      </Provider>
    )
    expect(screen.getByRole('button', { name: '常规' }).textContent).toContain('常规')
    await userEvent.click(screen.getByRole('button', { name: '折叠侧栏' }))
    const collapsed = screen.getByRole('button', { name: '常规' })
    expect(collapsed.getAttribute('aria-label')).toBe('常规')
    expect(collapsed.querySelector('svg')).not.toBeNull()
  })

  it('has no persistent title bar and keeps the theme toggle in the sidebar', () => {
    render(
      <Provider>
        <AppLayout navItems={items} active="general" onNavigate={() => {}}>
          <div>内容</div>
        </AppLayout>
      </Provider>
    )
    expect(screen.queryByText('opencode 配置')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /主题/ })).toBeInTheDocument()
  })
})
