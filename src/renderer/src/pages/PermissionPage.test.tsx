import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { PermissionPage } from './PermissionPage'

describe('PermissionPage', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))

  it('sets a permission action', async () => {
    render(
      <Provider>
        <PermissionPage />
      </Provider>
    )
    const select = screen.getByLabelText('edit')
    await userEvent.selectOptions(select, 'deny')
    expect(useConfigStore.getState().draft.permission).toEqual({ edit: 'deny' })
  })
})
