import Ajv2020 from 'ajv/dist/2020'
import type { ValidateFunction } from 'ajv'
import { loadBuiltinSchema } from './builtin'

export type ValidationResult = { valid: boolean; errors: string[] }

const externalStubs = [
  {
    $id: 'https://models.dev/model-schema.json',
    $defs: { Model: true }
  }
]

let cached: ValidateFunction | null = null

function getValidator(): ValidateFunction {
  if (cached) return cached
  const ajv = new Ajv2020({ allErrors: true, strict: false, allowUnionTypes: true })
  for (const stub of externalStubs) ajv.addSchema(stub)
  cached = ajv.compile(loadBuiltinSchema())
  return cached
}

export function validateConfig(data: unknown): ValidationResult {
  const validate = getValidator()
  const valid = validate(data) as boolean
  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath || '/'} ${e.message ?? 'invalid'}`
  )
  return { valid, errors }
}
