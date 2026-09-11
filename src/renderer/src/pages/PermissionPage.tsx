import { Box, Button, HStack, IconButton, Input, Text } from '@chakra-ui/react'
import { Section } from '../components/Section'
import { useField } from '../fields/useField'
import { useConfigStore } from '../store/configStore'
import { getAt } from '../fields/path'

export const PERMISSION_KEYS = [
  'read',
  'edit',
  'glob',
  'grep',
  'list',
  'task',
  'external_directory',
  'todowrite',
  'question',
  'webfetch',
  'websearch',
  'lsp',
  'doom_loop',
  'skill'
] as const

const ACTIONS = ['', 'allow', 'ask', 'deny']
const RULE_ACTIONS = ['allow', 'ask', 'deny']

const SELECT_STYLE: React.CSSProperties = {
  height: '32px',
  borderRadius: '8px',
  border: '1px solid var(--chakra-colors-border-default)',
  background: 'var(--chakra-colors-bg-default)',
  color: 'inherit',
  padding: '0 8px'
}

function PermissionRow({ permKey }: { permKey: string }): React.JSX.Element {
  const { value, set, clear } = useField(['permission', permKey])
  const action = typeof value === 'string' ? value : ''
  return (
    <HStack mb="8px">
      <Text fontSize="sm" fontFamily="mono" w="180px">
        {permKey}
      </Text>
      <select
        aria-label={permKey}
        value={action}
        onChange={(e) => (e.target.value === '' ? clear() : set(e.target.value))}
        style={SELECT_STYLE}
      >
        {ACTIONS.map((action) => (
          <option key={action || 'unset'} value={action}>
            {action || '（未设置）'}
          </option>
        ))}
      </select>
    </HStack>
  )
}

function GlobalBashAction(): React.JSX.Element {
  const { value, set, clear } = useField(['permission', 'bash'])
  const setField = useConfigStore((s) => s.setField)
  const action = typeof value === 'string' ? value : ''
  return (
    <Box mt="16px">
      <HStack justify="space-between" mb="8px">
        <Text fontSize="sm" fontWeight="medium">
          bash 全局动作
        </Text>
        <Button
          aria-label="改为规则模式"
          size="sm"
          variant="ghost"
          onClick={() => setField(['permission', 'bash'], {})}
        >
          改为规则模式
        </Button>
      </HStack>
      <select
        aria-label="bash 全局动作"
        value={action}
        onChange={(e) => (e.target.value === '' ? clear() : set(e.target.value))}
        style={SELECT_STYLE}
      >
        {ACTIONS.map((action) => (
          <option key={action || 'unset'} value={action}>
            {action || '（未设置）'}
          </option>
        ))}
      </select>
    </Box>
  )
}

function BashRuleEditor(): React.JSX.Element {
  const draft = useConfigStore((s) => s.draft)
  const setField = useConfigStore((s) => s.setField)
  const deleteField = useConfigStore((s) => s.deleteField)
  const rules = getAt(draft, ['permission', 'bash'])
  const entries =
    rules && typeof rules === 'object' && !Array.isArray(rules)
      ? Object.entries(rules as Record<string, string>)
      : []

  return (
    <Box mt="16px">
      <HStack justify="space-between" mb="8px">
        <Text fontSize="sm" fontWeight="medium">
          bash 模式规则（后面的规则覆盖前面的）
        </Text>
        <Button
          aria-label="使用全局动作"
          size="sm"
          variant="ghost"
          onClick={() => setField(['permission', 'bash'], 'ask')}
        >
          使用全局动作
        </Button>
      </HStack>
      {entries.map(([pattern, action]) => (
        <HStack key={pattern} mb="8px">
          <Input
            aria-label={`bash 模式 ${pattern}`}
            defaultValue={pattern}
            onBlur={(e) => {
              const next = e.target.value
              if (next === pattern) return
              deleteField(['permission', 'bash', pattern])
              setField(['permission', 'bash', next], action)
            }}
          />
          <select
            aria-label={`bash 动作 ${pattern}`}
            defaultValue={action}
            onChange={(e) => setField(['permission', 'bash', pattern], e.target.value)}
            style={SELECT_STYLE}
          >
            {RULE_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <IconButton
            aria-label={`删除规则 ${pattern}`}
            size="sm"
            variant="ghost"
            onClick={() => deleteField(['permission', 'bash', pattern])}
          >
            ×
          </IconButton>
        </HStack>
      ))}
      <HStack>
        <Input aria-label="新 bash 模式" placeholder="git *" id="new-bash-pattern" />
        <select
          aria-label="新 bash 动作"
          id="new-bash-action"
          defaultValue="ask"
          style={SELECT_STYLE}
        >
          {RULE_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <IconButton
          aria-label="添加 bash 规则"
          size="sm"
          onClick={() => {
            const pattern = (document.getElementById('new-bash-pattern') as HTMLInputElement)?.value
            const action = (document.getElementById('new-bash-action') as HTMLSelectElement)?.value
            if (pattern) setField(['permission', 'bash', pattern], action)
          }}
        >
          +
        </IconButton>
      </HStack>
    </Box>
  )
}

function BashRules(): React.JSX.Element {
  const bash = useConfigStore((s) => getAt(s.draft, ['permission', 'bash']))
  return typeof bash === 'string' ? <GlobalBashAction /> : <BashRuleEditor />
}

export function PermissionPage(): React.JSX.Element {
  return (
    <Section title="权限" description="控制各工具的动作：allow / ask / deny。">
      {PERMISSION_KEYS.map((key) => (
        <PermissionRow key={key} permKey={key} />
      ))}
      <BashRules />
    </Section>
  )
}
