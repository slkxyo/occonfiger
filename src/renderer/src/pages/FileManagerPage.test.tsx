import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { FileManagerPage } from './FileManagerPage'

type ApiStub = {
  listManagedFiles: Mock
  createManagedFile: Mock
  renameManagedFile: Mock
  deleteManagedFile: Mock
  openManagedFile: Mock
}

function stubApi(): ApiStub {
  const api = {
    listManagedFiles: vi
      .fn()
      .mockResolvedValue([{ name: 'reviewer.md', path: '/cfg/agent/reviewer.md' }]),
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
})
