import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/app/provider'
import { useConfigStore } from '../store/configStore'
import { SettingsPage } from './SettingsPage'

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

  it('renders the permission rules editor', () => {
    render(
      <Provider>
        <SettingsPage />
      </Provider>
    )
    expect(screen.getByText('未配置权限规则')).toBeInTheDocument()
  })
})
