import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { AdvancedPage } from './AdvancedPage'

describe('AdvancedPage', () => {
  it('renders advanced sections', () => {
    useConfigStore.getState().loadConfig({})
    render(
      <Provider>
        <AdvancedPage />
      </Provider>
    )
    expect(screen.getByText('服务')).toBeInTheDocument()
    expect(screen.getByText('压缩')).toBeInTheDocument()
    expect(screen.getByText('实验性')).toBeInTheDocument()
  })
})
