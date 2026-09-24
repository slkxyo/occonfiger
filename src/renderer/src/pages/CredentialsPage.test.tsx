import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/app/provider'
import { CredentialsPage } from './CredentialsPage'

function stubApi(
  overrides: Record<string, unknown> = {}
): Record<string, ReturnType<typeof vi.fn>> {
  const api = {
    listCredentials: vi.fn().mockResolvedValue([
      { provider: 'deepseek', type: 'api', keyTail: 'abcd' },
      { provider: 'anthropic', type: 'oauth' }
    ]),
    updateCredentialKey: vi.fn().mockResolvedValue(null),
    deleteCredential: vi.fn().mockResolvedValue(null),
    ...overrides
  }
  vi.stubGlobal('api', api)
  return api
}

describe('CredentialsPage', () => {
  afterEach(() => cleanup())

  it('lists providers with masked keys', async () => {
    stubApi()
    render(
      <Provider>
        <CredentialsPage />
      </Provider>
    )
    expect(await screen.findByText('deepseek')).toBeInTheDocument()
    expect(screen.getByText('••••abcd')).toBeInTheDocument()
    expect(screen.getByText('anthropic')).toBeInTheDocument()
  })

  it('updates an api key', async () => {
    const api = stubApi()
    render(
      <Provider>
        <CredentialsPage />
      </Provider>
    )
    await userEvent.click(await screen.findByRole('button', { name: '修改密钥' }))
    await userEvent.type(screen.getByLabelText('新密钥'), 'sk-newkey')
    await userEvent.click(screen.getByRole('button', { name: '保存密钥' }))
    expect(api.updateCredentialKey).toHaveBeenCalledWith('deepseek', 'sk-newkey')
  })

  it('deletes after confirmation', async () => {
    const api = stubApi()
    const confirm = vi.fn().mockReturnValue(true)
    vi.stubGlobal('confirm', confirm)
    render(
      <Provider>
        <CredentialsPage />
      </Provider>
    )
    await userEvent.click(await screen.findByRole('button', { name: '删除 deepseek' }))
    expect(confirm).toHaveBeenCalledWith('确定删除 deepseek 的凭证吗？')
    expect(api.deleteCredential).toHaveBeenCalledWith('deepseek')
  })

  it('does not delete when confirmation is cancelled', async () => {
    const api = stubApi()
    const confirm = vi.fn().mockReturnValue(false)
    vi.stubGlobal('confirm', confirm)
    render(
      <Provider>
        <CredentialsPage />
      </Provider>
    )
    await userEvent.click(await screen.findByRole('button', { name: '删除 deepseek' }))
    expect(confirm).toHaveBeenCalledWith('确定删除 deepseek 的凭证吗？')
    expect(api.deleteCredential).not.toHaveBeenCalled()
  })

  it('shows an error when listing credentials fails', async () => {
    stubApi({ listCredentials: vi.fn().mockRejectedValue(new Error('读取失败')) })
    render(
      <Provider>
        <CredentialsPage />
      </Provider>
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('操作失败：读取失败')
    expect(screen.queryByText(/尚无已连接的服务商/)).not.toBeInTheDocument()
  })

  it('shows empty state', async () => {
    stubApi({ listCredentials: vi.fn().mockResolvedValue([]) })
    render(
      <Provider>
        <CredentialsPage />
      </Provider>
    )
    expect(await screen.findByText(/尚无已连接的服务商/)).toBeInTheDocument()
  })
})
