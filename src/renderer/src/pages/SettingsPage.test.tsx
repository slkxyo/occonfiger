import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { SettingsPage } from './SettingsPage'
import { pickMenu } from '../test/menu'

describe('SettingsPage', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))
  afterEach(() => cleanup())

  it('turns autoupdate off by writing false', async () => {
    render(
      <Provider>
        <SettingsPage />
      </Provider>
    )
    const toggle = screen.getByRole('checkbox', { name: '自动更新' })
    expect(toggle).toBeChecked()
    await userEvent.click(toggle)
    expect(useConfigStore.getState().draft.autoupdate).toBe(false)
  })

  it('removes the field when turning autoupdate back on', async () => {
    useConfigStore.getState().loadConfig({ autoupdate: false })
    render(
      <Provider>
        <SettingsPage />
      </Provider>
    )
    const toggle = screen.getByRole('checkbox', { name: '自动更新' })
    expect(toggle).not.toBeChecked()
    await userEvent.click(toggle)
    expect(useConfigStore.getState().draft.autoupdate).toBeUndefined()
  })

  it('sets the global permission action', async () => {
    render(
      <Provider>
        <SettingsPage />
      </Provider>
    )
    await pickMenu('全局权限', 'deny')
    expect(useConfigStore.getState().draft.permission).toEqual({ '*': 'deny' })
  })

  it('removes the permission field when cleared', async () => {
    useConfigStore.getState().loadConfig({ permission: { '*': 'deny' } })
    render(
      <Provider>
        <SettingsPage />
      </Provider>
    )
    await pickMenu('全局权限', '（未设置）')
    expect(useConfigStore.getState().draft.permission).toBeUndefined()
  })
})
