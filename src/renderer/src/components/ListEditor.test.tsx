import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from './ui/provider'
import { useConfigStore } from '../store/configStore'
import { ListEditor } from './ListEditor'
import { pickMenu } from '../test/menu'

function wrap(ui: React.ReactElement): ReturnType<typeof render> {
  return render(<Provider>{ui}</Provider>)
}

describe('ListEditor', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({ provider: { alpha: { name: 'Alpha' } } }))
  afterEach(() => cleanup())

  it('does not overwrite an existing key', async () => {
    wrap(
      <ListEditor path={['provider']} addLabel="添加 Provider" inputLabel="新 Provider ID">
        {() => null}
      </ListEditor>
    )
    await userEvent.click(screen.getByRole('button', { name: '添加 Provider' }))
    await userEvent.type(await screen.findByLabelText('新 Provider ID'), 'alpha')
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('同名条目已存在。')
    expect(useConfigStore.getState().draft.provider).toEqual({ alpha: { name: 'Alpha' } })
    expect(screen.getByLabelText('新 Provider ID')).toBeInTheDocument()
  })

  it('creates an entry from the dialog form', async () => {
    wrap(
      <ListEditor
        path={['provider']}
        addLabel="添加 Provider"
        inputLabel="新 Provider ID"
        createFields={[
          {
            kind: 'select',
            key: 'kind',
            label: '类型',
            options: ['a', 'b'],
            defaultValue: 'a',
            required: true
          },
          { kind: 'text', key: 'url', label: '地址', when: { field: 'kind', equals: 'b' } }
        ]}
      >
        {() => null}
      </ListEditor>
    )
    await userEvent.click(screen.getByRole('button', { name: '添加 Provider' }))
    await userEvent.type(await screen.findByLabelText('新 Provider ID'), 'beta')
    await pickMenu('类型', 'b')
    await userEvent.type(screen.getByLabelText('地址'), 'https://x')
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(useConfigStore.getState().draft.provider).toEqual({
      alpha: { name: 'Alpha' },
      beta: { kind: 'b', url: 'https://x' }
    })
  })

  it('blocks save when a required field is empty', async () => {
    wrap(
      <ListEditor
        path={['provider']}
        addLabel="添加 Provider"
        inputLabel="新 Provider ID"
        createFields={[{ kind: 'text', key: 'command', label: '命令', required: true }]}
      >
        {() => null}
      </ListEditor>
    )
    await userEvent.click(screen.getByRole('button', { name: '添加 Provider' }))
    await userEvent.type(await screen.findByLabelText('新 Provider ID'), 'beta')
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('「命令」为必填项。')
    expect(useConfigStore.getState().draft.provider).toEqual({ alpha: { name: 'Alpha' } })
  })
})
