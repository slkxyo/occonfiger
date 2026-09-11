import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from './components/ui/provider'
import { App } from './App'

const api = {
  readConfig: vi.fn().mockResolvedValue({ model: 'anthropic/claude' }),
  getConfigPath: vi.fn().mockResolvedValue('/home/u/.config/opencode/opencode.jsonc'),
  saveConfig: vi.fn(),
  getRawContent: vi.fn()
}

describe('App', () => {
  it('shows the config path and nav', async () => {
    vi.stubGlobal('api', api)
    render(
      <Provider>
        <App />
      </Provider>
    )
    expect(await screen.findByText('/home/u/.config/opencode/opencode.jsonc')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '常规' })).toBeInTheDocument()
  })
})
