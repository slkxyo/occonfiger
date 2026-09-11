import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from './components/ui/provider'
import { useConfigStore } from './store/configStore'
import { App } from './App'

function stubApi(overrides: Record<string, unknown> = {}): void {
  vi.stubGlobal('api', {
    readConfig: vi.fn().mockResolvedValue({
      mcp: { exa: { type: 'remote', url: 'https://x' } }
    }),
    saveConfig: vi.fn().mockResolvedValue([]),
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
    expect(screen.getByRole('button', { name: '查看原始 JSON' })).toBeInTheDocument()
    expect(screen.queryByText('opencode 配置')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '保存' })).not.toBeInTheDocument()
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

  it('shows the raw JSON in the content area', async () => {
    stubApi()
    render(
      <Provider>
        <App />
      </Provider>
    )
    await screen.findByRole('button', { name: '展开 exa' })
    await userEvent.click(screen.getByRole('button', { name: '查看原始 JSON' }))
    expect(await screen.findByText('原始 JSON（只读）')).toBeInTheDocument()
    expect(screen.getByText(/"exa"/)).toBeInTheDocument()
  })

  it('asks to save before leaving and saves on confirm', async () => {
    const saveConfig = vi.fn().mockResolvedValue([])
    stubApi({ saveConfig })
    render(
      <Provider>
        <App />
      </Provider>
    )
    await userEvent.click(await screen.findByRole('checkbox', { name: 'exa 启用' }))
    await userEvent.click(screen.getByRole('button', { name: '设置' }))
    expect(await screen.findByText('有未保存的修改')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(saveConfig).toHaveBeenCalled()
    expect(await screen.findByText('权限')).toBeInTheDocument()
  })

  it('discards changes when leaving without saving', async () => {
    stubApi()
    render(
      <Provider>
        <App />
      </Provider>
    )
    await userEvent.click(await screen.findByRole('checkbox', { name: 'exa 启用' }))
    await userEvent.click(screen.getByRole('button', { name: '设置' }))
    await userEvent.click(await screen.findByRole('button', { name: '不保存' }))
    expect(await screen.findByText('权限')).toBeInTheDocument()
    expect(useConfigStore.getState().draft.mcp).toEqual({
      exa: { type: 'remote', url: 'https://x' }
    })
  })

  it('stays on the page when canceling', async () => {
    stubApi()
    render(
      <Provider>
        <App />
      </Provider>
    )
    await userEvent.click(await screen.findByRole('checkbox', { name: 'exa 启用' }))
    await userEvent.click(screen.getByRole('button', { name: '设置' }))
    await userEvent.click(await screen.findByRole('button', { name: '取消' }))
    expect(screen.getByRole('button', { name: '展开 exa' })).toBeInTheDocument()
  })
})
