import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from '../components/ui/provider'
import { useConfigStore } from '../store/configStore'
import { SkillsPage } from './SkillsPage'

describe('SkillsPage', () => {
  it('renders skills and instructions', () => {
    useConfigStore.getState().loadConfig({})
    render(
      <Provider>
        <SkillsPage />
      </Provider>
    )
    expect(screen.getByLabelText('技能路径')).toBeInTheDocument()
    expect(screen.getByLabelText('技能 URL')).toBeInTheDocument()
    expect(screen.getByLabelText('指令文件')).toBeInTheDocument()
  })
})
