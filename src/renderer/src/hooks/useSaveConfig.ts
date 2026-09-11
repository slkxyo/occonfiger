import { useState } from 'react'
import { useConfigStore } from '../store/configStore'
import { normalizeDraft } from '../store/normalize'

export function useSaveConfig(): {
  save: () => Promise<{ saved: boolean; errors: string[] }>
  status: string
} {
  const [status, setStatus] = useState('')
  const save = async (): Promise<{ saved: boolean; errors: string[] }> => {
    const { draft, markSaved } = useConfigStore.getState()
    const normalized = normalizeDraft(draft)
    try {
      const errors = await window.api.saveConfig(normalized, false)
      markSaved()
      setStatus('已保存，需重启 opencode 生效')
      return { saved: true, errors }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const confirmed = window.confirm(`校验未通过：\n${message}\n\n仍要强制保存吗？`)
      if (!confirmed) {
        setStatus('已取消保存')
        return { saved: false, errors: [message] }
      }
      await window.api.saveConfig(normalized, true)
      markSaved()
      setStatus('已强制保存，需重启 opencode 生效')
      return { saved: true, errors: [message] }
    }
  }
  return { save, status }
}
