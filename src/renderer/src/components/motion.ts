import type { CSSProperties } from 'react'

export function enterDelay(index: number, step = 25, max = 150): string {
  return `${Math.min(index * step, max)}ms`
}

export function enterStyle(index = 0): CSSProperties {
  return { animationDelay: enterDelay(index) }
}
