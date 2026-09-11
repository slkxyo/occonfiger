import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { GeneralPage } from './GeneralPage'

describe('GeneralPage', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({ autoupdate: 'notify' }))

  it('renders the general fields with current values', () => {
    render(
      <Provider>
        <GeneralPage />
      </Provider>
    )
    expect(screen.getByLabelText('Shell')).toBeInTheDocument()
    expect(screen.getByLabelText('用户名')).toBeInTheDocument()
    expect(screen.getByLabelText('日志级别')).toBeInTheDocument()
    expect(screen.getByLabelText('自动更新')).toBeInTheDocument()
  })
})
