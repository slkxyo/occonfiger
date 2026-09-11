import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from './ui/provider'
import { useConfigStore } from '../store/configStore'
import { ListEditor } from './ListEditor'

function wrap(ui: React.ReactElement): ReturnType<typeof render> {
  return render(<Provider>{ui}</Provider>)
}

describe('ListEditor', () => {
  beforeEach(() =>
    useConfigStore.getState().loadConfig({ provider: { alpha: { name: 'Alpha' } } })
  )

  it('does not overwrite an existing key', async () => {
    wrap(
      <ListEditor path={['provider']} addLabel="添加 Provider" inputLabel="新 Provider ID">
        {() => null}
      </ListEditor>
    )
    await userEvent.type(screen.getByLabelText('新 Provider ID'), 'alpha')
    await userEvent.click(screen.getByRole('button', { name: '添加 Provider' }))
    expect(useConfigStore.getState().draft.provider).toEqual({ alpha: { name: 'Alpha' } })
  })
})
