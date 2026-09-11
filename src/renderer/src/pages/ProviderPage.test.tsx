import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { ProviderPage } from './ProviderPage'

function renderPage(): void {
  render(
    <Provider>
      <ProviderPage />
    </Provider>
  )
}

describe('ProviderPage', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))
  afterEach(() => cleanup())

  it('adds a provider card', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText('新 Provider ID'), 'myprovider')
    await userEvent.click(screen.getByRole('button', { name: '添加 Provider' }))
    expect(useConfigStore.getState().draft.provider).toEqual({ myprovider: {} })
  })

  it('renders api and models editors for a provider', () => {
    useConfigStore.getState().setField(['provider', 'alpha'], {})
    renderPage()
    expect(screen.getByLabelText('API 类型')).toBeInTheDocument()
    expect(screen.getByLabelText('alpha 新模型名')).toBeInTheDocument()
  })

  it('adds a model under a provider', async () => {
    useConfigStore.getState().setField(['provider', 'alpha'], {})
    renderPage()
    await userEvent.type(screen.getByLabelText('alpha 新模型名'), 'gpt-4o')
    await userEvent.click(screen.getByRole('button', { name: '添加模型' }))
    expect(useConfigStore.getState().draft.provider).toEqual({
      alpha: { models: { 'gpt-4o': {} } }
    })
  })
})
