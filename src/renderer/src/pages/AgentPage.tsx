import { Box, HStack, Text } from '@chakra-ui/react'
import { Section } from '../components/Section'
import { ListEditor } from '../components/ListEditor'
import { NumberField, SelectField, SwitchField, TextField } from '../fields/controls'
import { useField } from '../fields/useField'
import { PERMISSION_KEYS } from './PermissionPage'

const ACTIONS = ['', 'allow', 'ask', 'deny']

const SELECT_STYLE: React.CSSProperties = {
  height: '32px',
  borderRadius: '8px',
  border: '1px solid var(--chakra-colors-border-default)',
  background: 'var(--chakra-colors-bg-default)',
  color: 'inherit',
  padding: '0 8px'
}

function AgentPermissionRow({
  agent,
  permKey
}: {
  agent: string
  permKey: string
}): React.JSX.Element {
  const { value, set, clear } = useField(['agent', agent, 'permission', permKey])
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

export function AgentPage(): React.JSX.Element {
  return (
    <Section title="Agents" description="自定义 agent 的模型、模式与权限。">
      <ListEditor
        path={['agent']}
        addLabel="添加 Agent"
        inputLabel="新 Agent 名称"
        placeholder="reviewer"
      >
        {(agent) => (
          <>
            <TextField path={['agent', agent, 'description']} label="描述" />
            <SelectField
              path={['agent', agent, 'mode']}
              label="模式"
              options={['primary', 'subagent', 'all']}
            />
            <TextField path={['agent', agent, 'model']} label="模型" placeholder="provider/model" />
            <TextField path={['agent', agent, 'variant']} label="模型变体" />
            <TextField
              path={['agent', agent, 'color']}
              label="颜色"
              placeholder="#4F46E5 或主题色名"
            />
            <NumberField path={['agent', agent, 'temperature']} label="温度" />
            <NumberField path={['agent', agent, 'top_p']} label="Top P" />
            <NumberField path={['agent', agent, 'steps']} label="最大步数" />
            <SwitchField path={['agent', agent, 'hidden']} label="在自动补全中隐藏" />
            <SwitchField path={['agent', agent, 'disable']} label="禁用" />
            <TextField path={['agent', agent, 'prompt']} label="Prompt" multiline />
            <Box mt="16px">
              <Text fontSize="sm" fontWeight="medium" mb="8px">
                权限
              </Text>
              {PERMISSION_KEYS.map((permKey) => (
                <AgentPermissionRow key={permKey} agent={agent} permKey={permKey} />
              ))}
            </Box>
          </>
        )}
      </ListEditor>
    </Section>
  )
}
