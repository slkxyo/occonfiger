import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { PluginsPage } from './PluginsPage'

describe('PluginsPage', () => {
  afterEach(() => cleanup())

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

  it('keeps plugin tuple after editing', async () => {
    useConfigStore.getState().loadConfig({ plugin: ['a', ['pkg', { opt: 1 }]] })
    render(
      <Provider>
        <PluginsPage />
      </Provider>
    )
    await userEvent.type(screen.getByLabelText('插件列表'), 'b{enter}')
    expect(useConfigStore.getState().draft.plugin).toEqual(['a', ['pkg', { opt: 1 }], 'b'])
  })

  it('toggles a tool in the boolean key-value editor', async () => {
    useConfigStore.getState().loadConfig({ tools: { read: false } })
    render(
      <Provider>
        <PluginsPage />
      </Provider>
    )
    const toggle = screen.getByRole('checkbox', { name: '工具 值 read' })
    expect(toggle).not.toBeChecked()
    await userEvent.click(toggle)
    expect(useConfigStore.getState().draft.tools).toEqual({ read: true })
  })

  it('shows read-only hint for object formatter', () => {
    useConfigStore.getState().loadConfig({ formatter: { prettier: {} } })
    render(
      <Provider>
        <PluginsPage />
      </Provider>
    )
    expect(screen.queryByRole('checkbox', { name: '启用格式化' })).not.toBeInTheDocument()
    expect(screen.getByText('当前为对象配置，暂不支持可视化编辑')).toBeInTheDocument()
    expect(useConfigStore.getState().draft.formatter).toEqual({ prettier: {} })
  })
})
