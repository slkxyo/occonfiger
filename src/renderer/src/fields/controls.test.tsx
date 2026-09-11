import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { TextField, TagsField, SwitchField } from './controls'

function wrap(ui: React.ReactElement): ReturnType<typeof render> {
  return render(<Provider>{ui}</Provider>)
}

describe('controls', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))

  it('TextField writes to the draft', async () => {
    wrap(<TextField path={['shell']} label="Shell" />)
    await userEvent.type(screen.getByLabelText('Shell'), '/bin/zsh')
    expect(useConfigStore.getState().draft.shell).toBe('/bin/zsh')
  })

  it('SwitchField toggles boolean', async () => {
    wrap(<SwitchField path={['snapshot']} label="快照" />)
    await userEvent.click(screen.getByRole('checkbox', { name: '快照' }))
    expect(useConfigStore.getState().draft.snapshot).toBe(true)
  })

  it('TagsField adds entries on Enter', async () => {
    wrap(<TagsField path={['instructions']} label="指令" />)
    await userEvent.type(screen.getByLabelText('指令'), 'AGENTS.md{enter}')
    expect(useConfigStore.getState().draft.instructions).toEqual(['AGENTS.md'])
  })
})
