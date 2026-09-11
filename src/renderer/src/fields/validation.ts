export function validateProviderModel(value: string): string | null {
  if (value === '') return null
  return /^[^/\s]+\/[^/\s]+$/.test(value) ? null : '格式应为 provider/model'
}

export function validateAgentName(value: string): string | null {
  if (value === '') return null
  return /^\S+$/.test(value) ? null : '不能包含空白字符'
}
