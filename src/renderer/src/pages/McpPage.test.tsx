import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { McpPage } from './McpPage'

describe('McpPage', () => {
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
})
