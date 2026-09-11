import { describe, expect, it } from 'vitest'
import { appName } from './appName'

describe('smoke', () => {
  it('exposes app name', () => {
    expect(appName()).toBe('occonfiger')
  })
})
