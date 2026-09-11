import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from './components/ui/provider'
import { App } from './App'

const api = {
  readConfig: vi.fn().mockResolvedValue({ model: 'anthropic/claude' }),
  getConfigPath: vi.fn().mockResolvedValue('/home/u/.config/opencode/opencode.jsonc'),
  saveConfig: vi.fn(),
  getRawContent: vi.fn()
}

describe('App', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows the config path and nav', async () => {
    vi.stubGlobal('api', api)
    render(
      <Provider>
        <App />
      </Provider>
    )
    expect(await screen.findByText('/home/u/.config/opencode/opencode.jsonc')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '常规' })).toBeInTheDocument()
  })

  it('shows an alert when startup loading fails', async () => {
    vi.stubGlobal('api', {
      ...api,
      readConfig: vi.fn().mockRejectedValue(new Error('磁盘不可读')),
      getConfigPath: vi.fn().mockResolvedValue('/home/u/.config/opencode/opencode.jsonc')
    })
    render(
      <Provider>
        <App />
      </Provider>
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('磁盘不可读')
  })

  it('shows validation errors in an alert and force saves', async () => {
    const saveConfig = vi
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error('校验未通过'), { errors: ['未知顶层键：foo'] })
      )
      .mockResolvedValueOnce(['未知顶层键：foo'])
    vi.stubGlobal('api', { ...api, saveConfig })
    render(
      <Provider>
        <App />
      </Provider>
    )
    await screen.findByText('/home/u/.config/opencode/opencode.jsonc')
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('未知顶层键：foo')
    await userEvent.click(screen.getByRole('button', { name: '强制保存' }))
    expect(await screen.findByText('已强制保存，需重启 opencode 生效')).toBeInTheDocument()
  })

  it('renders the credentials page when selected', async () => {
    vi.stubGlobal('api', {
      ...api,
      listCredentials: vi.fn().mockResolvedValue([])
    })
    render(
      <Provider>
        <App />
      </Provider>
    )
    await userEvent.click(screen.getByRole('button', { name: '服务商凭证' }))
    expect(await screen.findByText(/尚无已连接的服务商/)).toBeInTheDocument()
  })

  it('shows normalized JSON in the raw dialog', async () => {
    vi.stubGlobal('api', {
      ...api,
      readConfig: vi.fn().mockResolvedValue({
        autoupdate: 'true',
        references: { foo: { kind: 'path', path: '/x' } }
      })
    })
    render(
      <Provider>
        <App />
      </Provider>
    )
    await screen.findByText('/home/u/.config/opencode/opencode.jsonc')
    await userEvent.click(screen.getByRole('button', { name: '查看原始 JSON' }))
    expect(await screen.findByText(/"autoupdate": true/)).toBeInTheDocument()
    expect(screen.queryByText(/"kind"/)).not.toBeInTheDocument()
  })
})
