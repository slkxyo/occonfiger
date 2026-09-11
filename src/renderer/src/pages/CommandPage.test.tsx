import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { CommandPage } from './CommandPage'

describe('CommandPage', () => {
  it('renders command fields', () => {
    useConfigStore.getState().loadConfig({ command: { deploy: { template: 'run' } } })
    render(
      <Provider>
        <CommandPage />
      </Provider>
    )
    expect(screen.getByLabelText('模板')).toBeInTheDocument()
    expect(screen.getByLabelText('描述')).toBeInTheDocument()
  })
})
