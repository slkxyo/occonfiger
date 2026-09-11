import { describe, expect, it } from 'vitest'
import { normalizeDraft } from './normalize'
import { getAt, setAt, deleteAt } from '../fields/path'

describe('round-trip safety', () => {
  it('keeps unknown and deprecated fields untouched', () => {
    const loaded = {
      $schema: 'https://opencode.ai/config.json',
      model: 'a/b',
      mode: { build: { temperature: 0.2 } },
      reference: { old: '../old' },
      totally_unknown: { keep: true }
    }
    const draft = structuredClone(loaded)
    setAt(draft, ['model'], 'c/d')
    const written = normalizeDraft(draft)
    expect(written.mode).toEqual(loaded.mode)
    expect(written.reference).toEqual(loaded.reference)
    expect(written.totally_unknown).toEqual(loaded.totally_unknown)
    expect(written.model).toBe('c/d')
  })

  it('editing a nested field leaves siblings intact', () => {
    const draft: Record<string, unknown> = {
      permission: { edit: 'allow', bash: { 'git *': 'allow' } }
    }
    setAt(draft, ['permission', 'edit'], 'deny')
    expect(getAt(draft, ['permission', 'bash'])).toEqual({ 'git *': 'allow' })
    deleteAt(draft, ['permission', 'edit'])
    expect(draft.permission).toEqual({ bash: { 'git *': 'allow' } })
  })
})
