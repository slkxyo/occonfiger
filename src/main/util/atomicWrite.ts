import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomBytes } from 'node:crypto'

export function writeFileAtomic(
  file: string,
  content: string,
  options: { mode?: number } = {}
): void {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.tmp-${process.pid}-${randomBytes(4).toString('hex')}`
  try {
    writeFileSync(tmp, content, { encoding: 'utf8', mode: options.mode })
    renameSync(tmp, file)
  } catch (error) {
    rmSync(tmp, { force: true })
    throw error
  }
}
