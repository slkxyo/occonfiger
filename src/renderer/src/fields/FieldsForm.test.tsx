import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { FieldsForm } from './FieldsForm'

describe('FieldsForm', () => {
  beforeEach(() => useConfigStore.getState().loadConfig({}))

  it('renders every spec kind', () => {
    render(
      <Provider>
        <FieldsForm
          specs={[
            { kind: 'text', path: ['shell'], label: 'Shell' },
            { kind: 'switch', path: ['snapshot'], label: '快照' },
            { kind: 'select', path: ['logLevel'], label: '日志', options: ['DEBUG', 'INFO'] },
            { kind: 'number', path: ['subagent_depth'], label: '深度' },
            { kind: 'tags', path: ['instructions'], label: '指令' }
          ]}
        />
      </Provider>
    )
    expect(screen.getByLabelText('Shell')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '快照' })).toBeInTheDocument()
    expect(screen.getByLabelText('日志')).toBeInTheDocument()
    expect(screen.getByLabelText('深度')).toBeInTheDocument()
    expect(screen.getByLabelText('指令')).toBeInTheDocument()
  })
})
