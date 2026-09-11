import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { AgentPage } from './AgentPage'

describe('AgentPage', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))

  it('renders agent fields after adding an agent', () => {
    useConfigStore.getState().setField(['agent', 'reviewer'], {})
    render(
      <Provider>
        <AgentPage />
      </Provider>
    )
    expect(screen.getByLabelText('模式')).toBeInTheDocument()
    expect(screen.getByLabelText('描述')).toBeInTheDocument()
  })
})
