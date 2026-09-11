import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export function readAgentsFile(file: string): string {
  if (!existsSync(file)) return ''
  return readFileSync(file, 'utf8')
}

export function writeAgentsFile(file: string, content: string): void {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content, { encoding: 'utf8' })
}
