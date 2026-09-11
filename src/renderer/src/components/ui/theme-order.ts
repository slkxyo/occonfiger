const ORDER = ['light', 'dark', 'system'] as const
export type ThemeName = (typeof ORDER)[number]

export function nextTheme(current: string | undefined): ThemeName {
  const index = ORDER.indexOf((current ?? 'system') as ThemeName)
  return ORDER[(index + 1) % ORDER.length]
}
