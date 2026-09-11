import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Provider } from './ui/provider'
import { useConfigStore } from '../store/configStore'
import { RawJsonView } from './RawJsonView'

describe('RawJsonView', () => {
  afterEach(() => cleanup())

  it('shows the normalized draft as pretty printed JSON', () => {
    useConfigStore.getState().loadConfig({ model: 'a/b' })
    render(
      <Provider>
        <RawJsonView />
      </Provider>
    )
    expect(screen.getByText(/"model": "a\/b"/)).toBeInTheDocument()
    expect(screen.getByText('原始 JSON（只读）')).toBeInTheDocument()
  })
})
