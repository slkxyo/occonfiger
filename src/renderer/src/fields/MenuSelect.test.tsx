import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/app/provider'
import { MenuSelect } from './MenuSelect'

function wrap(ui: React.ReactElement): ReturnType<typeof render> {
  return render(<Provider>{ui}</Provider>)
}

describe('MenuSelect', () => {
  afterEach(() => cleanup())

  it('shows the placeholder when the value is empty', () => {
    wrap(
      <MenuSelect
        ariaLabel="效果"
        options={['allow', 'ask', 'deny']}
        value=""
        onChange={() => {}}
      />
    )
    expect(screen.getByRole('combobox', { name: '效果' })).toHaveTextContent('（未设置）')
  })

  it('selects an option', async () => {
    const onChange = vi.fn()
    wrap(
      <MenuSelect
        ariaLabel="效果"
        options={['allow', 'ask', 'deny']}
        value="ask"
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('combobox', { name: '效果' }))
    await userEvent.click(await screen.findByRole('option', { name: 'deny' }))
    expect(onChange).toHaveBeenCalledWith('deny')
  })

  it('offers an unset option when allowEmpty is enabled', async () => {
    const onChange = vi.fn()
    wrap(
      <MenuSelect
        ariaLabel="效果"
        options={['allow', 'ask', 'deny']}
        value="ask"
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('combobox', { name: '效果' }))
    await userEvent.click(await screen.findByRole('option', { name: '（未设置）' }))
    expect(onChange).toHaveBeenCalledWith('')
  })
})
