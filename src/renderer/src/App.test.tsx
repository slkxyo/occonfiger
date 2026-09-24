import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from './components/app/provider'
import { App } from './App'

function stubApi(overrides: Record<string, unknown> = {}): void {
  vi.stubGlobal('api', {
    readConfig: vi.fn().mockResolvedValue({
      mcp: { servers: { exa: { type: 'remote', url: 'https://x' } } }
    }),
    saveConfig: vi.fn().mockResolvedValue([]),
    listPlugins: vi.fn().mockResolvedValue([]),
    ...overrides
  })
}

describe('App', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('loads the config and shows the sidebar without a title bar', async () => {
    stubApi()
    render(
      <Provider>
        <App />
      </Provider>
    )
    expect(await screen.findByRole('button', { name: '展开 exa' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'MCP 服务' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '插件管理' })).toBeInTheDocument()
    expect(screen.queryByText('opencode 配置')).not.toBeInTheDocument()
  })

  it('shows an alert when startup loading fails', async () => {
    vi.stubGlobal('api', {
      readConfig: vi.fn().mockRejectedValue(new Error('磁盘不可读'))
    })
    render(
      <Provider>
        <App />
      </Provider>
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('磁盘不可读')
  })

  it('opens the config dialog from a config page', async () => {
    stubApi()
    render(
      <Provider>
        <App />
      </Provider>
    )
    await screen.findByRole('button', { name: '展开 exa' })
    await userEvent.click(screen.getByRole('button', { name: '查看配置文件' }))
    expect(await screen.findByText('配置文件')).toBeInTheDocument()
  })

  it('auto saves when a control changes', async () => {
    const saveConfig = vi.fn().mockResolvedValue([])
    stubApi({ saveConfig })
    render(
      <Provider>
        <App />
      </Provider>
    )
    await userEvent.click(await screen.findByRole('switch', { name: 'exa 启用' }))
    await waitFor(() => expect(saveConfig).toHaveBeenCalled())
  })

  it('navigates to the plugin manager', async () => {
    stubApi()
    render(
      <Provider>
        <App />
      </Provider>
    )
    await screen.findByRole('button', { name: '展开 exa' })
    await userEvent.click(screen.getByRole('button', { name: '插件管理' }))
    expect(await screen.findByText(/尚未配置任何插件/)).toBeInTheDocument()
  })
})
