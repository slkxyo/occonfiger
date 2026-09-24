import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/app/provider'
import { SessionsPage } from './SessionsPage'
import type { SessionSummary } from '../../../shared/session-types'

const SESSIONS: SessionSummary[] = [
  {
    id: 'alpha',
    title: 'alpha 会话',
    directory: '/tmp/project-a',
    timeCreated: 1_700_000_000_000,
    timeUpdated: 1_700_000_600_000,
    timeArchived: null,
    messageCount: 3
  },
  {
    id: 'beta',
    title: 'beta 会话',
    directory: '/tmp/project-b',
    timeCreated: 1_700_001_000_000,
    timeUpdated: 1_700_001_600_000,
    timeArchived: 1_700_001_700_000,
    messageCount: 7
  }
]

function stubApi(overrides: Record<string, unknown> = {}): void {
  vi.stubGlobal('api', {
    listSessions: vi.fn().mockResolvedValue(SESSIONS),
    renameSession: vi.fn().mockResolvedValue(null),
    deleteSession: vi.fn().mockResolvedValue(null),
    ...overrides
  })
}

describe('SessionsPage', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('lists sessions with summary info and archive badge', async () => {
    stubApi()
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    expect(await screen.findByText('alpha 会话')).toBeInTheDocument()
    expect(screen.getByText('beta 会话')).toBeInTheDocument()
    expect(screen.getByText('/tmp/project-a')).toBeInTheDocument()
    expect(screen.getByText('7 条消息')).toBeInTheDocument()
    expect(screen.getByText('已归档')).toBeInTheDocument()
  })

  it('filters sessions by title', async () => {
    stubApi()
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('alpha 会话')
    await userEvent.type(screen.getByRole('textbox', { name: '搜索会话' }), 'beta')
    expect(screen.queryByText('alpha 会话')).not.toBeInTheDocument()
    expect(screen.getByText('beta 会话')).toBeInTheDocument()
  })

  it('saves an inline rename on Enter', async () => {
    const renameSession = vi.fn().mockResolvedValue(null)
    stubApi({ renameSession })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('alpha 会话')
    await userEvent.click(screen.getByRole('button', { name: '重命名 alpha 会话' }))
    const input = screen.getByRole('textbox', { name: '编辑会话标题' })
    await userEvent.clear(input)
    await userEvent.type(input, '新标题{Enter}')
    await waitFor(() => expect(renameSession).toHaveBeenCalledWith('alpha', '新标题'))
  })

  it('cancels an inline rename on Escape', async () => {
    const renameSession = vi.fn().mockResolvedValue(null)
    stubApi({ renameSession })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('alpha 会话')
    await userEvent.click(screen.getByRole('button', { name: '重命名 alpha 会话' }))
    const input = screen.getByRole('textbox', { name: '编辑会话标题' })
    await userEvent.clear(input)
    await userEvent.type(input, '不应保存{Escape}')
    await waitFor(() => expect(screen.getByText('alpha 会话')).toBeInTheDocument())
    expect(renameSession).not.toHaveBeenCalled()
  })

  it('does not save on Enter while an IME composition is active', async () => {
    const renameSession = vi.fn().mockResolvedValue(null)
    stubApi({ renameSession })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('alpha 会话')
    await userEvent.click(screen.getByRole('button', { name: '重命名 alpha 会话' }))
    const input = screen.getByRole('textbox', { name: '编辑会话标题' })
    await userEvent.clear(input)
    await userEvent.type(input, '组合中')
    const composing = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    Object.defineProperty(composing, 'isComposing', { value: true })
    fireEvent(input, composing)
    expect(screen.getByRole('textbox', { name: '编辑会话标题' })).toBeInTheDocument()
    expect(renameSession).not.toHaveBeenCalled()
  })

  it('cancels an inline rename when the title is cleared', async () => {
    const renameSession = vi.fn().mockResolvedValue(null)
    stubApi({ renameSession })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('alpha 会话')
    await userEvent.click(screen.getByRole('button', { name: '重命名 alpha 会话' }))
    await userEvent.clear(screen.getByRole('textbox', { name: '编辑会话标题' }))
    await userEvent.type(screen.getByRole('textbox', { name: '编辑会话标题' }), '{Enter}')
    await waitFor(() => expect(screen.getByText('alpha 会话')).toBeInTheDocument())
    expect(renameSession).not.toHaveBeenCalled()
  })

  it('finds untitled sessions when searching the displayed placeholder', async () => {
    stubApi({
      listSessions: vi.fn().mockResolvedValue([
        {
          id: 'untitled',
          title: null,
          directory: '/tmp/untitled',
          timeCreated: 1_700_000_000_000,
          timeUpdated: 1_700_000_000_000,
          timeArchived: null,
          messageCount: 0
        }
      ])
    })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('未命名会话')
    await userEvent.type(screen.getByRole('textbox', { name: '搜索会话' }), '未命名')
    expect(screen.getByText('未命名会话')).toBeInTheDocument()
  })

  it('deletes a session after confirmation', async () => {
    const deleteSession = vi.fn().mockResolvedValue(null)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    stubApi({ deleteSession })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('beta 会话')
    await userEvent.click(screen.getByRole('button', { name: '删除 beta 会话' }))
    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => expect(deleteSession).toHaveBeenCalledWith('beta'))
  })

  it('does not delete when confirmation is cancelled', async () => {
    const deleteSession = vi.fn().mockResolvedValue(null)
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    stubApi({ deleteSession })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('beta 会话')
    await userEvent.click(screen.getByRole('button', { name: '删除 beta 会话' }))
    expect(deleteSession).not.toHaveBeenCalled()
  })

  it('shows an error when loading fails', async () => {
    stubApi({ listSessions: vi.fn().mockRejectedValue(new Error('数据库被占用')) })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('数据库被占用')
  })
})
