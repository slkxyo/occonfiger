export type PermissionDefault = { path: string[]; value: unknown }

export function permissionDefault(config: Record<string, unknown>): PermissionDefault | null {
  const permission = config.permission
  if (typeof permission === 'string') return null
  if (typeof permission === 'object' && permission !== null && !Array.isArray(permission)) {
    const star = (permission as Record<string, unknown>)['*']
    if (typeof star === 'string') return null
    return { path: ['permission', '*'], value: 'allow' }
  }
  return { path: ['permission'], value: { '*': 'allow' } }
}
