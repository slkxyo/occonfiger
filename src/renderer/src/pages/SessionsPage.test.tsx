import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
    messageCount: 3,
    contextSize: 0
  },
  {
    id: 'beta',
    title: 'beta 会话',
    directory: '/tmp/project-b',
    timeCreated: 1_700_001_000_000,
    timeUpdated: 1_700_001_600_000,
    timeArchived: 1_700_001_700_000,
    messageCount: 7,
    contextSize: 99315
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
    expect(screen.getByText('上下文 99.3k')).toBeInTheDocument()
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

  it('opens rename dialog and saves a new title', async () => {
    const renameSession = vi.fn().mockResolvedValue(null)
    stubApi({ renameSession })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('alpha 会话')
    await userEvent.click(screen.getByRole('button', { name: '重命名 alpha 会话' }))
    const dialog = await screen.findByRole('dialog', { name: '重命名会话' })
    const input = within(dialog).getByRole('textbox', { name: '会话标题' })
    await userEvent.clear(input)
    await userEvent.type(input, '新标题')
    await userEvent.click(within(dialog).getByRole('button', { name: '保存' }))
    await waitFor(() => expect(renameSession).toHaveBeenCalledWith('alpha', '新标题'))
  })

  it('saves rename on Enter in the dialog', async () => {
    const renameSession = vi.fn().mockResolvedValue(null)
    stubApi({ renameSession })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('alpha 会话')
    await userEvent.click(screen.getByRole('button', { name: '重命名 alpha 会话' }))
    const dialog = await screen.findByRole('dialog', { name: '重命名会话' })
    const input = within(dialog).getByRole('textbox', { name: '会话标题' })
    await userEvent.clear(input)
    await userEvent.type(input, '回车保存{Enter}')
    await waitFor(() => expect(renameSession).toHaveBeenCalledWith('alpha', '回车保存'))
  })

  it('does not save rename on Enter while an IME composition is active', async () => {
    const renameSession = vi.fn().mockResolvedValue(null)
    stubApi({ renameSession })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('alpha 会话')
    await userEvent.click(screen.getByRole('button', { name: '重命名 alpha 会话' }))
    const dialog = await screen.findByRole('dialog', { name: '重命名会话' })
    const input = within(dialog).getByRole('textbox', { name: '会话标题' })
    await userEvent.clear(input)
    await userEvent.type(input, '组合中')
    const composing = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    Object.defineProperty(composing, 'isComposing', { value: true })
    fireEvent(input, composing)
    expect(renameSession).not.toHaveBeenCalled()
  })

  it('cancels a rename via the cancel button', async () => {
    const renameSession = vi.fn().mockResolvedValue(null)
    stubApi({ renameSession })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('alpha 会话')
    await userEvent.click(screen.getByRole('button', { name: '重命名 alpha 会话' }))
    const dialog = await screen.findByRole('dialog', { name: '重命名会话' })
    await userEvent.type(within(dialog).getByRole('textbox', { name: '会话标题' }), '不应保存')
    await userEvent.click(within(dialog).getByRole('button', { name: '取消' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '重命名会话' })).not.toBeInTheDocument()
    )
    expect(renameSession).not.toHaveBeenCalled()
  })

  it('does not save when the rename title is cleared', async () => {
    const renameSession = vi.fn().mockResolvedValue(null)
    stubApi({ renameSession })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('alpha 会话')
    await userEvent.click(screen.getByRole('button', { name: '重命名 alpha 会话' }))
    const dialog = await screen.findByRole('dialog', { name: '重命名会话' })
    const input = within(dialog).getByRole('textbox', { name: '会话标题' })
    await userEvent.clear(input)
    await userEvent.click(within(dialog).getByRole('button', { name: '保存' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '重命名会话' })).not.toBeInTheDocument()
    )
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
          messageCount: 0,
          contextSize: 0
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

  it('deletes a session after confirmation in the alert dialog', async () => {
    const deleteSession = vi.fn().mockResolvedValue(null)
    stubApi({ deleteSession })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('beta 会话')
    await userEvent.click(screen.getByRole('button', { name: '删除 beta 会话' }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: '删除' }))
    await waitFor(() => expect(deleteSession).toHaveBeenCalledWith('beta'))
  })

  it('does not delete when the confirmation is cancelled', async () => {
    const deleteSession = vi.fn().mockResolvedValue(null)
    stubApi({ deleteSession })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('beta 会话')
    await userEvent.click(screen.getByRole('button', { name: '删除 beta 会话' }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: '取消' }))
    expect(deleteSession).not.toHaveBeenCalled()
  })

  it('batch-deletes selected sessions after confirmation', async () => {
    const deleteSession = vi.fn().mockResolvedValue(null)
    stubApi({ deleteSession })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('alpha 会话')
    // 进入多选模式
    await userEvent.click(screen.getByRole('button', { name: '多选' }))
    // 勾选两个会话
    await userEvent.click(screen.getByRole('checkbox', { name: '选择 alpha 会话' }))
    await userEvent.click(screen.getByRole('checkbox', { name: '选择 beta 会话' }))
    // 点批量删除
    await userEvent.click(screen.getByRole('button', { name: /删除选中/ }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: '删除' }))
    await waitFor(() => {
      expect(deleteSession).toHaveBeenCalledWith('alpha')
      expect(deleteSession).toHaveBeenCalledWith('beta')
    })
  })

  it('selects all and clears selection via the select-all toggle', async () => {
    stubApi()
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('alpha 会话')
    await userEvent.click(screen.getByRole('button', { name: '多选' }))
    // 全选
    await userEvent.click(screen.getByRole('button', { name: '全选' }))
    expect(screen.getByRole('checkbox', { name: '选择 alpha 会话' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: '选择 beta 会话' })).toBeChecked()
    // 取消全选
    await userEvent.click(screen.getByRole('button', { name: '取消全选' }))
    expect(screen.getByRole('checkbox', { name: '选择 alpha 会话' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: '选择 beta 会话' })).not.toBeChecked()
  })

  it('disables delete for a live session updated within 5 minutes', async () => {
    stubApi({
      listSessions: vi.fn().mockResolvedValue([
        {
          id: 'live',
          title: '活跃会话',
          directory: '/tmp/live',
          timeCreated: 1_700_000_000_000,
          timeUpdated: Date.now() - 60_000,
          timeArchived: null,
          messageCount: 5,
          contextSize: 0
        }
      ])
    })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('活跃会话')
    expect(screen.getByRole('button', { name: /删除 活跃会话/ })).toBeDisabled()
    expect(screen.getByText('进行中')).toBeInTheDocument()
  })

  it('disables selection for a live session in multi-select mode', async () => {
    stubApi({
      listSessions: vi.fn().mockResolvedValue([
        {
          id: 'live',
          title: '活跃会话',
          directory: '/tmp/live',
          timeCreated: 1_700_000_000_000,
          timeUpdated: Date.now() - 60_000,
          timeArchived: null,
          messageCount: 5,
          contextSize: 0
        }
      ])
    })
    render(
      <Provider>
        <SessionsPage />
      </Provider>
    )
    await screen.findByText('活跃会话')
    await userEvent.click(screen.getByRole('button', { name: '多选' }))
    expect(screen.getByRole('checkbox', { name: '选择 活跃会话' })).toBeDisabled()
    // 全选也不应选中 live 会话
    await userEvent.click(screen.getByRole('button', { name: '全选' }))
    expect(screen.getByRole('checkbox', { name: '选择 活跃会话' })).not.toBeChecked()
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
