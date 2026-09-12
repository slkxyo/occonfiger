import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { TagsField, TextField } from './controls'

function wrap(ui: React.ReactElement): ReturnType<typeof render> {
  return render(<Provider>{ui}</Provider>)
}

describe('controls', () => {
  afterEach(() => cleanup())

  beforeEach(() => useConfigStore.getState().loadConfig({}))

  it('TextField writes to the draft', async () => {
    wrap(<TextField path={['shell']} label="Shell" />)
    await userEvent.type(screen.getByLabelText('Shell'), '/bin/zsh')
    expect(useConfigStore.getState().draft.shell).toBe('/bin/zsh')
  })

  it('TagsField adds entries on Enter', async () => {
    wrap(<TagsField path={['instructions']} label="指令" />)
    await userEvent.type(screen.getByLabelText('指令'), 'AGENTS.md{enter}')
    expect(useConfigStore.getState().draft.instructions).toEqual(['AGENTS.md'])
  })

  it('TagsField removes an entry', async () => {
    useConfigStore.getState().loadConfig({ instructions: ['a', 'b'] })
    wrap(<TagsField path={['instructions']} label="指令" />)
    await userEvent.click(screen.getByRole('button', { name: '删除 a' }))
    expect(useConfigStore.getState().draft.instructions).toEqual(['b'])
  })
})
