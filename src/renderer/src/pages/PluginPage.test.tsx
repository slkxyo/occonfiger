import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/app/provider'
import { PluginPage } from './PluginPage'

function stubApi(overrides: Record<string, unknown> = {}): void {
  vi.stubGlobal('api', {
    listPlugins: vi.fn().mockResolvedValue([
      { name: 'disabled-one', enabled: false, spec: 'disabled-one' },
      { name: 'enabled-one', enabled: true, spec: 'enabled-one' }
    ]),
    setPluginEnabled: vi.fn().mockResolvedValue(null),
    deletePlugin: vi.fn().mockResolvedValue(null),
    ...overrides
  })
}

describe('PluginPage', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('lists enabled plugins before disabled ones', async () => {
    stubApi()
    render(
      <Provider>
        <PluginPage />
      </Provider>
    )
    const names = await screen.findAllByText(/enabled-one|disabled-one/)
    expect(names[0]).toHaveTextContent('enabled-one')
    expect(names[1]).toHaveTextContent('disabled-one')
  })

  it('enables a disabled plugin', async () => {
    const setPluginEnabled = vi.fn().mockResolvedValue(null)
    stubApi({ setPluginEnabled })
    render(
      <Provider>
        <PluginPage />
      </Provider>
    )
    await userEvent.click(await screen.findByRole('switch', { name: 'disabled-one 启用' }))
    expect(setPluginEnabled).toHaveBeenCalledWith('disabled-one', true)
  })

  it('deletes a plugin after confirmation', async () => {
    const deletePlugin = vi.fn().mockResolvedValue(null)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    stubApi({ deletePlugin })
    render(
      <Provider>
        <PluginPage />
      </Provider>
    )
    await userEvent.click(await screen.findByRole('button', { name: '删除 enabled-one' }))
    expect(deletePlugin).toHaveBeenCalledWith('enabled-one')
  })

  it('does not delete when confirmation is cancelled', async () => {
    const deletePlugin = vi.fn().mockResolvedValue(null)
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    stubApi({ deletePlugin })
    render(
      <Provider>
        <PluginPage />
      </Provider>
    )
    await userEvent.click(await screen.findByRole('button', { name: '删除 enabled-one' }))
    expect(deletePlugin).not.toHaveBeenCalled()
  })
})
