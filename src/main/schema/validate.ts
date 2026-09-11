import Ajv2020 from 'ajv/dist/2020'
import { loadBuiltinSchema } from './builtin'

export type ValidationResult = { valid: boolean; errors: string[] }

const externalStubs = [
  {
    $id: 'https://models.dev/model-schema.json',
    $defs: { Model: true }
  }
]

export function validateConfig(data: unknown): ValidationResult {
  const ajv = new Ajv2020({ allErrors: true, strict: false, allowUnionTypes: true })
  for (const stub of externalStubs) ajv.addSchema(stub)
  const validate = ajv.compile(loadBuiltinSchema())
  const valid = validate(data) as boolean
  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath || '/'} ${e.message ?? 'invalid'}`
  )
  return { valid, errors }
}
