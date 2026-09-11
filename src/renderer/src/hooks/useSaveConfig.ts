import { useState } from 'react'
import { useConfigStore } from '../store/configStore'
import { normalizeDraft } from '../store/normalize'

export type SaveResult = { saved: boolean; errors: string[] }

function errorDetail(error: unknown): string[] {
  const message = error instanceof Error ? error.message : String(error)
  const errors = (error as { errors?: string[] }).errors
  return Array.isArray(errors) && errors.length > 0 ? errors : [message]
}

export function useSaveConfig(): {
  save: () => Promise<SaveResult>
  forceSave: () => Promise<SaveResult>
  status: string
  saveErrors: string[]
} {
  const [status, setStatus] = useState('')
  const [saveErrors, setSaveErrors] = useState<string[]>([])

  const save = async (): Promise<SaveResult> => {
    const { draft, markSaved } = useConfigStore.getState()
    const normalized = normalizeDraft(draft)
    try {
      const errors = await window.api.saveConfig(normalized, false)
      markSaved()
      setSaveErrors([])
      setStatus('已保存，需重启 opencode 生效')
      return { saved: true, errors }
    } catch (error) {
      const detail = errorDetail(error)
      setSaveErrors(detail)
      setStatus('校验未通过，请处理后重试或强制保存')
      return { saved: false, errors: detail }
    }
  }

  const forceSave = async (): Promise<SaveResult> => {
    const { draft, markSaved } = useConfigStore.getState()
    const normalized = normalizeDraft(draft)
    try {
      const errors = await window.api.saveConfig(normalized, true)
      markSaved()
      setSaveErrors([])
      setStatus('已强制保存，需重启 opencode 生效')
      return { saved: true, errors }
    } catch (error) {
      const detail = errorDetail(error)
      setSaveErrors(detail)
      setStatus('强制保存失败')
      return { saved: false, errors: detail }
    }
  }

  return { save, forceSave, status, saveErrors }
}
