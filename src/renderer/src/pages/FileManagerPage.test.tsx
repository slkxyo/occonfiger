import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { FileManagerPage } from './FileManagerPage'

type ManagedFile = { name: string; path: string }

type ApiStub = {
  listManagedFiles: Mock
  createManagedFile: Mock
  renameManagedFile: Mock
  deleteManagedFile: Mock
  openManagedFile: Mock
}

const FILES: Record<string, ManagedFile[]> = {
  agent: [{ name: 'reviewer.md', path: '/cfg/agent/reviewer.md' }],
  command: [{ name: 'deploy.md', path: '/cfg/command/deploy.md' }],
  skill: [{ name: 'my-skill', path: '/cfg/skill/my-skill' }]
}

function stubApi(files: Record<string, ManagedFile[]> = FILES): ApiStub {
  const api = {
    listManagedFiles: vi
      .fn()
      .mockImplementation((kind: string) => Promise.resolve(files[kind] ?? [])),
    createManagedFile: vi.fn().mockResolvedValue('/cfg/agent/new.md'),
    renameManagedFile: vi.fn().mockResolvedValue(null),
    deleteManagedFile: vi.fn().mockResolvedValue(null),
    openManagedFile: vi.fn().mockResolvedValue(null)
  }
  vi.stubGlobal('api', api)
  return api
}

describe('FileManagerPage', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('lists agent files', async () => {
    stubApi()
    render(
      <Provider>
        <FileManagerPage />
      </Provider>
    )
    expect(await screen.findByText('reviewer.md')).toBeInTheDocument()
  })

  it('creates a file', async () => {
    const api = stubApi()
    render(
      <Provider>
        <FileManagerPage />
      </Provider>
    )
    await userEvent.type(await screen.findByLabelText('新建名称'), 'deploy')
    await userEvent.click(screen.getByRole('button', { name: '新建' }))
    expect(api.createManagedFile).toHaveBeenCalledWith('agent', 'deploy')
  })

  it('opens a file with the system editor', async () => {
    const api = stubApi()
    render(
      <Provider>
        <FileManagerPage />
      </Provider>
    )
    await userEvent.click(await screen.findByRole('button', { name: '打开 reviewer.md' }))
    expect(api.openManagedFile).toHaveBeenCalledWith('agent', 'reviewer.md')
  })

  it('lists command and skill files when switching tabs', async () => {
    const api = stubApi()
    render(
      <Provider>
        <FileManagerPage />
      </Provider>
    )
    expect(await screen.findByText('reviewer.md')).toBeInTheDocument()
    expect(api.listManagedFiles).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('tab', { name: 'Commands' }))
    expect(await screen.findByText('deploy.md')).toBeInTheDocument()
    expect(api.listManagedFiles).toHaveBeenLastCalledWith('command')
    await waitFor(() => expect(screen.queryByText('reviewer.md')).not.toBeInTheDocument())

    await userEvent.click(screen.getByRole('tab', { name: 'Skills' }))
    expect(await screen.findByText('my-skill')).toBeInTheDocument()
    expect(api.listManagedFiles).toHaveBeenLastCalledWith('skill')
    await waitFor(() => expect(screen.queryByText('deploy.md')).not.toBeInTheDocument())
  })

  it('shows empty state when the directory has no files', async () => {
    stubApi({ agent: [], command: [], skill: [] })
    render(
      <Provider>
        <FileManagerPage />
      </Provider>
    )
    expect(await screen.findByText('该目录下暂无文件。')).toBeInTheDocument()
  })
})
