type Obj = Record<string, unknown>

function isObject(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeReferences(references: unknown): unknown {
  if (!isObject(references)) return references
  const output: Obj = {}
  for (const [alias, value] of Object.entries(references)) {
    if (!isObject(value)) {
      output[alias] = value
      continue
    }
    const { kind, ...rest } = value
    if (kind === 'path') delete rest.repository
    if (kind === 'repository') delete rest.path
    output[alias] = rest
  }
  return output
}

export function normalizeDraft(draft: Obj): Obj {
  const output = structuredClone(draft)
  if (output.autoupdate === 'true') output.autoupdate = true
  else if (output.autoupdate === 'false') output.autoupdate = false
  if (output.references) output.references = normalizeReferences(output.references)
  if (!output.$schema) output.$schema = 'https://opencode.ai/config.json'
  return output
}
