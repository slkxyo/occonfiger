import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { ProviderPage } from './ProviderPage'

describe('ProviderPage', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))

  it('adds a provider card', async () => {
    render(
      <Provider>
        <ProviderPage />
      </Provider>
    )
    await userEvent.type(screen.getByLabelText('新 Provider ID'), 'myprovider')
    await userEvent.click(screen.getByRole('button', { name: '添加 Provider' }))
    expect(useConfigStore.getState().draft.provider).toEqual({ myprovider: {} })
  })
})
