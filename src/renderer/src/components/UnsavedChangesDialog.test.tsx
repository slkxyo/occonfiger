import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from './ui/provider'
import { UnsavedChangesDialog } from './UnsavedChangesDialog'

describe('UnsavedChangesDialog', () => {
  it('renders nothing when closed', () => {
    render(
      <Provider>
        <UnsavedChangesDialog
          open={false}
          onSave={() => {}}
          onDiscard={() => {}}
          onCancel={() => {}}
        />
      </Provider>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('fires the save, discard and cancel actions', async () => {
    const onSave = vi.fn()
    const onDiscard = vi.fn()
    const onCancel = vi.fn()
    render(
      <Provider>
        <UnsavedChangesDialog open onSave={onSave} onDiscard={onDiscard} onCancel={onCancel} />
      </Provider>
    )
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    await userEvent.click(screen.getByRole('button', { name: '不保存' }))
    await userEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onDiscard).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
