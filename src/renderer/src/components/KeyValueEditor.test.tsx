import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from './ui/provider'
import { useConfigStore } from '../store/configStore'
import { KeyValueEditor } from './KeyValueEditor'

function wrap(ui: React.ReactElement): ReturnType<typeof render> {
  return render(<Provider>{ui}</Provider>)
}

describe('KeyValueEditor', () => {
  afterEach(() => cleanup())

  beforeEach(() =>
    useConfigStore.getState().loadConfig({ mcp: { s: { environment: { FOO: 'bar' } } } })
  )

  it('renders existing entries', () => {
    wrap(<KeyValueEditor path={['mcp', 's', 'environment']} label="环境变量" valueLabel="值" />)
    expect(screen.getByLabelText('环境变量 键 FOO')).toHaveValue('FOO')
    expect(screen.getByLabelText('环境变量 值 FOO')).toHaveValue('bar')
  })

  it('updates a value', async () => {
    wrap(<KeyValueEditor path={['mcp', 's', 'environment']} label="环境变量" valueLabel="值" />)
    const input = screen.getByLabelText('环境变量 值 FOO')
    await userEvent.clear(input)
    await userEvent.type(input, 'baz')
    expect(useConfigStore.getState().draft.mcp).toEqual({
      s: { environment: { FOO: 'baz' } }
    })
  })

  it('adds a new entry', async () => {
    wrap(<KeyValueEditor path={['mcp', 's', 'environment']} label="环境变量" valueLabel="值" />)
    await userEvent.type(screen.getByLabelText('环境变量 新键'), 'BAR')
    await userEvent.type(screen.getByLabelText('环境变量 新值'), 'qux')
    await userEvent.click(screen.getByRole('button', { name: '添加环境变量' }))
    expect(useConfigStore.getState().draft.mcp).toEqual({
      s: { environment: { FOO: 'bar', BAR: 'qux' } }
    })
  })

  it('removes an entry', async () => {
    wrap(<KeyValueEditor path={['mcp', 's', 'environment']} label="环境变量" valueLabel="值" />)
    await userEvent.click(screen.getByRole('button', { name: '删除 环境变量 FOO' }))
    expect(useConfigStore.getState().draft.mcp).toEqual({ s: { environment: {} } })
  })

  it('renames a key', async () => {
    wrap(<KeyValueEditor path={['mcp', 's', 'environment']} label="环境变量" valueLabel="值" />)
    const input = screen.getByLabelText('环境变量 键 FOO')
    await userEvent.clear(input)
    await userEvent.type(input, 'BAR')
    await userEvent.tab()
    expect(useConfigStore.getState().draft.mcp).toEqual({
      s: { environment: { BAR: 'bar' } }
    })
  })

  it('renders boolean entries as switches and toggles them', async () => {
    useConfigStore.getState().loadConfig({ tools: { read: true, write: false } })
    wrap(<KeyValueEditor path={['tools']} label="工具" valueKind="boolean" />)
    const read = screen.getByRole('checkbox', { name: '工具 值 read' })
    expect(read).toBeChecked()
    await userEvent.click(read)
    expect(useConfigStore.getState().draft.tools).toEqual({ read: false, write: false })
  })

  it('adds a boolean entry', async () => {
    useConfigStore.getState().loadConfig({ tools: {} })
    wrap(<KeyValueEditor path={['tools']} label="工具" valueKind="boolean" />)
    await userEvent.type(screen.getByLabelText('工具 新键'), 'edit')
    await userEvent.click(screen.getByRole('checkbox', { name: '工具 新值' }))
    await userEvent.click(screen.getByRole('button', { name: '添加工具' }))
    expect(useConfigStore.getState().draft.tools).toEqual({ edit: true })
  })
})
