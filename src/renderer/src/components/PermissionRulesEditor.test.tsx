import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { PermissionRulesEditor } from './PermissionRulesEditor'

describe('PermissionRulesEditor', () => {
  beforeEach(() =>
    useConfigStore
      .getState()
      .loadConfig({ permissions: [{ action: 'shell', resource: '*', effect: 'ask' }] })
  )
  afterEach(() => cleanup())

  it('renders existing rules', () => {
    render(
      <Provider>
        <PermissionRulesEditor />
      </Provider>
    )
    expect(screen.getByLabelText('权限动作 0')).toHaveValue('shell')
    expect(screen.getByLabelText('资源 0')).toHaveValue('*')
  })

  it('adds a rule', async () => {
    render(
      <Provider>
        <PermissionRulesEditor />
      </Provider>
    )
    await userEvent.click(screen.getByRole('button', { name: '添加规则' }))
    expect(useConfigStore.getState().draft.permissions).toHaveLength(2)
  })

  it('removes a rule', async () => {
    render(
      <Provider>
        <PermissionRulesEditor />
      </Provider>
    )
    await userEvent.click(screen.getByRole('button', { name: '删除规则 0' }))
    expect(useConfigStore.getState().draft.permissions).toHaveLength(0)
  })

  it('moves a rule down', async () => {
    useConfigStore.getState().loadConfig({
      permissions: [
        { action: 'read', resource: '*', effect: 'allow' },
        { action: 'edit', resource: '*', effect: 'ask' }
      ]
    })
    render(
      <Provider>
        <PermissionRulesEditor />
      </Provider>
    )
    await userEvent.click(screen.getByRole('button', { name: '下移规则 0' }))
    const actions = useConfigStore.getState().draft.permissions as { action: string }[]
    expect(actions.map((r) => r.action)).toEqual(['edit', 'read'])
  })

  it('shows empty state when no rules', () => {
    useConfigStore.getState().loadConfig({})
    render(
      <Provider>
        <PermissionRulesEditor />
      </Provider>
    )
    expect(screen.getByText('未配置权限规则')).toBeInTheDocument()
  })
})
