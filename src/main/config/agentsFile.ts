import { existsSync, readFileSync } from 'node:fs'
import { writeFileAtomic } from '../util/atomicWrite'

export function readAgentsFile(file: string): string {
  if (!existsSync(file)) return ''
  return readFileSync(file, 'utf8')
}

export function writeAgentsFile(file: string, content: string): void {
  writeFileAtomic(file, content)
}
