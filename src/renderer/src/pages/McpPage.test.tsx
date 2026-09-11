import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { McpPage } from './McpPage'

describe('McpPage', () => {
  afterEach(() => cleanup())

  beforeEach(() =>
    useConfigStore.getState().loadConfig({ mcp: { exa: { type: 'remote', url: 'https://x' } } })
  )

  it('renders remote fields for a remote server', () => {
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    expect(screen.getByLabelText('URL')).toBeInTheDocument()
    expect(screen.queryByLabelText('命令')).not.toBeInTheDocument()
  })

  it('renders local environment as a key-value editor', () => {
    useConfigStore
      .getState()
      .loadConfig({ mcp: { s: { type: 'local', environment: { FOO: 'bar' } } } })
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    expect(screen.getByLabelText('环境变量 值 FOO')).toHaveValue('bar')
  })

  it('renders remote headers as a key-value editor', () => {
    useConfigStore.getState().loadConfig({
      mcp: { exa: { type: 'remote', url: 'https://x', headers: { 'X-Token': 'abc' } } }
    })
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    expect(screen.getByLabelText('请求头 值 X-Token')).toHaveValue('abc')
  })

  it('toggles oauth for a remote server and writes false when disabled', async () => {
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    const oauth = screen.getByRole('checkbox', { name: 'OAuth' })
    expect(oauth).not.toBeChecked()
    await userEvent.click(oauth)
    expect(useConfigStore.getState().draft.mcp).toEqual({
      exa: { type: 'remote', url: 'https://x', oauth: true }
    })
    await userEvent.click(oauth)
    expect(useConfigStore.getState().draft.mcp).toEqual({
      exa: { type: 'remote', url: 'https://x', oauth: false }
    })
  })

  it('initializes a new server with local type', async () => {
    useConfigStore.getState().loadConfig({})
    render(
      <Provider>
        <McpPage />
      </Provider>
    )
    await userEvent.type(screen.getByLabelText('新 MCP 服务名'), 'playwright')
    await userEvent.click(screen.getByRole('button', { name: '添加 MCP 服务' }))
    expect(useConfigStore.getState().draft.mcp).toEqual({ playwright: { type: 'local' } })
  })
})
