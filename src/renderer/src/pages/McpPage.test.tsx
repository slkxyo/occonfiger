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
