import { describe, expect, it } from 'vitest'
import { normalizeDraft } from './normalize'

describe('normalizeDraft', () => {
  it('converts autoupdate string to boolean', () => {
    expect(normalizeDraft({ autoupdate: 'true' }).autoupdate).toBe(true)
    expect(normalizeDraft({ autoupdate: 'false' }).autoupdate).toBe(false)
    expect(normalizeDraft({ autoupdate: 'notify' }).autoupdate).toBe('notify')
  })

  it('strips reference kind and prunes unused branch', () => {
    const result = normalizeDraft({
      references: { docs: { kind: 'path', path: '../docs', description: 'x' } }
    })
    expect(result.references).toEqual({ docs: { path: '../docs', description: 'x' } })
  })

  it('keeps repository references', () => {
    const result = normalizeDraft({
      references: { sdk: { kind: 'repository', repository: 'a/b', branch: 'main' } }
    })
    expect(result.references).toEqual({ sdk: { repository: 'a/b', branch: 'main' } })
  })

  it('does not mutate the input', () => {
    const input = { autoupdate: 'true' }
    normalizeDraft(input)
    expect(input.autoupdate).toBe('true')
  })
})
