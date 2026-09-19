import { Box, Button, HStack, IconButton, Input, Text, VStack } from '@chakra-ui/react'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { Field } from '../fields/Field'
import { MenuSelect } from '../fields/MenuSelect'
import { useConfigStore } from '../store/configStore'
import { enterStyle } from './motion'

type Rule = { action: string; resource: string; effect: 'allow' | 'ask' | 'deny' }

const EFFECTS = ['allow', 'ask', 'deny']

const ACTION_SUGGESTIONS = [
  '*',
  'read',
  'edit',
  'write',
  'apply_patch',
  'glob',
  'grep',
  'list',
  'shell',
  'subagent',
  'todowrite',
  'webfetch',
  'websearch',
  'skill',
  'lsp',
  'question',
  'external_directory'
]

function asRules(value: unknown): Rule[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const obj = (typeof item === 'object' && item !== null ? item : {}) as Partial<Rule>
    return {
      action: typeof obj.action === 'string' ? obj.action : '',
      resource: typeof obj.resource === 'string' ? obj.resource : '*',
      effect: obj.effect === 'allow' || obj.effect === 'deny' ? obj.effect : 'ask'
    }
  })
}

export function PermissionRulesEditor(): React.JSX.Element {
  const draft = useConfigStore((s) => s.draft)
  const setField = useConfigStore((s) => s.setField)
  const rules = asRules(draft.permissions)

  const commit = (next: Rule[]): void => setField(['permissions'], next, { immediate: true })

  const update = (index: number, patch: Partial<Rule>): void => {
    const next = rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule))
    commit(next)
  }

  const remove = (index: number): void => commit(rules.filter((_, i) => i !== index))

  const move = (index: number, delta: number): void => {
    const target = index + delta
    if (target < 0 || target >= rules.length) return
    const next = [...rules]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    commit(next)
  }

  return (
    <Field label="权限规则" description="按顺序匹配，最后一条匹配的规则生效。action 支持通配 *。">
      {rules.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          未配置权限规则
        </Text>
      ) : (
        <VStack align="stretch" gap="8px" mb="8px">
          {rules.map((rule, index) => (
            <Box
              key={index}
              className="oc-enter"
              style={enterStyle(index)}
              borderWidth="1px"
              borderColor="border.default"
              borderRadius="card"
              p="10px"
              bg="bg.default"
            >
              <HStack gap="8px" align="start">
                <Box w="140px" flexShrink={0}>
                  <Input
                    aria-label={`权限动作 ${index}`}
                    list="oc-permission-actions"
                    size="sm"
                    fontFamily="mono"
                    value={rule.action}
                    placeholder="action"
                    onChange={(e) => update(index, { action: e.target.value })}
                  />
                </Box>
                <Input
                  aria-label={`资源 ${index}`}
                  size="sm"
                  fontFamily="mono"
                  value={rule.resource}
                  placeholder="*"
                  onChange={(e) => update(index, { resource: e.target.value })}
                />
                <Box w="120px" flexShrink={0}>
                  <MenuSelect
                    ariaLabel={`效果 ${index}`}
                    options={EFFECTS}
                    value={rule.effect}
                    allowEmpty={false}
                    onChange={(v) => update(index, { effect: v as Rule['effect'] })}
                  />
                </Box>
                <HStack gap="2px" flexShrink={0}>
                  <IconButton
                    aria-label={`上移规则 ${index}`}
                    size="sm"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={14} />
                  </IconButton>
                  <IconButton
                    aria-label={`下移规则 ${index}`}
                    size="sm"
                    variant="ghost"
                    disabled={index === rules.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={14} />
                  </IconButton>
                  <IconButton
                    aria-label={`删除规则 ${index}`}
                    size="sm"
                    variant="ghost"
                    colorPalette="error"
                    onClick={() => remove(index)}
                  >
                    ×
                  </IconButton>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
      <datalist id="oc-permission-actions">
        {ACTION_SUGGESTIONS.map((action) => (
          <option key={action} value={action} />
        ))}
      </datalist>
      <Button
        size="sm"
        variant="outline"
        onClick={() => commit([...rules, { action: '', resource: '*', effect: 'ask' }])}
      >
        <Plus size={14} />
        添加规则
      </Button>
    </Field>
  )
}
