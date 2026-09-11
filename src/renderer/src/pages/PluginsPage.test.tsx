import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { PluginsPage } from './PluginsPage'

describe('PluginsPage', () => {
  it('renders plugin and formatter controls', () => {
    useConfigStore.getState().loadConfig({})
    render(
      <Provider>
        <PluginsPage />
      </Provider>
    )
    expect(screen.getByLabelText('插件列表')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '启用格式化' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '启用 LSP' })).toBeInTheDocument()
  })
})
