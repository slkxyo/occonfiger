import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { getAt } from '../fields/path'
import { AgentPage } from './AgentPage'

function renderPage(): void {
  render(
    <Provider>
      <AgentPage />
    </Provider>
  )
}

describe('AgentPage', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))
  afterEach(() => cleanup())

  it('renders agent fields after adding an agent', () => {
    useConfigStore.getState().setField(['agent', 'reviewer'], {})
    renderPage()
    expect(screen.getByLabelText('模式')).toBeInTheDocument()
    expect(screen.getByLabelText('描述')).toBeInTheDocument()
  })

  it('renders variant and color fields', () => {
    useConfigStore.getState().setField(['agent', 'reviewer'], {})
    renderPage()
    expect(screen.getByLabelText('模型变体')).toBeInTheDocument()
    expect(screen.getByLabelText('颜色')).toBeInTheDocument()
  })

  it('edits an agent permission', async () => {
    useConfigStore.getState().setField(['agent', 'reviewer'], {})
    renderPage()
    await userEvent.selectOptions(screen.getByLabelText('edit'), 'deny')
    expect(
      getAt(useConfigStore.getState().draft, ['agent', 'reviewer', 'permission', 'edit'])
    ).toBe('deny')
  })
})
