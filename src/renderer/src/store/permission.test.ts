import { describe, expect, it } from 'vitest'
import { permissionDefault } from './permission'

describe('permissionDefault', () => {
  it('fills a missing permission with allow', () => {
    expect(permissionDefault({})).toEqual({ path: ['permission'], value: { '*': 'allow' } })
  })

  it('fills only the star key when permission lacks it', () => {
    expect(permissionDefault({ permission: { bash: 'deny' } })).toEqual({
      path: ['permission', '*'],
      value: 'allow'
    })
  })

  it('leaves an existing permission untouched', () => {
    expect(permissionDefault({ permission: { '*': 'deny' } })).toBeNull()
    expect(permissionDefault({ permission: 'ask' })).toBeNull()
  })
})
