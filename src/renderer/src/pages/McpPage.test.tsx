import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/app/provider'
import { useConfigStore } from '../store/configStore'
import { McpPage } from './McpPage'

async function expand(name: string): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: `展开 ${name}` }))
}

describe('McpPage', () => {
  afterEach(() => cleanup())

  beforeEach(() =>
    useConfigStore
      .getState()
      .loadConfig({ mcp: { servers: { exa: { type: 'remote', url: 'https://x' } } } })
  )

  it('collapses server details by default', () => {
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    expect(screen.queryByLabelText('URL')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '展开 exa' })).toBeInTheDocument()
  })

  it('renders remote fields for a remote server after expanding', async () => {
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    await expand('exa')
    expect(screen.getByLabelText('URL')).toBeInTheDocument()
    expect(screen.queryByLabelText('命令')).not.toBeInTheDocument()
  })

  it('renders local environment as a key-value editor', async () => {
    useConfigStore
      .getState()
      .loadConfig({ mcp: { servers: { s: { type: 'local', environment: { FOO: 'bar' } } } } })
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    await expand('s')
    expect(screen.getByLabelText('环境变量 值 FOO')).toHaveValue('bar')
  })

  it('renders remote headers as a key-value editor', async () => {
    useConfigStore.getState().loadConfig({
      mcp: { servers: { exa: { type: 'remote', url: 'https://x', headers: { 'X-Token': 'abc' } } } }
    })
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    await expand('exa')
    expect(screen.getByLabelText('请求头 值 X-Token')).toHaveValue('abc')
  })

  it('writes false when disabling auto-detection and removes the key when re-enabled', async () => {
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    await expand('exa')
    const oauth = screen.getByRole('switch', { name: '禁用自动检测' })
    expect(oauth).not.toBeChecked()
    await userEvent.click(oauth)
    expect(useConfigStore.getState().draft.mcp).toEqual({
      servers: { exa: { type: 'remote', url: 'https://x', oauth: false } }
    })
    await userEvent.click(oauth)
    expect(useConfigStore.getState().draft.mcp).toEqual({
      servers: { exa: { type: 'remote', url: 'https://x' } }
    })
  })

  it('keeps an oauth object untouched and hides the switch', async () => {
    useConfigStore.getState().loadConfig({
      mcp: { servers: { exa: { type: 'remote', url: 'https://x', oauth: { client_id: 'abc' } } } }
    })
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    await expand('exa')
    expect(screen.queryByRole('switch', { name: '禁用自动检测' })).not.toBeInTheDocument()
    expect(screen.getByText('当前为 OAuth 对象配置，暂不支持可视化编辑')).toBeInTheDocument()
    expect(useConfigStore.getState().draft.mcp).toEqual({
      servers: { exa: { type: 'remote', url: 'https://x', oauth: { client_id: 'abc' } } }
    })
  })

  it('shows the switch checked when oauth is false and removes the key when unchecked', async () => {
    useConfigStore.getState().loadConfig({
      mcp: { servers: { exa: { type: 'remote', url: 'https://x', oauth: false } } }
    })
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    await expand('exa')
    const oauth = screen.getByRole('switch', { name: '禁用自动检测' })
    expect(oauth).toBeChecked()
    await userEvent.click(oauth)
    expect(useConfigStore.getState().draft.mcp).toEqual({
      servers: { exa: { type: 'remote', url: 'https://x' } }
    })
  })

  it('toggles disabled from the collapsed header', async () => {
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    const toggle = screen.getByRole('checkbox', { name: 'exa 启用' })
    expect(toggle).toBeChecked()
    await userEvent.click(toggle)
    expect(useConfigStore.getState().draft.mcp).toEqual({
      servers: { exa: { type: 'remote', url: 'https://x', disabled: true } }
    })
    await userEvent.click(toggle)
    expect(useConfigStore.getState().draft.mcp).toEqual({
      servers: { exa: { type: 'remote', url: 'https://x' } }
    })
  })

  it('lists enabled servers before disabled ones', () => {
    useConfigStore.getState().loadConfig({
      mcp: {
        servers: {
          off: { type: 'local', disabled: true },
          on: { type: 'local' },
          explicit: { type: 'local', disabled: false }
        }
      }
    })
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    const names = screen
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'))
      .filter((label): label is string => typeof label === 'string' && /^(展开|折叠) /.test(label))
    expect(names).toEqual(['展开 on', '展开 explicit', '展开 off'])
  })

  it('does not offer a button to add a new server', () => {
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    expect(screen.queryByRole('button', { name: '添加 MCP 服务' })).not.toBeInTheDocument()
  })

  it('writes the request timeout as a number', async () => {
    useConfigStore
      .getState()
      .loadConfig({ mcp: { servers: { s: { type: 'local', command: ['x'] } } } })
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    await expand('s')
    const input = screen.getByLabelText('请求超时（毫秒）')
    await userEvent.clear(input)
    await userEvent.type(input, '5000')
    const draft = useConfigStore.getState().draft as {
      mcp: { servers: { s: { timeout: { request: number } } } }
    }
    expect(draft.mcp.servers.s.timeout.request).toBe(5000)
  })
})
