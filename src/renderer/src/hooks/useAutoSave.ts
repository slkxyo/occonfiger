import { useCallback, useEffect, useRef } from 'react'
import { useConfigStore } from '../store/configStore'
import { normalizeDraft } from '../store/normalize'

function errorDetail(error: unknown): string[] {
  const message = error instanceof Error ? error.message : String(error)
  const errors = (error as { errors?: string[] }).errors
  return Array.isArray(errors) && errors.length > 0 ? errors : [message]
}

export function useAutoSave(): {
  forceSave: () => Promise<void>
  status: string
  saveErrors: string[]
} {
  const revision = useConfigStore((s) => s.revision)
  const saveDelay = useConfigStore((s) => s.saveDelay)
  const saveState = useConfigStore((s) => s.saveState)
  const saveErrors = useConfigStore((s) => s.saveErrors)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSave = useCallback(async (force: boolean): Promise<void> => {
    const { draft, revision, beginSave, markSaved, markSaveError } = useConfigStore.getState()
    beginSave()
    try {
      await window.api.saveConfig(normalizeDraft(draft), force)
      markSaved(revision)
    } catch (error) {
      markSaveError(errorDetail(error))
    }
  }, [])

  useEffect(() => {
    if (revision === 0) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = null
      void runSave(false)
    }, saveDelay)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [revision, saveDelay, runSave])

  const forceSave = useCallback((): Promise<void> => runSave(true), [runSave])

  const status =
    saveState === 'saving'
      ? '保存中…'
      : saveState === 'saved'
        ? '已保存，需重启 opencode 生效'
        : saveState === 'error'
          ? '校验未通过，请处理后重试或强制保存'
          : ''

  return { forceSave, status, saveErrors }
}
