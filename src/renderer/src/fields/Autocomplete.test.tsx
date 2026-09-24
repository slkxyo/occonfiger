import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from '../components/app/provider'
import { Autocomplete } from './Autocomplete'

const OPTIONS = ['read', 'edit', 'write', 'shell', 'webfetch']

function renderAutocomplete(
  initial = '',
  options = OPTIONS
): { onChange: ReturnType<typeof vi.fn> } & ReturnType<typeof render> {
  const onChange = vi.fn()
  function Harness(): React.JSX.Element {
    const [value, setValue] = useState(initial)
    return (
      <Autocomplete
        ariaLabel="动作"
        options={options}
        value={value}
        onChange={(v) => {
          onChange(v)
          setValue(v)
        }}
      />
    )
  }
  return {
    onChange,
    ...render(
      <Provider>
        <Harness />
      </Provider>
    )
  }
}

describe('Autocomplete', () => {
  afterEach(() => cleanup())

  it('shows suggestions on focus and filters by input', async () => {
    renderAutocomplete()
    const input = screen.getByRole('textbox', { name: '动作' })
    await userEvent.click(input)
    expect(await screen.findByRole('option', { name: 'read' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'shell' })).toBeInTheDocument()
    await userEvent.type(input, 'sh')
    expect(screen.queryByRole('option', { name: 'read' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'shell' })).toBeInTheDocument()
  })

  it('picks an option by click', async () => {
    const { onChange } = renderAutocomplete()
    await userEvent.click(screen.getByRole('textbox', { name: '动作' }))
    await userEvent.click(await screen.findByRole('option', { name: 'edit' }))
    expect(onChange).toHaveBeenCalledWith('edit')
  })

  it('selects with ArrowDown + Enter', async () => {
    const { onChange } = renderAutocomplete()
    const input = screen.getByRole('textbox', { name: '动作' })
    await userEvent.click(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('edit')
  })

  it('closes the panel on Escape', async () => {
    renderAutocomplete()
    const input = screen.getByRole('textbox', { name: '动作' })
    await userEvent.click(input)
    expect(await screen.findByRole('option', { name: 'read' })).toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('option', { name: 'read' })).not.toBeInTheDocument()
  })

  it('allows free input not present in options', async () => {
    const { onChange } = renderAutocomplete()
    await userEvent.type(screen.getByRole('textbox', { name: '动作' }), 'custom_tool')
    expect(onChange).toHaveBeenLastCalledWith('custom_tool')
  })

  it('does not select on Enter during IME composition', async () => {
    const { onChange } = renderAutocomplete()
    const input = screen.getByRole('textbox', { name: '动作' })
    await userEvent.click(input)
    const composing = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    Object.defineProperty(composing, 'isComposing', { value: true })
    fireEvent(input, composing)
    expect(onChange).not.toHaveBeenCalledWith('read')
  })
})
