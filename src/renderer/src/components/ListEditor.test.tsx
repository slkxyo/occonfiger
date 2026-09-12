import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from './ui/provider'
import { useConfigStore } from '../store/configStore'
import { ListEditor } from './ListEditor'

function wrap(ui: React.ReactElement): ReturnType<typeof render> {
  return render(<Provider>{ui}</Provider>)
}

describe('ListEditor', () => {
  beforeEach(() =>
    useConfigStore.getState().loadConfig({ provider: { alpha: { name: 'Alpha' }, beta: {} } })
  )
  afterEach(() => cleanup())

  it('renders one item per key', () => {
    wrap(<ListEditor path={['provider']}>{() => null}</ListEditor>)
    expect(screen.getByText('alpha')).toBeInTheDocument()
    expect(screen.getByText('beta')).toBeInTheDocument()
  })

  it('applies a custom key order', () => {
    wrap(
      <ListEditor path={['provider']} sortKeys={(keys) => [...keys].reverse()}>
        {() => null}
      </ListEditor>
    )
    const names = screen.getAllByText(/^(alpha|beta)$/).map((el) => el.textContent)
    expect(names).toEqual(['beta', 'alpha'])
  })

  it('deletes an item', async () => {
    wrap(<ListEditor path={['provider']}>{() => null}</ListEditor>)
    await userEvent.click(screen.getAllByRole('button', { name: '删除' })[0])
    expect(useConfigStore.getState().draft.provider).toEqual({ beta: {} })
  })

  it('collapses and expands an item', async () => {
    wrap(
      <ListEditor path={['provider']} collapsible defaultCollapsed>
        {(key) => <span>内容 {key}</span>}
      </ListEditor>
    )
    expect(screen.queryByText('内容 alpha')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '展开 alpha' }))
    expect(screen.getByText('内容 alpha')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '折叠 alpha' }))
    expect(screen.queryByText('内容 alpha')).not.toBeInTheDocument()
  })

  it('renders a title accessory per key', () => {
    wrap(
      <ListEditor path={['provider']} titleAccessory={(key) => <span>开关 {key}</span>}>
        {() => null}
      </ListEditor>
    )
    expect(screen.getByText('开关 alpha')).toBeInTheDocument()
    expect(screen.getByText('开关 beta')).toBeInTheDocument()
  })
})
