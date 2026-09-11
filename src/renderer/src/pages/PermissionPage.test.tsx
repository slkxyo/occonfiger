import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { PermissionPage } from './PermissionPage'

function renderPage(): void {
  render(
    <Provider>
      <PermissionPage />
    </Provider>
  )
}

describe('PermissionPage', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))
  afterEach(() => cleanup())

  it('sets a permission action', async () => {
    renderPage()
    const select = screen.getByLabelText('edit')
    await userEvent.selectOptions(select, 'deny')
    expect(useConfigStore.getState().draft.permission).toEqual({ edit: 'deny' })
  })

  it('sets a global bash action', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: '使用全局动作' }))
    expect(useConfigStore.getState().draft.permission).toEqual({ bash: 'ask' })
    await userEvent.selectOptions(screen.getByLabelText('bash 全局动作'), 'deny')
    expect(useConfigStore.getState().draft.permission).toEqual({ bash: 'deny' })
  })

  it('adds a bash pattern rule', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText('新 bash 模式'), 'git *')
    await userEvent.selectOptions(screen.getByLabelText('新 bash 动作'), 'allow')
    await userEvent.click(screen.getByRole('button', { name: '添加 bash 规则' }))
    expect(useConfigStore.getState().draft.permission).toEqual({ bash: { 'git *': 'allow' } })
  })

  it('switches bash between global and rule modes', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText('新 bash 模式'), 'git *')
    await userEvent.click(screen.getByRole('button', { name: '添加 bash 规则' }))
    expect(useConfigStore.getState().draft.permission).toEqual({ bash: { 'git *': 'ask' } })
    await userEvent.click(screen.getByRole('button', { name: '使用全局动作' }))
    expect(useConfigStore.getState().draft.permission).toEqual({ bash: 'ask' })
    await userEvent.click(screen.getByRole('button', { name: '改为规则模式' }))
    expect(useConfigStore.getState().draft.permission).toEqual({ bash: {} })
  })
})
