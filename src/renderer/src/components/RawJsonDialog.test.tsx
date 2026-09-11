import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from './ui/provider'
import { useConfigStore } from '../store/configStore'
import { RawJsonDialog } from './RawJsonDialog'

describe('RawJsonDialog', () => {
  it('shows pretty printed draft', () => {
    useConfigStore.getState().loadConfig({ model: 'a/b' })
    render(
      <Provider>
        <RawJsonDialog open onClose={() => {}} />
      </Provider>
    )
    expect(screen.getByText(/"model": "a\/b"/)).toBeInTheDocument()
  })

  it('renders provided content verbatim', () => {
    render(
      <Provider>
        <RawJsonDialog open onClose={() => {}} content={'{"model":"a/b"}'} />
      </Provider>
    )
    expect(screen.getByText('{"model":"a/b"}')).toBeInTheDocument()
  })
})
