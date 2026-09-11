import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { BoolOrObjectField, PluginField, TextField, TagsField, SwitchField } from './controls'

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

  it('PluginField keeps non-string items when adding a string', async () => {
    useConfigStore.getState().loadConfig({ plugin: ['a', ['pkg', { opt: 1 }]] })
    wrap(<PluginField path={['plugin']} label="插件列表" />)
    await userEvent.type(screen.getByLabelText('插件列表'), 'b{enter}')
    expect(useConfigStore.getState().draft.plugin).toEqual(['a', ['pkg', { opt: 1 }], 'b'])
  })

  it('PluginField removes a non-string item', async () => {
    useConfigStore.getState().loadConfig({ plugin: ['a', ['pkg', { opt: 1 }]] })
    wrap(<PluginField path={['plugin']} label="插件列表" />)
    await userEvent.click(screen.getByRole('button', { name: '删除 ["pkg",{"opt":1}]' }))
    expect(useConfigStore.getState().draft.plugin).toEqual(['a'])
  })

  it('BoolOrObjectField disables the switch for object values', () => {
    useConfigStore.getState().loadConfig({ formatter: { prettier: {} } })
    wrap(<BoolOrObjectField path={['formatter']} label="启用格式化" />)
    expect(screen.queryByRole('checkbox', { name: '启用格式化' })).not.toBeInTheDocument()
    expect(screen.getByText('当前为对象配置，暂不支持可视化编辑')).toBeInTheDocument()
    expect(useConfigStore.getState().draft.formatter).toEqual({ prettier: {} })
  })

  it('BoolOrObjectField converts object to boolean after confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    useConfigStore.getState().loadConfig({ formatter: { prettier: {} } })
    wrap(<BoolOrObjectField path={['formatter']} label="启用格式化" />)
    await userEvent.click(screen.getByRole('button', { name: '转为启用（布尔）' }))
    expect(useConfigStore.getState().draft.formatter).toBe(true)
    confirmSpy.mockRestore()
  })

  it('BoolOrObjectField toggles boolean normally', async () => {
    wrap(<BoolOrObjectField path={['formatter']} label="启用格式化" />)
    await userEvent.click(screen.getByRole('checkbox', { name: '启用格式化' }))
    expect(useConfigStore.getState().draft.formatter).toBe(true)
  })
})
