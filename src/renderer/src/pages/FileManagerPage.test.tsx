import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { FileManagerPage } from './FileManagerPage'

function stubApi(files: { name: string; path: string }[] = [{ name: 'docker-info', path: '/x' }]): {
  listManagedFiles: ReturnType<typeof vi.fn>
  readManagedFile: ReturnType<typeof vi.fn>
  writeManagedFile: ReturnType<typeof vi.fn>
  createManagedFile: ReturnType<typeof vi.fn>
  renameManagedFile: ReturnType<typeof vi.fn>
  deleteManagedFile: ReturnType<typeof vi.fn>
  openManagedFile: ReturnType<typeof vi.fn>
} {
  const api = {
    listManagedFiles: vi.fn().mockResolvedValue(files),
    readManagedFile: vi.fn().mockResolvedValue('# SKILL 内容'),
    writeManagedFile: vi.fn().mockResolvedValue(null),
    createManagedFile: vi.fn().mockResolvedValue('/x'),
    renameManagedFile: vi.fn().mockResolvedValue(null),
    deleteManagedFile: vi.fn().mockResolvedValue(null),
    openManagedFile: vi.fn().mockResolvedValue(null)
  }
  vi.stubGlobal('api', api)
  return api
}

function renderPage(): void {
  render(
    <Provider>
      <FileManagerPage />
    </Provider>
  )
}

describe('FileManagerPage', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('lists only skills', async () => {
    const api = stubApi()
    renderPage()
    expect(await screen.findByText('docker-info')).toBeInTheDocument()
    expect(api.listManagedFiles).toHaveBeenCalledWith('skill')
  })

  it('loads content when a skill is selected', async () => {
    const api = stubApi()
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'docker-info' }))
    expect(api.readManagedFile).toHaveBeenCalledWith('skill', 'docker-info')
    expect(await screen.findByDisplayValue('# SKILL 内容')).toBeInTheDocument()
  })

  it('saves edited content', async () => {
    const api = stubApi()
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'docker-info' }))
    const box = await screen.findByLabelText('SKILL 内容')
    await userEvent.clear(box)
    await userEvent.type(box, '新内容')
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(api.writeManagedFile).toHaveBeenCalledWith('skill', 'docker-info', '新内容')
    expect(await screen.findByText('已保存')).toBeInTheDocument()
  })

  it('creates a skill', async () => {
    const api = stubApi()
    renderPage()
    await userEvent.type(await screen.findByLabelText('新建名称'), 'new-skill')
    await userEvent.click(screen.getByRole('button', { name: '新建' }))
    expect(api.createManagedFile).toHaveBeenCalledWith('skill', 'new-skill')
  })

  it('shows an empty state when there are no skills', async () => {
    stubApi([])
    renderPage()
    expect(await screen.findByText('暂无 SKILL。')).toBeInTheDocument()
  })
})
