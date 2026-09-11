import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { AgentsPage } from './AgentsPage'

const api = {
  readAgents: vi.fn().mockResolvedValue('# 全局提示词'),
  writeAgents: vi.fn().mockResolvedValue(null)
}

describe('AgentsPage', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('loads and shows the current prompt', async () => {
    vi.stubGlobal('api', api)
    render(
      <Provider>
        <AgentsPage />
      </Provider>
    )
    expect(await screen.findByDisplayValue('# 全局提示词')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
  })

  it('saves edited content and reports success', async () => {
    vi.stubGlobal('api', api)
    render(
      <Provider>
        <AgentsPage />
      </Provider>
    )
    const box = await screen.findByLabelText('全局提示词内容')
    await userEvent.clear(box)
    await userEvent.type(box, '新的提示词')
    const save = screen.getByRole('button', { name: '保存' })
    expect(save).toBeEnabled()
    await userEvent.click(save)
    expect(api.writeAgents).toHaveBeenCalledWith('新的提示词')
    expect(await screen.findByText('已保存')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
  })

  it('saves with the keyboard shortcut', async () => {
    vi.stubGlobal('api', api)
    render(
      <Provider>
        <AgentsPage />
      </Provider>
    )
    const box = await screen.findByLabelText('全局提示词内容')
    await userEvent.clear(box)
    await userEvent.type(box, '快捷键')
    await userEvent.keyboard('{Meta>}s{/Meta}')
    expect(api.writeAgents).toHaveBeenCalledWith('快捷键')
  })

  it('shows an error when saving fails', async () => {
    vi.stubGlobal('api', {
      ...api,
      writeAgents: vi.fn().mockRejectedValue(new Error('磁盘只读'))
    })
    render(
      <Provider>
        <AgentsPage />
      </Provider>
    )
    const box = await screen.findByLabelText('全局提示词内容')
    await userEvent.clear(box)
    await userEvent.type(box, 'x')
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('磁盘只读')
  })
})
