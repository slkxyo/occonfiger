import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from './ui/provider'
import { useConfigStore } from '../store/configStore'
import { ConfigViewButton } from './ConfigViewButton'

describe('ConfigViewButton', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({ model: 'a/b' }))
  afterEach(() => cleanup())

  it('opens a dialog showing the current config', async () => {
    render(
      <Provider>
        <ConfigViewButton />
      </Provider>
    )
    expect(screen.queryByText('配置文件')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '查看配置文件' }))
    expect(await screen.findByText('配置文件')).toBeInTheDocument()
    expect(screen.getByText(/"model": "a\/b"/)).toBeInTheDocument()
  })

  it('closes the dialog', async () => {
    render(
      <Provider>
        <ConfigViewButton />
      </Provider>
    )
    await userEvent.click(screen.getByRole('button', { name: '查看配置文件' }))
    await userEvent.click(await screen.findByRole('button', { name: '关闭' }))
    await waitFor(() => expect(screen.queryByText('配置文件')).not.toBeInTheDocument())
  })
})
